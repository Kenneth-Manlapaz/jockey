/** Original educational examples. These are teaching records, never racing-feed data. */
export const guideSections = [
  { id: 'getting-started', title: 'Getting started', detail: 'From calendar to race day' },
  { id: 'program', title: 'Read the program', detail: 'Explore every part of a race card' },
  { id: 'horse-form', title: 'Understand horse form', detail: 'Recent, comparable and best time' },
  { id: 'racing-statistics', title: 'Racing statistics', detail: 'Horses and their connections' },
  { id: 'betting-terminology', title: 'Betting terminology', detail: 'Labels and race coverage' },
  { id: 'official-results', title: 'Read official results', detail: 'Placings, clocking and decisions' },
  { id: 'dividends', title: 'Understand dividends', detail: 'Published payouts and their units' },
  { id: 'glossary', title: 'Racing glossary', detail: 'Find a term in seconds' },
];

export const programCallouts = [
  { title: 'Race number & post time', text: 'Race 3 identifies one contest in this meeting. The 3:00 PM post time is a scheduled start in Philippine time; check announcements for delays.' },
  { title: 'Track & distance', text: 'Sierra Verde Park is the venue in this fictional card. The contest is 1,200 metres on dirt. A different venue, surface or distance changes the comparison context.' },
  { title: 'Class & conditions', text: 'This fictional handicap is for horses aged four and up. Weight assignments are part of its conditions. Read the published classification and eligibility together; a class label alone does not describe every restriction.' },
  { title: 'Horse number', text: 'The program number identifies the entry. It is the number used when a published result or combination refers to that entry. It need not be the same as its starting gate.' },
  { title: 'Starting gate', text: 'The gate is the stall from which the horse is scheduled to start. In this example horse number 2 starts from gate 4. Always read the number and gate as separate fields.' },
  { title: 'Horse identity', text: 'Amihan Express names the horse, whose profile connects its pedigree and recorded races. Two entries in different races can refer to the same permanent horse profile.' },
  { title: 'Jockey & assigned weight', text: 'Mateo Reyes is the declared rider. The 54.0 kg figure is the weight assignment recorded for this entry, not a measure of the horse’s body weight. Allowances and actual carried weight should be read from the published record.' },
  { title: 'Historical form', text: '2–1–4–3–2 lists fictional finishing positions, newest first. Open horse form for the dates and conditions behind the sequence. Recent positions describe what happened, not a prediction of the next result.' },
  { title: 'Available event labels', text: 'WIN, FORECAST and TRIFECTA are example pool labels. A label tells you the kind of event, while the meeting’s actual event record tells you its race legs and published rules. These labels are not buttons for placing wagers.' },
  { title: 'Announcements & connections', text: 'The trainer prepares the horse; the owner is its recorded ownership connection. A coupled group is published explicitly. Scratches, rider changes, sponsorships and extra prizes belong in announcements, so check them before comparing entries.' },
];

export type FormExample = { date: string; venue: string; distance: number; surface: string; finish: number; timeMs: number | null; status: string };
export const formContext = { date: '2026-10-18', venue: 'Sierra Verde Park', distance: 1200, surface: 'dirt' };
export const formExamples: FormExample[] = [
  { date: '2026-10-11', venue: 'Laguna Downs', distance: 1400, surface: 'dirt', finish: 2, timeMs: 87000, status: 'official' },
  { date: '2026-09-27', venue: 'Sierra Verde Park', distance: 1200, surface: 'dirt', finish: 1, timeMs: 72900, status: 'official' },
  { date: '2026-09-13', venue: 'Sierra Verde Park', distance: 1600, surface: 'dirt', finish: 4, timeMs: 101200, status: 'official' },
  { date: '2026-08-30', venue: 'Sierra Verde Park', distance: 1200, surface: 'dirt', finish: 3, timeMs: 73400, status: 'official' },
  { date: '2026-08-16', venue: 'Laguna Downs', distance: 1200, surface: 'dirt', finish: 2, timeMs: 73100, status: 'official' },
  { date: '2026-07-19', venue: 'Sierra Verde Park', distance: 1200, surface: 'dirt', finish: 1, timeMs: 72600, status: 'official' },
  { date: '2026-06-14', venue: 'Sierra Verde Park', distance: 1200, surface: 'dirt', finish: 2, timeMs: null, status: 'official' },
  { date: '2026-05-17', venue: 'Sierra Verde Park', distance: 1200, surface: 'dirt', finish: 3, timeMs: 73800, status: 'official' },
  { date: '2026-03-22', venue: 'Sierra Verde Park', distance: 1200, surface: 'dirt', finish: 1, timeMs: 71900, status: 'official' },
];
export function comparableExample(row: FormExample) { return row.venue === formContext.venue && row.distance === formContext.distance && row.surface === formContext.surface; }
export function bestTimeExample(rows = formExamples) {
  const before = Date.parse(formContext.date);
  const qualifying = rows.filter(row => comparableExample(row) && row.status === 'official' && row.timeMs != null && Date.parse(row.date) < before && Date.parse(row.date) >= before - 180 * 86400000);
  return qualifying.length ? Math.min(...qualifying.map(row => row.timeMs!)) : null;
}
export function educationTime(ms: number | null) { return ms == null ? 'Unavailable' : `${Math.floor(ms / 60000)}:${((ms % 60000) / 1000).toFixed(2).padStart(5, '0')}`; }

export const coverageExamples = [
  { name: '1st WTA', races: [1, 2, 3, 4, 5, 6, 7] },
  { name: '1st PICK 5', races: [2, 3, 4, 5, 6] },
  { name: '1st PICK 6', races: [3, 4, 5, 6, 7, 8] },
  { name: '2nd WTA', races: [4, 5, 6, 7, 8, 9, 10] },
];
export function eventsForExampleRace(race: number) { return coverageExamples.filter(event => event.races.includes(race)); }

// Definitions are original summaries of PRCI operator rules; programme assignments vary.
export const eventTerms = [
  { name: 'WIN', scope: 'Single race', meaning: 'First-place selection.', example: 'One result supplies the winning number.' },
  { name: 'PLACE', scope: 'Single race', meaning: 'A qualifying placing; eligible positions depend on the operator and field.', example: 'PRCI publishes top three for 8+ starters, top two for 5–7, and no PLACE for 4 or fewer. Check the meeting’s rules.' },
  { name: 'FORECAST', scope: 'Single race', meaning: 'First two in exact order.', example: '2–4 and 4–2 describe different ordered finishes.' },
  { name: 'TRIFECTA', scope: 'Single race', meaning: 'First three in exact order.', example: '2–4–1 is an ordered three-horse combination.' },
  { name: 'QUARTET', scope: 'Single race', meaning: 'First four in exact order.', example: 'The sequence includes four placings in one result.' },
  { name: 'PENTAFECTA', scope: 'Single race', meaning: 'First five in exact order.', example: 'Five horse numbers describe one ordered finish.' },
  { name: 'SUPER SIX', scope: 'Single race · PRCI definition', meaning: 'First six in exact order in one race.', example: 'Different from PICK 6, which uses six races.' },
  { name: 'WTA', scope: 'Multiple races', meaning: 'Winners across seven designated races under PRCI rules.', example: 'Read each published leg; more than one WTA can appear in a meeting.' },
  { name: 'PICK 5 / PICK 6', scope: 'Multiple races', meaning: 'Winners across five or six designated races.', example: 'A leg refers to a race, not to a placing within one race.' },
  { name: 'XD', scope: 'Multiple races · Extra Double', meaning: 'Winners of two designated non-consecutive races under PRCI rules.', example: 'Check both race IDs; do not assume adjacent races.' },
  { name: 'DD+1', scope: 'Multiple races', meaning: 'Winners of three designated consecutive races under PRCI rules.', example: 'The “+1” extends a two-race Daily Double by one race.' },
];

export const glossary = [
  ['Assigned weight', 'The published weight assignment for a declared entry; read any allowance or change alongside it.'],
  ['Best recorded time', 'The lowest qualifying individual time under a stated comparison and historical window.'],
  ['Carried weight', 'Weight recorded as carried in a historical performance; it can differ from an earlier assignment.'],
  ['Classification', 'A race’s published eligibility or grouping, such as maiden or a stated rating band.'],
  ['Clocking', 'Recorded race timing. Read the labels to distinguish an overall time from a sectional.'],
  ['Comparable form', 'Historical records matching the selected venue, surface and distance in JOCKEY.'],
  ['Coupled entries', 'Entries explicitly linked by the published program under the applicable operator rules.'],
  ['Corrected', 'A later publication that revises previously published information.'],
  ['Dead heat (DH)', 'An officially recorded tie for a finishing position.'],
  ['Declared entry', 'A horse listed for a particular race with its race-specific assignments.'],
  ['Disqualified (DQ)', 'An entry whose result is changed or excluded by an official decision; read the decision notes.'],
  ['Dividend', 'A published amount for a qualifying winning combination and stated unit.'],
  ['Finishing margin / LF', 'The published separation between finishers, commonly expressed in lengths; check the record’s convention.'],
  ['Gate', 'The starting stall assigned to an entry, separate from its program number.'],
  ['Handicap', 'A race whose published conditions use weight assignments to help balance the contest.'],
  ['Historical form', 'A horse’s recorded race performances with dates, conditions and results.'],
  ['Intermediate position', 'A horse’s position at a labelled point before the finish.'],
  ['Jockey', 'The rider assigned to an entry.'],
  ['Last 5 DIST', 'Up to five recent comparable performances, rather than the latest five at any course or distance.'],
  ['Leg', 'One designated race within a multi-race event.'],
  ['Maiden', 'A race classification for horses that have not won a race, subject to its published conditions.'],
  ['Meeting', 'The collection of races held at a venue on a racing date.'],
  ['Odds', 'A quoted market figure before a race; it is separate from a published dividend.'],
  ['Official', 'A result or dividend explicitly published with official status.'],
  ['Owner', 'The ownership connection recorded for the horse or race participation.'],
  ['Pedigree', 'Parentage information: sire is the father; dam is the mother.'],
  ['Pool', 'The event-specific collection of wagers used under the operator’s payout rules.'],
  ['Post time', 'The scheduled race start time, shown in the relevant local timezone.'],
  ['Provisional', 'Published information that has not yet been marked official.'],
  ['Purse', 'The published prize fund for the sporting contest, separate from pool dividends.'],
  ['Scratch / withdrawn', 'An entry removed from participation. Read the published status and reason.'],
  ['Sectional time', 'Timing for a labelled part of a race; the record should say whether it is a segment or cumulative reading.'],
  ['Surface', 'The racing surface, such as dirt or turf.'],
  ['Tipster selection', 'An attributed editorial opinion, separate from an official result or your saved favorites.'],
  ['Trainer', 'The person recorded as preparing the horse for racing.'],
  ['Unavailable', 'No usable value has been supplied; it does not mean zero.'],
  ['Winning combination', 'The number or ordered set of numbers published as qualifying for a pool’s dividend.'],
].map(([term, definition]) => ({ term, definition }));
