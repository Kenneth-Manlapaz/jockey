-- =====================================================================
-- PHILIPPINE JOCKEY - MariaDB 10.5+ - CHECKS, TRIGGERS, VIEWS, SEEDS
-- File 2 of 2. Run in MariaDB AFTER 01_philippine_jockey_tables.sql.
-- Do NOT import this into DrawDB (it can't parse triggers/views).
--
-- Using the mysql/mariadb CLI this works as-is (DELIMITER is a client
-- command). In GUI tools like HeidiSQL or DBeaver, run the trigger
-- blocks as single statements without the DELIMITER lines.
-- =====================================================================

-- ============================ 1. CHECKS ==============================
-- MariaDB 10.2.1+ enforces CHECK constraints.

ALTER TABLE users
  ADD CONSTRAINT chk_users_mobile CHECK (mobile_number IS NULL OR mobile_number REGEXP '^[+][1-9][0-9]{7,14}$');

ALTER TABLE user_settings
  ADD CONSTRAINT chk_settings_wager CHECK (default_wager_amount > 0);

ALTER TABLE horses
  ADD CONSTRAINT chk_horses_birth_year CHECK (birth_year IS NULL OR birth_year BETWEEN 1990 AND 2100);

ALTER TABLE races
  ADD CONSTRAINT chk_races_distance  CHECK (distance_m > 0),
  ADD CONSTRAINT chk_races_racenum   CHECK (race_number > 0),
  ADD CONSTRAINT chk_races_betwindow CHECK (betting_closes_at IS NULL OR betting_opens_at IS NULL OR betting_closes_at > betting_opens_at);

ALTER TABLE race_entries
  ADD CONSTRAINT chk_entries_number CHECK (horse_number > 0),
  ADD CONSTRAINT chk_entries_color  CHECK (badge_color IS NULL OR badge_color REGEXP '^#[0-9A-Fa-f]{6}$'),
  ADD CONSTRAINT chk_entries_odds   CHECK (current_odds IS NULL OR current_odds >= 1),
  ADD CONSTRAINT chk_entries_morning CHECK (morning_odds IS NULL OR morning_odds >= 1);

ALTER TABLE entry_odds_history
  ADD CONSTRAINT chk_oddshist_odds CHECK (odds >= 1);

ALTER TABLE game_types
  ADD CONSTRAINT chk_game_selections CHECK (selections_required > 0),
  ADD CONSTRAINT chk_game_wager      CHECK (max_wager >= min_wager);

ALTER TABLE wager_presets
  ADD CONSTRAINT chk_preset_amount CHECK (amount > 0);

ALTER TABLE race_results
  ADD CONSTRAINT chk_result_time CHECK (winning_time_ms IS NULL OR winning_time_ms > 0);

ALTER TABLE race_result_placements
  ADD CONSTRAINT chk_place_pos CHECK (finish_position > 0);

ALTER TABLE race_dividends
  ADD CONSTRAINT chk_div_amount CHECK (dividend_amount >= 0);

ALTER TABLE race_pools
  ADD CONSTRAINT chk_pool_takeout CHECK (takeout_pct BETWEEN 0 AND 100);

ALTER TABLE bets
  ADD CONSTRAINT chk_bets_wager  CHECK (wager_amount > 0),
  ADD CONSTRAINT chk_bets_won    CHECK (status <> 'won' OR payout_amount IS NOT NULL),
  ADD CONSTRAINT chk_bets_settle CHECK (status = 'pending' OR settled_at IS NOT NULL);

ALTER TABLE bet_selections
  ADD CONSTRAINT chk_sel_leg CHECK (leg_position > 0);

ALTER TABLE bet_drafts
  ADD CONSTRAINT chk_draft_wager CHECK (wager_amount IS NULL OR wager_amount > 0);

-- Exactly one favorite target, and it must match target_type
ALTER TABLE favorites
  ADD CONSTRAINT chk_fav_one_target CHECK (
    (horse_id IS NOT NULL) + (jockey_id IS NOT NULL) + (trainer_id IS NOT NULL)
    + (race_id IS NOT NULL) + (venue_id IS NOT NULL) = 1
    AND (
      (target_type = 'horse'   AND horse_id   IS NOT NULL) OR
      (target_type = 'jockey'  AND jockey_id  IS NOT NULL) OR
      (target_type = 'trainer' AND trainer_id IS NOT NULL) OR
      (target_type = 'race'    AND race_id    IS NOT NULL) OR
      (target_type = 'venue'   AND venue_id   IS NOT NULL)
    )
  );


-- ============================ 2. TRIGGERS ============================

DELIMITER $$

-- Before a bet is saved:
--  1) validate race is open and the wager is within the game's limits
--  2) generate the ticket number PJA-DEMO-YYMMDD-NNNN (Manila date, UTC+8)
CREATE TRIGGER trg_bets_before_insert
BEFORE INSERT ON bets
FOR EACH ROW
BEGIN
  DECLARE v_status  VARCHAR(20);
  DECLARE v_closes  DATETIME;
  DECLARE v_min     DECIMAL(12,2);
  DECLARE v_max     DECIMAL(12,2);
  DECLARE v_date    DATE;
  DECLARE v_seq     INT UNSIGNED;

  SELECT status, betting_closes_at INTO v_status, v_closes
    FROM races WHERE id = NEW.race_id;

  IF v_status <> 'upcoming' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Betting is closed: race is not upcoming';
  END IF;
  IF v_closes IS NOT NULL AND UTC_TIMESTAMP() > v_closes THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Betting window has closed for this race';
  END IF;

  SELECT min_wager, max_wager INTO v_min, v_max
    FROM game_types WHERE id = NEW.game_type_id;

  IF NEW.wager_amount < v_min OR NEW.wager_amount > v_max THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Wager is outside the allowed range for this game';
  END IF;

  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    SET v_date = DATE(UTC_TIMESTAMP() + INTERVAL 8 HOUR);
    INSERT INTO ticket_counters (counter_date, last_seq) VALUES (v_date, 1)
      ON DUPLICATE KEY UPDATE last_seq = last_seq + 1;
    SELECT last_seq INTO v_seq FROM ticket_counters WHERE counter_date = v_date;

    SET NEW.ticket_number = CONCAT(
      'PJA-', IF(NEW.is_simulated, 'DEMO', 'LIVE'), '-',
      DATE_FORMAT(v_date, '%y%m%d'), '-', LPAD(v_seq, 4, '0'));
  END IF;
END$$

-- Log every status change on a bet (pending -> won/lost/void)
CREATE TRIGGER trg_bets_after_update
AFTER UPDATE ON bets
FOR EACH ROW
BEGIN
  IF NOT (NEW.status <=> OLD.status) THEN
    INSERT INTO bet_status_history (bet_id, from_status, to_status, reason)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.void_reason);
  END IF;
END$$

-- Keep races.entries_count in sync ("12 horses")
CREATE TRIGGER trg_entries_after_insert
AFTER INSERT ON race_entries
FOR EACH ROW
BEGIN
  UPDATE races SET entries_count =
    (SELECT COUNT(*) FROM race_entries WHERE race_id = NEW.race_id AND status IN ('confirmed','pending'))
  WHERE id = NEW.race_id;
END$$

CREATE TRIGGER trg_entries_after_update
AFTER UPDATE ON race_entries
FOR EACH ROW
BEGIN
  UPDATE races SET entries_count =
    (SELECT COUNT(*) FROM race_entries WHERE race_id = NEW.race_id AND status IN ('confirmed','pending'))
  WHERE id = NEW.race_id;
END$$

CREATE TRIGGER trg_entries_after_delete
AFTER DELETE ON race_entries
FOR EACH ROW
BEGIN
  UPDATE races SET entries_count =
    (SELECT COUNT(*) FROM race_entries WHERE race_id = OLD.race_id AND status IN ('confirmed','pending'))
  WHERE id = OLD.race_id;
END$$

DELIMITER ;


-- ============================= 3. VIEWS ==============================

-- Race Schedule + Home "Today's races"
CREATE OR REPLACE VIEW v_race_schedule AS
SELECT r.id, r.race_date, r.race_number, r.name, r.status, r.post_time,
       r.distance_m, r.surface, r.entries_count, r.is_featured, r.is_live,
       v.name AS venue_name, c.name AS club_name
FROM races r
JOIN venues v ON v.id = r.venue_id
LEFT JOIN racing_clubs c ON c.id = r.club_id;

-- Race Entries list
CREATE OR REPLACE VIEW v_race_entries AS
SELECT e.id AS entry_id, e.race_id, e.horse_number, e.badge_color, e.status,
       e.weight_kg, e.current_odds,
       h.name AS horse_name, h.photo_url AS horse_photo,
       j.full_name AS jockey_name, t.full_name AS trainer_name, o.name AS owner_name
FROM race_entries e
JOIN horses h ON h.id = e.horse_id
LEFT JOIN jockeys  j ON j.id = e.jockey_id
LEFT JOIN trainers t ON t.id = e.trainer_id
LEFT JOIN owners   o ON o.id = e.owner_id;

-- Betting History cards and Ticket screen
CREATE OR REPLACE VIEW v_betting_history AS
SELECT b.id, b.user_id, b.ticket_number, b.status, b.wager_amount, b.payout_amount,
       b.estimated_return, b.placed_at, b.is_simulated,
       r.name AS race_name, r.race_number, r.race_date,
       g.code AS game_code, g.name AS game_name,
       (SELECT GROUP_CONCAT(CONCAT(e.horse_number, ' ', h.name)
                            ORDER BY s.leg_position SEPARATOR ', ')
          FROM bet_selections s
          JOIN race_entries e ON e.id = s.entry_id
          JOIN horses h ON h.id = e.horse_id
         WHERE s.bet_id = b.id) AS selection_text
FROM bets b
JOIN races r ON r.id = b.race_id
JOIN game_types g ON g.id = b.game_type_id;

-- Official Results podium (top 3)
CREATE OR REPLACE VIEW v_race_podium AS
SELECT rr.race_id, rr.status AS result_status, rr.winning_time_ms,
       p.finish_position, e.horse_number, h.name AS horse_name,
       h.photo_url, j.full_name AS jockey_name
FROM race_results rr
JOIN race_result_placements p ON p.result_id = rr.id
JOIN race_entries e ON e.id = p.entry_id
JOIN horses h ON h.id = e.horse_id
LEFT JOIN jockeys j ON j.id = e.jockey_id
WHERE p.finish_position <= 3;


-- ========================= 4. REFERENCE SEEDS ========================

INSERT IGNORE INTO game_types
  (code, name, short_description, selections_required, is_ordered, max_finishing_positions, sort_order) VALUES
  ('WIN',              'Win',              'Choose the horse that finishes first.',            1, TRUE,  1, 1),
  ('PLACE',            'Place',            'Choose a horse to finish first or second.',        1, TRUE,  2, 2),
  ('FORECAST',         'Forecast',         'Pick the first two finishers in order.',           2, TRUE,  2, 3),
  ('REVERSE_FORECAST', 'Reverse Forecast', 'Pick the top two finishers in either order.',      2, FALSE, 2, 4),
  ('TRIFECTA',         'Trifecta',         'Pick the first three finishers in exact order.',   3, TRUE,  3, 5);

INSERT IGNORE INTO wager_presets (amount, sort_order) VALUES (20,1), (50,2), (100,3), (200,4);

INSERT IGNORE INTO facilities (code, label) VALUES
  ('grandstand',     'Grandstand viewing'),
  ('paddock',        'Paddock viewing'),
  ('betting_lounge', 'Betting lounge'),
  ('accessible',     'Accessible areas'),
  ('parking',        'Parking'),
  ('test_lab',       'Test Lab');

INSERT IGNORE INTO race_categories (code, name) VALUES
  ('MAIDEN','Maiden'), ('HANDICAP','Handicap'), ('STAKES','Stakes'),
  ('CUP','Cup'), ('CLASSIC','Classic');
