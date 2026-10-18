-- =====================================================================
-- PHILIPPINE JOCKEY - MariaDB 10.5+ - TABLES ONLY
-- File 1 of 2. Import THIS file into DrawDB, and run it in MariaDB first.
-- Contains only CREATE TABLE + foreign keys (no triggers/views/checks),
-- because DrawDB's SQL importer only understands table definitions.
--
-- Create the database first:
--   CREATE DATABASE philippine_jockey CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE philippine_jockey;
-- Server time zone should be UTC. All DATETIME values are stored in UTC.
-- =====================================================================


-- ============================ 1. USERS ===============================

-- App users. utf8mb4_unicode_ci makes email lookups case-insensitive.
CREATE TABLE users (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name          VARCHAR(80)  NOT NULL,
  last_name           VARCHAR(80)  NOT NULL,
  email               VARCHAR(255) NOT NULL,
  mobile_number       VARCHAR(20)  NULL,
  password_hash       VARCHAR(255) NOT NULL,
  avatar_url          VARCHAR(500) NULL,
  role                ENUM('user','admin','steward') NOT NULL DEFAULT 'user',
  email_verified_at   DATETIME NULL,
  mobile_verified_at  DATETIME NULL,
  terms_accepted_at   DATETIME NOT NULL,
  terms_version       VARCHAR(20) NOT NULL,
  privacy_version     VARCHAR(20) NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at       DATETIME NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_mobile (mobile_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Login sessions ("Remember me", multi-device)
CREATE TABLE user_sessions (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id             INT UNSIGNED NOT NULL,
  refresh_token_hash  VARCHAR(255) NOT NULL,
  remember_me         BOOLEAN NOT NULL DEFAULT FALSE,
  device_name         VARCHAR(120) NULL,
  device_platform     VARCHAR(30) NULL,
  ip_address          VARCHAR(45) NULL,
  user_agent          VARCHAR(500) NULL,
  expires_at          DATETIME NOT NULL,
  revoked_at          DATETIME NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token (refresh_token_hash),
  KEY idx_sessions_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- "Forgot password?"
CREATE TABLE password_reset_tokens (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  DATETIME NOT NULL,
  used_at     DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reset_token (token_hash),
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Profile > Settings (1:1 with users)
CREATE TABLE user_settings (
  user_id                INT UNSIGNED NOT NULL,
  language               VARCHAR(10) NOT NULL DEFAULT 'en',
  timezone               VARCHAR(50) NOT NULL DEFAULT 'Asia/Manila',
  default_wager_amount   DECIMAL(12,2) NOT NULL DEFAULT 50.00,
  push_enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled            BOOLEAN NOT NULL DEFAULT FALSE,
  notify_race_reminders  BOOLEAN NOT NULL DEFAULT TRUE,
  notify_results         BOOLEAN NOT NULL DEFAULT TRUE,
  notify_bet_settled     BOOLEAN NOT NULL DEFAULT TRUE,
  show_odds_decimal      BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_consent      BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ====================== 2. VENUES / RACECOURSES ======================

-- "Philippine Racing Club", "Manila Turf Club"
CREATE TABLE racing_clubs (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(150) NOT NULL,
  short_name   VARCHAR(50) NULL,
  logo_url     VARCHAR(500) NULL,
  website_url  VARCHAR(500) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clubs_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Racecourse Profile screen ("Sample Racing Venue")
CREATE TABLE venues (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  club_id         INT UNSIGNED NULL,
  name            VARCHAR(150) NOT NULL,
  tagline         VARCHAR(200) NULL,
  description     TEXT NULL,
  city            VARCHAR(100) NULL,
  province        VARCHAR(100) NULL,
  country_code    CHAR(2) NOT NULL DEFAULT 'PH',
  address         VARCHAR(500) NULL,
  latitude        DECIMAL(9,6) NULL,
  longitude       DECIMAL(9,6) NULL,
  hero_image_url  VARCHAR(500) NULL,
  capacity        INT UNSIGNED NULL,
  is_fictional    BOOLEAN NOT NULL DEFAULT TRUE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_venues_club FOREIGN KEY (club_id) REFERENCES racing_clubs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- "Track surfaces": Turf / Dirt
CREATE TABLE venue_track_surfaces (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  venue_id         INT UNSIGNED NOT NULL,
  surface          ENUM('turf','dirt','synthetic') NOT NULL,
  circumference_m  INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_venue_surface (venue_id, surface),
  CONSTRAINT fk_surfaces_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- "Course configurations": Main Oval, Sprint Course, Extended Route
CREATE TABLE venue_courses (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  venue_id          INT UNSIGNED NOT NULL,
  surface_id        INT UNSIGNED NULL,
  name              VARCHAR(100) NOT NULL,
  min_distance_m    INT UNSIGNED NULL,
  max_distance_m    INT UNSIGNED NULL,
  description       TEXT NULL,
  layout_image_url  VARCHAR(500) NULL,
  sort_order        INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_course_name (venue_id, name),
  CONSTRAINT fk_courses_venue   FOREIGN KEY (venue_id)   REFERENCES venues(id) ON DELETE CASCADE,
  CONSTRAINT fk_courses_surface FOREIGN KEY (surface_id) REFERENCES venue_track_surfaces(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Facility chips: Grandstand viewing, Paddock viewing, Betting lounge...
CREATE TABLE facilities (
  id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code   VARCHAR(50) NOT NULL,
  label  VARCHAR(100) NOT NULL,
  icon   VARCHAR(50) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_facilities_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE venue_facilities (
  venue_id     INT UNSIGNED NOT NULL,
  facility_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (venue_id, facility_id),
  CONSTRAINT fk_vf_venue    FOREIGN KEY (venue_id)    REFERENCES venues(id)     ON DELETE CASCADE,
  CONSTRAINT fk_vf_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ======================= 3. HORSES AND PEOPLE ========================

CREATE TABLE jockeys (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name      VARCHAR(120) NOT NULL,
  photo_url      VARCHAR(500) NULL,
  weight_kg      DECIMAL(4,1) NULL,
  career_wins    INT UNSIGNED NOT NULL DEFAULT 0,
  career_starts  INT UNSIGNED NOT NULL DEFAULT 0,
  bio            TEXT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  is_fictional   BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE trainers (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name  VARCHAR(120) NOT NULL,
  photo_url  VARCHAR(500) NULL,
  bio        TEXT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE owners (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(150) NOT NULL,
  stable_name  VARCHAR(150) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE horses (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name               VARCHAR(100) NOT NULL,
  photo_url          VARCHAR(500) NULL,
  sex                ENUM('colt','filly','gelding','mare','stallion') NULL,
  color              VARCHAR(40) NULL,
  birth_year         SMALLINT UNSIGNED NULL,
  country_of_origin  CHAR(2) NULL,
  sire               VARCHAR(100) NULL,
  dam                VARCHAR(100) NULL,
  owner_id           INT UNSIGNED NULL,
  trainer_id         INT UNSIGNED NULL,
  career_starts      INT UNSIGNED NOT NULL DEFAULT 0,
  career_wins        INT UNSIGNED NOT NULL DEFAULT 0,
  career_places      INT UNSIGNED NOT NULL DEFAULT 0,
  career_earnings    DECIMAL(14,2) NOT NULL DEFAULT 0,
  form_last5         VARCHAR(20) NULL,
  bio                TEXT NULL,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  is_fictional       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_horses_name (name),
  CONSTRAINT fk_horses_owner   FOREIGN KEY (owner_id)   REFERENCES owners(id)   ON DELETE SET NULL,
  CONSTRAINT fk_horses_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================ 4. RACES ===============================

CREATE TABLE race_categories (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code  VARCHAR(30) NOT NULL,
  name  VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_race_cat_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Home, Race Schedule, Race Detail (Overview tab)
CREATE TABLE races (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  venue_id           INT UNSIGNED NOT NULL,
  club_id            INT UNSIGNED NULL,
  course_id          INT UNSIGNED NULL,
  category_id        INT UNSIGNED NULL,
  race_number        SMALLINT UNSIGNED NOT NULL,
  name               VARCHAR(150) NOT NULL,
  description        TEXT NULL,
  race_date          DATE NOT NULL,
  post_time          DATETIME NOT NULL,
  distance_m         INT UNSIGNED NOT NULL,
  surface            ENUM('turf','dirt','synthetic') NOT NULL,
  track_condition    ENUM('firm','good','yielding','soft','heavy','fast','sloppy','muddy') NULL,
  age_restriction    VARCHAR(60) NULL,
  `status`             ENUM('upcoming','ongoing','completed','cancelled','postponed') NOT NULL DEFAULT 'upcoming',
  max_entries        SMALLINT UNSIGNED NULL,
  entries_count      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  purse_amount       DECIMAL(14,2) NULL,
  purse_currency     CHAR(3) NOT NULL DEFAULT 'PHP',
  hero_image_url     VARCHAR(500) NULL,
  is_featured        BOOLEAN NOT NULL DEFAULT FALSE,
  is_live            BOOLEAN NOT NULL DEFAULT FALSE,
  live_stream_url    VARCHAR(500) NULL,
  betting_opens_at   DATETIME NULL,
  betting_closes_at  DATETIME NULL,
  started_at         DATETIME NULL,
  finished_at        DATETIME NULL,
  is_demo            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_race_slot (venue_id, race_date, race_number),
  KEY idx_races_date_status (race_date, `status`),
  KEY idx_races_featured (is_featured, race_date),
  CONSTRAINT fk_races_venue    FOREIGN KEY (venue_id)    REFERENCES venues(id),
  CONSTRAINT fk_races_club     FOREIGN KEY (club_id)     REFERENCES racing_clubs(id)   ON DELETE SET NULL,
  CONSTRAINT fk_races_course   FOREIGN KEY (course_id)   REFERENCES venue_courses(id)  ON DELETE SET NULL,
  CONSTRAINT fk_races_category FOREIGN KEY (category_id) REFERENCES race_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Race Entries screen: numbered colored badge, weight, odds, CONFIRMED pill
CREATE TABLE race_entries (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  race_id          INT UNSIGNED NOT NULL,
  horse_id         INT UNSIGNED NOT NULL,
  jockey_id        INT UNSIGNED NULL,
  trainer_id       INT UNSIGNED NULL,
  owner_id         INT UNSIGNED NULL,
  horse_number     SMALLINT UNSIGNED NOT NULL,
  post_position    SMALLINT UNSIGNED NULL,
  badge_color      CHAR(7) NULL,
  weight_kg        DECIMAL(4,1) NULL,
  handicap_rating  SMALLINT NULL,
  morning_odds     DECIMAL(6,2) NULL,
  current_odds     DECIMAL(6,2) NULL,
  `status`           ENUM('confirmed','pending','scratched','withdrawn','reserve') NOT NULL DEFAULT 'confirmed',
  scratched_at     DATETIME NULL,
  scratch_reason   VARCHAR(255) NULL,
  silks_description VARCHAR(255) NULL,
  notes            TEXT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_entry_number (race_id, horse_number),
  UNIQUE KEY uq_entry_horse (race_id, horse_id),
  KEY idx_entries_horse (horse_id),
  CONSTRAINT fk_entries_race    FOREIGN KEY (race_id)    REFERENCES races(id)    ON DELETE CASCADE,
  CONSTRAINT fk_entries_horse   FOREIGN KEY (horse_id)   REFERENCES horses(id),
  CONSTRAINT fk_entries_jockey  FOREIGN KEY (jockey_id)  REFERENCES jockeys(id)  ON DELETE SET NULL,
  CONSTRAINT fk_entries_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL,
  CONSTRAINT fk_entries_owner   FOREIGN KEY (owner_id)   REFERENCES owners(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE entry_odds_history (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entry_id     INT UNSIGNED NOT NULL,
  odds         DECIMAL(6,2) NOT NULL,
  recorded_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_odds_hist (entry_id, recorded_at),
  CONSTRAINT fk_oddshist_entry FOREIGN KEY (entry_id) REFERENCES race_entries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Live Race Center / "Watch live" timeline
CREATE TABLE race_live_events (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  race_id      INT UNSIGNED NOT NULL,
  event_type   VARCHAR(40) NOT NULL,
  commentary   TEXT NULL,
  positions    JSON NULL,
  occurred_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_live_events (race_id, occurred_at),
  CONSTRAINT fk_live_race FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ====================== 5. GAMES / BET TYPES =========================

-- Games & Guide: WIN, PLACE, FORECAST, REVERSE FORECAST...
CREATE TABLE game_types (
  id                       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code                     VARCHAR(30) NOT NULL,
  name                     VARCHAR(60) NOT NULL,
  short_description        VARCHAR(255) NOT NULL,
  full_description         TEXT NULL,
  selections_required      TINYINT UNSIGNED NOT NULL,
  is_ordered               BOOLEAN NOT NULL,
  max_finishing_positions  TINYINT UNSIGNED NOT NULL DEFAULT 1,
  sort_order               TINYINT UNSIGNED NOT NULL DEFAULT 0,
  icon                     VARCHAR(50) NULL,
  min_wager                DECIMAL(12,2) NOT NULL DEFAULT 20.00,
  max_wager                DECIMAL(12,2) NOT NULL DEFAULT 10000.00,
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_game_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE race_games (
  race_id       INT UNSIGNED NOT NULL,
  game_type_id  INT UNSIGNED NOT NULL,
  is_open       BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (race_id, game_type_id),
  CONSTRAINT fk_rg_race FOREIGN KEY (race_id)      REFERENCES races(id)      ON DELETE CASCADE,
  CONSTRAINT fk_rg_game FOREIGN KEY (game_type_id) REFERENCES game_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quick-pick chips: P20 / P50 / P100 / P200
CREATE TABLE wager_presets (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  amount      DECIMAL(12,2) NOT NULL,
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_preset_amount (amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- "Learn more" content and the "New to racing?" card
CREATE TABLE guide_articles (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_type_id   INT UNSIGNED NULL,
  slug           VARCHAR(100) NOT NULL,
  title          VARCHAR(200) NOT NULL,
  summary        VARCHAR(300) NULL,
  body_markdown  MEDIUMTEXT NOT NULL,
  difficulty     ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  sort_order     SMALLINT NOT NULL DEFAULT 0,
  is_published   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_guide_slug (slug),
  CONSTRAINT fk_guide_game FOREIGN KEY (game_type_id) REFERENCES game_types(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ================== 6. RESULTS, DIVIDENDS, POOLS =====================

-- Race Results list (OFFICIAL / PROVISIONAL / CANCELLED) + Official Results header
CREATE TABLE race_results (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  race_id           INT UNSIGNED NOT NULL,
  `status`            ENUM('provisional','official','cancelled') NOT NULL DEFAULT 'provisional',
  winning_time_ms   INT UNSIGNED NULL,
  track_condition   ENUM('firm','good','yielding','soft','heavy','fast','sloppy','muddy') NULL,
  weather           VARCHAR(60) NULL,
  protest_filed     BOOLEAN NOT NULL DEFAULT FALSE,
  stewards_notes    TEXT NULL,
  posted_at         DATETIME NULL,
  made_official_at  DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_result_race (race_id),
  CONSTRAINT fk_results_race FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Podium and full finishing order
CREATE TABLE race_result_placements (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  result_id        INT UNSIGNED NOT NULL,
  entry_id         INT UNSIGNED NOT NULL,
  finish_position  TINYINT UNSIGNED NOT NULL,
  is_dead_heat     BOOLEAN NOT NULL DEFAULT FALSE,
  margin_lengths   DECIMAL(5,2) NULL,
  finish_time_ms   INT UNSIGNED NULL,
  final_odds       DECIMAL(6,2) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_placement_entry (result_id, entry_id),
  KEY idx_placements_pos (result_id, finish_position),
  CONSTRAINT fk_place_result FOREIGN KEY (result_id) REFERENCES race_results(id) ON DELETE CASCADE,
  CONSTRAINT fk_place_entry  FOREIGN KEY (entry_id)  REFERENCES race_entries(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- "Dividends" section: combination is stored as text, e.g. '1-2'
CREATE TABLE race_dividends (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  result_id        INT UNSIGNED NOT NULL,
  game_type_id     INT UNSIGNED NOT NULL,
  combination      VARCHAR(30) NOT NULL,
  dividend_amount  DECIMAL(12,2) NOT NULL,
  unit_stake       DECIMAL(8,2) NOT NULL DEFAULT 10.00,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dividend (result_id, game_type_id, combination),
  CONSTRAINT fk_div_result FOREIGN KEY (result_id)    REFERENCES race_results(id) ON DELETE CASCADE,
  CONSTRAINT fk_div_game   FOREIGN KEY (game_type_id) REFERENCES game_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- "View estimated pool demonstration"
CREATE TABLE race_pools (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  race_id       INT UNSIGNED NOT NULL,
  game_type_id  INT UNSIGNED NOT NULL,
  total_pool    DECIMAL(14,2) NOT NULL DEFAULT 0,
  takeout_pct   DECIMAL(4,2) NOT NULL DEFAULT 15.00,
  is_demo       BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pool (race_id, game_type_id),
  CONSTRAINT fk_pool_race FOREIGN KEY (race_id)      REFERENCES races(id)      ON DELETE CASCADE,
  CONSTRAINT fk_pool_game FOREIGN KEY (game_type_id) REFERENCES game_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ======================= 7. BETS AND TICKETS =========================

-- Daily counter for the last 4 digits of ticket numbers (PJA-DEMO-251024-0837).
-- One row per day, so numbering restarts automatically each day.
CREATE TABLE ticket_counters (
  counter_date  DATE NOT NULL,
  last_seq      INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (counter_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- The ticket itself. Betting History list + Ticket detail.
CREATE TABLE bets (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_number     VARCHAR(40) NOT NULL DEFAULT '',
  user_id           INT UNSIGNED NOT NULL,
  race_id           INT UNSIGNED NOT NULL,
  game_type_id      INT UNSIGNED NOT NULL,
  result_id         INT UNSIGNED NULL,
  wager_amount      DECIMAL(12,2) NOT NULL,
  currency          CHAR(3) NOT NULL DEFAULT 'PHP',
  odds_snapshot     DECIMAL(8,2) NULL,
  estimated_return  DECIMAL(14,2) NULL,
  payout_amount     DECIMAL(14,2) NULL,
  `status`            ENUM('pending','won','lost','void') NOT NULL DEFAULT 'pending',
  is_simulated      BOOLEAN NOT NULL DEFAULT TRUE,
  void_reason       VARCHAR(255) NULL,
  placed_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at        DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bets_ticket (ticket_number),
  KEY idx_bets_user_status (user_id, `status`, placed_at),
  KEY idx_bets_race_status (race_id, `status`),
  CONSTRAINT fk_bets_user   FOREIGN KEY (user_id)      REFERENCES users(id),
  CONSTRAINT fk_bets_race   FOREIGN KEY (race_id)      REFERENCES races(id),
  CONSTRAINT fk_bets_game   FOREIGN KEY (game_type_id) REFERENCES game_types(id),
  CONSTRAINT fk_bets_result FOREIGN KEY (result_id)    REFERENCES race_results(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Horses picked on a ticket. leg_position keeps the order for FORECAST etc.
CREATE TABLE bet_selections (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  bet_id         BIGINT UNSIGNED NOT NULL,
  entry_id       INT UNSIGNED NOT NULL,
  leg_position   TINYINT UNSIGNED NOT NULL,
  odds_snapshot  DECIMAL(6,2) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sel_leg (bet_id, leg_position),
  UNIQUE KEY uq_sel_entry (bet_id, entry_id),
  KEY idx_sel_entry (entry_id),
  CONSTRAINT fk_sel_bet   FOREIGN KEY (bet_id)   REFERENCES bets(id) ON DELETE CASCADE,
  CONSTRAINT fk_sel_entry FOREIGN KEY (entry_id) REFERENCES race_entries(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Make Selection -> Review -> Confirm. Lets the user resume an unfinished slip.
-- selections is JSON like [{"entry_id":12,"leg_position":1}]
CREATE TABLE bet_drafts (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  race_id       INT UNSIGNED NOT NULL,
  game_type_id  INT UNSIGNED NOT NULL,
  selections    JSON NOT NULL,
  wager_amount  DECIMAL(12,2) NULL,
  expires_at    DATETIME NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_draft (user_id, race_id, game_type_id),
  CONSTRAINT fk_draft_user FOREIGN KEY (user_id)      REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_draft_race FOREIGN KEY (race_id)      REFERENCES races(id) ON DELETE CASCADE,
  CONSTRAINT fk_draft_game FOREIGN KEY (game_type_id) REFERENCES game_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit trail: pending -> won / lost / void
CREATE TABLE bet_status_history (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  bet_id       BIGINT UNSIGNED NOT NULL,
  from_status  ENUM('pending','won','lost','void') NULL,
  to_status    ENUM('pending','won','lost','void') NOT NULL,
  reason       VARCHAR(255) NULL,
  changed_by   INT UNSIGNED NULL,
  changed_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bet_hist (bet_id, changed_at),
  CONSTRAINT fk_bsh_bet  FOREIGN KEY (bet_id)     REFERENCES bets(id)  ON DELETE CASCADE,
  CONSTRAINT fk_bsh_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =================== 8. FAVORITES AND NOTIFICATIONS ==================

-- Profile > Favorites. Exactly one target column is filled per row.
-- UNIQUE(user, target) works because MariaDB allows many NULLs in a unique key.
CREATE TABLE favorites (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED NOT NULL,
  target_type     ENUM('horse','jockey','trainer','race','venue') NOT NULL,
  horse_id        INT UNSIGNED NULL,
  jockey_id       INT UNSIGNED NULL,
  trainer_id      INT UNSIGNED NULL,
  race_id         INT UNSIGNED NULL,
  venue_id        INT UNSIGNED NULL,
  notify_on_race  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fav_horse   (user_id, horse_id),
  UNIQUE KEY uq_fav_jockey  (user_id, jockey_id),
  UNIQUE KEY uq_fav_trainer (user_id, trainer_id),
  UNIQUE KEY uq_fav_race    (user_id, race_id),
  UNIQUE KEY uq_fav_venue   (user_id, venue_id),
  CONSTRAINT fk_fav_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_fav_horse   FOREIGN KEY (horse_id)   REFERENCES horses(id)   ON DELETE CASCADE,
  CONSTRAINT fk_fav_jockey  FOREIGN KEY (jockey_id)  REFERENCES jockeys(id)  ON DELETE CASCADE,
  CONSTRAINT fk_fav_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE,
  CONSTRAINT fk_fav_race    FOREIGN KEY (race_id)    REFERENCES races(id)    ON DELETE CASCADE,
  CONSTRAINT fk_fav_venue   FOREIGN KEY (venue_id)   REFERENCES venues(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Profile > Notifications (with the unread dot on the tab bar)
CREATE TABLE notifications (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  type        ENUM('race_reminder','race_started','result_posted','bet_settled','system','promo') NOT NULL,
  title       VARCHAR(150) NOT NULL,
  body        TEXT NULL,
  race_id     INT UNSIGNED NULL,
  bet_id      BIGINT UNSIGNED NULL,
  deep_link   VARCHAR(500) NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notif_user (user_id, is_read, created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_race FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE SET NULL,
  CONSTRAINT fk_notif_bet  FOREIGN KEY (bet_id)  REFERENCES bets(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE push_devices (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  platform    VARCHAR(20) NOT NULL,
  push_token  VARCHAR(512) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_push_token (push_token),
  CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin actions: enter results, void a ticket, scratch a horse
CREATE TABLE audit_logs (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id     INT UNSIGNED NULL,
  action       VARCHAR(80) NOT NULL,
  entity       VARCHAR(60) NOT NULL,
  entity_id    VARCHAR(64) NOT NULL,
  before_data  JSON NULL,
  after_data   JSON NULL,
  ip_address   VARCHAR(45) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_entity (entity, entity_id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
