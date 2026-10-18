import { silkColorFor } from '@/theme/tokens';
import type {
  AuthUser,
  FeaturedContender,
  JockeyPHGuide,
  GameGuide,
  HomeData,
  MarketType,
  MeetingDay,
  OnboardingSlide,
  Pool,
  PoolDividend,
  PoolOverview,
  Profile,
  Race,
  ResultDetail,
  ResultSummary,
  RewardProgram,
  Runner,
} from '@/types';

const runners: Runner[] = [
  {
    id: 'r1',
    number: 1,
    horse: 'Golden Victory',
    jockey: 'Marco de León',
    trainer: 'R. Santiago',
    form: '1-3-2',
    odds: 3.1,
    weightKg: 56,
    silkColor: silkColorFor(1),
  },
  {
    id: 'r2',
    number: 2,
    horse: 'Midnight Thunder',
    jockey: 'Luis Mercado',
    trainer: 'A. Cruz',
    form: '2-1-4',
    odds: 3.8,
    weightKg: 55.5,
    silkColor: silkColorFor(2),
  },
  {
    id: 'r3',
    number: 3,
    horse: 'Royal Champion',
    jockey: 'Paolo Reyes',
    trainer: 'J. Dela Cruz',
    form: '4-2-1',
    odds: 4.5,
    weightKg: 55,
    silkColor: silkColorFor(3),
  },
  {
    id: 'r4',
    number: 4,
    horse: 'Silver Comet',
    jockey: 'Diego Ramos',
    trainer: 'M. Lopez',
    form: '3-5-2',
    odds: 5.2,
    weightKg: 54.5,
    silkColor: silkColorFor(4),
  },
  {
    id: 'r5',
    number: 5,
    horse: 'Emerald Star',
    jockey: 'Ana Villamor',
    trainer: 'T. Gomez',
    form: '5-4-3',
    odds: 5.9,
    weightKg: 54,
    silkColor: silkColorFor(5),
  },
  {
    id: 'r6',
    number: 6,
    horse: 'Braveheart',
    jockey: 'Rico Bautista',
    trainer: 'F. Ramos',
    form: '6-6-5',
    odds: 6.6,
    weightKg: 53.5,
    silkColor: silkColorFor(6),
  },
];

const todayRaces: Race[] = [
  {
    id: 'race-1',
    number: 1,
    name: 'Maiden Sprint',
    venue: 'Manila Turf Club',
    distanceM: 1200,
    entries: 8,
    postTime: '1:30 PM',
    status: 'completed',
    runners,
  },
  {
    id: 'race-2',
    number: 2,
    name: 'Turf Challenge',
    venue: 'Manila Turf Club',
    distanceM: 1400,
    entries: 10,
    postTime: '2:30 PM',
    status: 'ongoing',
  },
  {
    id: 'race-3',
    number: 3,
    name: "Champions' Mile",
    venue: 'Manila Turf Club',
    distanceM: 1600,
    entries: 12,
    postTime: '3:30 PM',
    status: 'upcoming',
    runners,
  },
  {
    id: 'race-4',
    number: 4,
    name: 'Heritage Cup',
    venue: 'Manila Turf Club',
    distanceM: 1800,
    entries: 9,
    postTime: '4:45 PM',
    status: 'upcoming',
  },
];

const liveRace: Race = { ...todayRaces[1], runners };

export const homeData: HomeData = {
  dateLabel: 'THURSDAY, 24 OCTOBER',
  greetingName: 'Isabella',
  liveRace,
  liveSeries: 'PHILIPPINE RACING CLUB · TURF CHALLENGE',
  todayRaces,
  latestResults: [
    {
      id: 'res-1',
      raceNumber: 1,
      status: 'official',
      winner: { horse: 'Golden Victory', jockey: 'Marco de León' },
      venue: 'Manila Turf',
      postTime: '1:30 PM',
      distanceM: 1200,
      time: '1:12.84',
    },
  ],
  promo: {
    eyebrow: 'LEARN THE GAMES',
    title: 'New to racing?',
    description: 'Understand selections with our simple, no-risk demonstrations.',
  },
  quickLinks: [
    { id: 'totalizer', icon: 'totalizer', label: 'Totalizer', sublabel: 'pools' },
    { id: 'games', icon: 'games', label: 'Games', sublabel: 'guide' },
  ],
  featured: [
    { id: 'f1', kind: 'horse', name: 'Golden Victory', image: 'https://placehold.co/165x84' },
    { id: 'f2', kind: 'jockey', name: 'Marco de León', image: 'https://placehold.co/165x84' },
  ],
};

export const meetingDays: MeetingDay[] = [
  { date: '2025-10-22', day: '22', weekday: 'TUE', raceCount: 0, races: [] },
  { date: '2025-10-23', day: '23', weekday: 'WED', raceCount: 0, races: [] },
  {
    date: '2025-10-24',
    day: '24',
    weekday: 'THU',
    raceCount: todayRaces.length,
    races: todayRaces,
  },
  { date: '2025-10-25', day: '25', weekday: 'FRI', raceCount: 0, races: [] },
  { date: '2025-10-26', day: '26', weekday: 'SAT', raceCount: 0, races: [] },
];

export const resultSummaries: ResultSummary[] = [
  {
    id: 'res-1',
    raceNumber: 1,
    status: 'official',
    winner: { horse: 'Golden Victory', jockey: 'Marco de León' },
    venue: 'Manila Turf',
    postTime: '1:30 PM',
    distanceM: 1200,
    time: '1:12.84',
  },
  {
    id: 'res-2',
    raceNumber: 2,
    status: 'official',
    winner: { horse: 'Midnight Thunder', jockey: 'Luis Mercado' },
    venue: 'Manila Turf',
    postTime: '2:30 PM',
    distanceM: 1400,
    time: '1:24.10',
  },
  {
    id: 'res-3',
    raceNumber: 3,
    status: 'provisional',
    winner: { horse: 'Royal Champion', jockey: 'Paolo Reyes' },
    venue: 'Manila Turf',
    postTime: '3:30 PM',
    distanceM: 1600,
    time: '1:38.52',
  },
];

export const resultDetails: Record<string, ResultDetail> = {
  'res-1': {
    id: 'res-1',
    raceId: 'race-1',
    raceNumber: 1,
    status: 'official',
    raceName: 'Maiden Sprint',
    dateLabel: 'RACE 1 · 24 OCTOBER 2025',
    winner: { horse: 'Golden Victory', jockey: 'Marco de León' },
    venue: 'Manila Turf Club',
    postTime: '1:30 PM',
    distanceM: 1200,
    time: '1:12.84',
    trackCondition: 'Good',
    podium: [
      {
        place: 1,
        number: 1,
        horse: 'Golden Victory',
        jockey: 'M. de León',
        image: 'https://placehold.co/67x67',
        silkColor: silkColorFor(1),
      },
      {
        place: 2,
        number: 2,
        horse: 'Midnight Thunder',
        jockey: 'L. Mercado',
        image: 'https://placehold.co/55x55',
        silkColor: silkColorFor(2),
      },
      {
        place: 3,
        number: 3,
        horse: 'Royal Champion',
        jockey: 'P. Reyes',
        image: 'https://placehold.co/55x55',
        silkColor: silkColorFor(3),
      },
    ],
    dividends: [
      { market: 'WIN', selection: 'No. 1', amount: 34.5 },
      { market: 'PLACE', selection: 'No. 1', amount: 16.0 },
      { market: 'FORECAST', selection: '1 – 2', amount: 142.0 },
    ],
    summary:
      'Golden Victory took command in the final 200 meters and finished strongly, a length ahead of Midnight Thunder.',
  },
};

export const poolDividends: Record<string, PoolDividend> = {
  'pool-place-r3': {
    id: 'pool-place-r3',
    market: 'PLACE',
    raceLabel: "RACE 3 · CHAMPIONS' MILE",
    totalPool: 248500,
    salesUnits: 4970,
    winningUnits: 512,
    dividendPerUnit: 38.75,
    perUnit: 10,
    distribution: [
      { label: 'Golden Victory', percent: 36, color: silkColorFor(1) },
      { label: 'Midnight Thunder', percent: 27, color: silkColorFor(2) },
      { label: 'Royal Champion', percent: 19, color: silkColorFor(3) },
      { label: 'Others', percent: 18, color: '#d6d3d1' },
    ],
  },
};

export const gameGuides: GameGuide[] = [
  {
    id: 'guide-win',
    number: 1,
    title: 'WIN',
    description: 'Pick the horse you think will finish first.',
    selectionHint: 'Select 1 horse',
  },
  {
    id: 'guide-place',
    number: 2,
    title: 'PLACE',
    description: 'Pick a horse to finish in the top two.',
    selectionHint: 'Select 1 horse',
  },
  {
    id: 'guide-forecast',
    number: 3,
    title: 'FORECAST',
    description: 'Predict the first two finishers in exact order.',
    selectionHint: 'Select 2 horses',
  },
  {
    id: 'guide-reverse-forecast',
    number: 4,
    title: 'REVERSE FORECAST',
    description: 'Predict the first two finishers in either order.',
    selectionHint: 'Select 2 horses',
  },
  {
    id: 'guide-trifecta',
    number: 5,
    title: 'TRIFECTA',
    description: 'Pick the first three finishers in exact order.',
    selectionHint: 'Select 3 horses',
  },
  {
    id: 'guide-box-trifecta',
    number: 6,
    title: 'BOX TRIFECTA',
    description: 'Cover every finishing order of your three picks.',
    selectionHint: 'Select 3 or more',
  },
  {
    id: 'guide-multi-race',
    number: 7,
    title: 'MULTI-RACE / JACKPOT',
    description: 'Combine your winners across races for a bigger payout.',
    selectionHint: 'Select across races',
  },
];

export const rewards: RewardProgram = {
  points: 320,
  rewards: [
    {
      id: 'reward-race-pass',
      title: 'Race Day Pass',
      description: 'Skip-the-line entry to a partner racetrack meet.',
      pointsCost: 250,
      tag: 'Popular',
    },
    {
      id: 'reward-merch',
      title: 'Philippine Jockey Cap',
      description: 'Limited-edition branded cap from the demo store.',
      pointsCost: 400,
    },
    {
      id: 'reward-totalizer',
      title: 'Totalizer Booster',
      description: 'A bonus demo credit added to your next bet.',
      pointsCost: 150,
      tag: 'New',
    },
  ],
};

const poolBreakdown: Pool['breakdown'] = [
  { label: 'Distributable 84.1%', percent: 84.1, color: '#103B2F' },
  { label: 'Deductions 14.9%', percent: 14.9, color: '#C6A15B' },
  { label: 'Refunds 1.0%', percent: 1.0, color: '#ef4444' },
];

export const pools: Pool[] = [
  {
    id: 'pool-win-r3',
    market: 'WIN',
    raceLabel: "Race 3 · Champions' Mile",
    totalPool: 248500,
    totalSales: 4970,
    refunds: 2500,
    deductions: 36900,
    distributable: 209100,
    estimatedDividend: 38.75,
    finalDividend: null,
    perUnit: 10,
    breakdown: poolBreakdown,
  },
  {
    id: 'pool-place-r3',
    market: 'PLACE',
    raceLabel: "Race 3 · Champions' Mile",
    totalPool: 184200,
    totalSales: 3684,
    refunds: 1800,
    deductions: 27450,
    distributable: 154950,
    estimatedDividend: 16.0,
    finalDividend: null,
    perUnit: 10,
    breakdown: poolBreakdown,
  },
  {
    id: 'pool-forecast-r3',
    market: 'FORECAST',
    raceLabel: "Race 3 · Champions' Mile",
    totalPool: 132850,
    totalSales: 2657,
    refunds: 1300,
    deductions: 19800,
    distributable: 111750,
    estimatedDividend: 142.0,
    finalDividend: null,
    perUnit: 10,
    breakdown: poolBreakdown,
  },
  {
    id: 'pool-trifecta-r3',
    market: 'TRIFECTA',
    raceLabel: "Race 3 · Champions' Mile",
    totalPool: 96400,
    totalSales: 1928,
    refunds: 960,
    deductions: 14460,
    distributable: 80980,
    estimatedDividend: 486.5,
    finalDividend: null,
    perUnit: 10,
    breakdown: poolBreakdown,
  },
];

export const pool = pools[0];

export const poolOverview: PoolOverview = {
  raceId: 'race-3',
  raceLabel: "Race 3 · Champions' Mile",
  venue: 'Manila Turf Club',
  postTime: '3:30 PM',
  poolSales: 661950,
  pools: pools.map((p) => ({
    id: p.id,
    market: p.market,
    totalPool: p.totalPool,
    estimatedDividend: p.estimatedDividend,
    perUnit: p.perUnit,
  })),
};

export const profile: Profile = {
  firstName: 'Isabella',
  lastName: 'Santos',
  email: 'isabella.santos@example.com',
  initials: 'IS',
  memberSince: 'MEMBER SINCE OCT 2025',
  balance: 5000,
  currency: '₱',
};

/** Default mock account shown before any sign-up happens. */
export const demoUser: AuthUser = {
  id: 'demo-user',
  firstName: 'Isabella',
  lastName: 'Santos',
  email: 'isabella.santos@example.com',
  mobile: '+63 917 123 4567',
  initials: 'IS',
  memberSince: 'MEMBER SINCE OCT 2025',
  balance: 5000,
  currency: '₱',
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'slide-1',
    eyebrow: 'PHILIPPINE JOCKEY',
    title: 'Racing intelligence.',
    highlight: 'Refined for you.',
    description: 'Every race, every contender, every finish — in one premium experience.',
  },
  {
    id: 'slide-2',
    eyebrow: 'LIVE ACTION',
    title: 'Follow the field,',
    highlight: 'moment by moment.',
    description: 'Track in-play updates, live pools and results as they are declared.',
  },
  {
    id: 'slide-3',
    eyebrow: 'NO RISK, ALL FUN',
    title: 'Learn the game',
    highlight: 'with demonstrations.',
    description: 'Practice selections with simulated tickets before you ever place a real one.',
  },
];

export const jockeyPHGuide: JockeyPHGuide = {
  venue: 'MetroTurf Racing Complex',
  location: 'Malvar–Tanauan City, Batangas',
  dateLabel: 'Saturday, January 12, 2019',
  printedPricePhp: 11,
  pools: [
    { name: '1st Winner-Take-All', races: 'Races 1–7' },
    { name: '2nd Winner-Take-All', races: 'Races 3–9' },
    { name: '1st Pick 5', races: 'Races 2–6' },
    { name: 'Pick 6', races: 'Races 4–9' },
  ],
  singleRaceOptions: ['Trifecta', 'Quartet', 'Pentafecta', 'Super Six', 'Daily Double'],
  sampleRaces: [
    {
      number: 4,
      postTime: '3:30 P.M.',
      distanceM: 1200,
      bettingEvents: ['XD 4–6', 'Trifecta', 'Quartet', 'Pentafecta', 'Daily Double + 1'],
      group: 'Group Race (9)',
      tipsters: [
        { code: 'B', picks: '7-6-2-4-3' },
        { code: 'W', picks: '4-7-1-2-5' },
        { code: 'Y', picks: '7-2-4-3-5' },
      ],
      entries: [
        { gate: '1', horse: 'Zophany Dane', ageSexClass: 'f4b', trainer: 'Paradero C. B.', jockey: 'L. Aguila', weight: '53 B', owner: 'Mamucod M. V.', tipsterStar: true },
        { gate: '2', horse: 'Absolute Resistance', ageSexClass: 'm6b', recentTime: '1:11 · 07/28/18', trainer: 'David R. B.', jockey: 'R. M. Garcia', weight: '55 B', owner: 'Vasquez M. A. P.', tipsterStar: true },
        { gate: '3', horse: 'Show the Whip', ageSexClass: 'm6b', recentTime: '1:12 · 07/28/18', trainer: 'Zayas E. M.', jockey: 'O. P. Cortez', weight: '56 A', owner: 'Manalo W. B.', tipsterStar: true },
        { gate: '4', horse: 'Pursuit of Happiness', ageSexClass: 'm7b', trainer: 'Naval L. B. Jr.', jockey: 'E. A. Abrea', weight: '50 *-3', owner: 'Tupas R. S.' },
        { gate: '4A', horse: 'Sweetness', ageSexClass: 'm7b', recentTime: '1:13 · 10/31/18', trainer: 'Naval L. B. Jr.', jockey: 'M. M. Gonzales', weight: '53 A', owner: 'Tupas R. S.' },
        { gate: '5', horse: 'Tubig at Langis', ageSexClass: 'f5b', recentTime: '1:12 · 07/29/18', trainer: 'Morales N. O.', jockey: 'J. B. Guce', weight: '54 A', owner: 'Lorica N. A.', tipsterStar: true },
        { gate: '6', horse: 'Himig', ageSexClass: 'f5c 7', recentTime: '1:11 · 07/29/18', trainer: 'Alvarez Man. B.', jockey: 'M. B. Pilapil', weight: '52 B', owner: 'Vicente M. M.' },
        { gate: '7', horse: 'White Chocolate', ageSexClass: 'f5c 7', recentTime: '1:12 · 12/28/18', trainer: 'Uy P. P.', jockey: 'E. G. Guerra', weight: '55 B', owner: 'Mongaya R. E.', tipsterStar: true },
      ],
      announcements: [
        'Entry #4A occupies stall #8 and is coupled with #8.',
        'Guaranteed ₱120,000 to the winner only.',
        'Sponsored by MMTCI New Management.',
      ],
    },
  ],
  selectionFactors: [
    { title: 'Recent form and times', detail: 'Compare recent finishes and times, especially over a similar distance and at the same track when those records are shown.' },
    { title: 'Carried weight', detail: 'Weight is part of the handicap. Consider it with the horse’s form and race conditions; a lower number alone does not guarantee an advantage.' },
    { title: 'Race class and distance', detail: 'The group or class and the race distance help show what kind of field the horse is facing.' },
    { title: 'Jockey and tipster selections', detail: 'Use the listed jockey and B, W, and Y combinations as additional context. They are selections, not promises of a result.' },
  ],
  tipDataNeeded: [
    { field: 'Current official race entries', reason: 'Runner numbers, coupled entries, withdrawals, and race status.' },
    { field: 'Recent horse results', reason: 'Last five races with date, track, distance, finish, and recorded time.' },
    { field: 'Comparable distance times', reason: 'Best time at this track and distance within the last 180 days.' },
    { field: 'Race and handicap details', reason: 'Race group, surface and track condition, and assigned carrying weight.' },
    { field: 'Jockey and tipster records', reason: 'Current jockey assignment and B/W/Y selections with their source and update time.' },
  ],
  historicalNotice: 'This is a historical example. Its entries, schedule, odds, and announcements are not current race information.',
};

export const markets: MarketType[] = ['WIN', 'PLACE', 'FORECAST', 'REVERSE_FORECAST', 'TRIFECTA'];

export const featuredContenders: FeaturedContender[] = homeData.featured;
