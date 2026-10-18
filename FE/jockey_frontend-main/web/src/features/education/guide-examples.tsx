'use client';

import { useState } from 'react';
import { ArrowRight, Check, Search } from 'lucide-react';
import { programCallouts, formExamples, formContext, comparableExample, bestTimeExample, educationTime, coverageExamples, eventsForExampleRace, glossary } from '@web/lib/education';

const sampleHorses = [
  { number: 2, gate: 4, name: 'Amihan Express', jockey: 'Mateo Reyes', weight: '54.0', form: '2–1–4–3–2' },
  { number: 4, gate: 1, name: 'Copper Horizon', jockey: 'Luis Mendoza', weight: '53.5', form: '3–2–1–5–3' },
  { number: 1, gate: 3, name: 'Moonlit Harbor', jockey: 'Nico Ramos', weight: '55.0', form: '4–3–2–1–4' },
];

function ProgramMarker({ index, selected, onSelect, children }: { index: number; selected: number; onSelect: (index: number) => void; children: React.ReactNode }) {
  return <button type="button" className={`guide-marker${selected === index ? ' selected' : ''}`} aria-pressed={selected === index} aria-controls="program-explanation" aria-label={`${index + 1}. ${programCallouts[index].title}`} onClick={() => onSelect(index)}><b>{index + 1}</b><span>{children}</span></button>;
}

export function AnnotatedProgram() {
  const [selected, setSelected] = useState(0);
  return <div className="guide-program-explorer"><div className="guide-sample-card">
    <div className="guide-example-label">ILLUSTRATED PROGRAM · FICTIONAL EXAMPLE</div>
    <div className="guide-sample-header"><ProgramMarker selected={selected} onSelect={setSelected} index={0}>RACE 3 <small>3:00 PM · PHT</small></ProgramMarker><ProgramMarker selected={selected} onSelect={setSelected} index={1}>Sierra Verde Park <small>1,200 m · Dirt</small></ProgramMarker><ProgramMarker selected={selected} onSelect={setSelected} index={2}>Handicap <small>4-year-olds and up</small></ProgramMarker></div>
    <div className="guide-sample-events"><ProgramMarker selected={selected} onSelect={setSelected} index={8}>WIN · FORECAST · TRIFECTA</ProgramMarker></div>
    <div className="guide-sample-scroll" tabIndex={0} role="region" aria-label="Illustrated entry table, scroll horizontally on small screens"><table className="guide-sample-table"><caption>Three sample entries · select a numbered label to explore</caption><thead><tr><th><ProgramMarker selected={selected} onSelect={setSelected} index={3}>No.</ProgramMarker></th><th><ProgramMarker selected={selected} onSelect={setSelected} index={4}>Gate</ProgramMarker></th><th><ProgramMarker selected={selected} onSelect={setSelected} index={5}>Horse</ProgramMarker></th><th><ProgramMarker selected={selected} onSelect={setSelected} index={6}>Jockey / kg</ProgramMarker></th><th><ProgramMarker selected={selected} onSelect={setSelected} index={7}>Last 5</ProgramMarker></th></tr></thead><tbody>{sampleHorses.map(h => <tr key={h.number}><td><span className="guide-horse-number">{h.number}</span></td><td>{h.gate}</td><td><strong>{h.name}</strong></td><td>{h.jockey}<small>{h.weight} kg</small></td><td>{h.form}</td></tr>)}</tbody></table></div>
    <div className="guide-sample-footer"><ProgramMarker selected={selected} onSelect={setSelected} index={9}>Connections &amp; announcements</ProgramMarker><p>Amihan Express · Trainer: Rafael Navarro · Owner: Amihan Racing Stable</p><p>Sample notice: horse no. 5 withdrawn; no. 2 has a confirmed rider change. Coupled groups, if any, must be declared separately.</p></div>
  </div><aside className="guide-annotation" id="program-explanation" aria-live="polite" aria-atomic="true"><span className="guide-step-number">{String(selected + 1).padStart(2, '0')}</span><h3>{programCallouts[selected].title}</h3><p>{programCallouts[selected].text}</p><div className="guide-step-controls"><button type="button" className="app-button secondary sm" disabled={selected === 0} onClick={() => setSelected(selected - 1)}>Previous</button><span>{selected + 1} of {programCallouts.length}</span><button type="button" className="app-button primary sm" disabled={selected === programCallouts.length - 1} onClick={() => setSelected(selected + 1)}>Next <ArrowRight size={13} /></button></div></aside></div>;
}

export function HorseFormExample() {
  const [view, setView] = useState<'recent' | 'comparable' | 'best'>('recent');
  const recent = formExamples.slice(0, 5);
  const comparable = formExamples.filter(comparableExample).slice(0, 5);
  const best = bestTimeExample();
  const explanations = {
    recent: 'The highlighted five are the newest recorded races. Laguna Downs and a 1,600 m race appear because this view does not require a track or distance match.',
    comparable: 'Only Sierra Verde Park, 1,200 m, dirt records qualify. Older matching races can enter this list when newer runs were elsewhere. The missing time remains unavailable.',
    best: `The best qualifying time is ${educationTime(best)}. The faster March time is outside the 180-day window. The June run has no time, so it cannot supply a best time.`,
  };
  return <div className="guide-interactive"><p className="guide-example-label">FICTIONAL FORM · AMIHAN EXPRESS · COMPARISON RACE: 18 OCTOBER 2026</p><div className="guide-segmented" role="group" aria-label="Choose a form comparison">{([['recent', 'Last 5 Races'], ['comparable', 'Last 5 DIST'], ['best', 'Best time · 180 days']] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</div><p className="guide-interaction-caption" role="status">{explanations[view]}</p><div className="guide-sample-scroll" tabIndex={0} role="region" aria-label="Fictional historical form comparison"><table className="guide-sample-table"><caption>Target: {formContext.venue} · {formContext.distance} m · {formContext.surface}. Highlighted rows qualify for the selected view.</caption><thead><tr><th>Date</th><th>Track / distance</th><th>Finish</th><th>Horse time</th><th>Comparison</th></tr></thead><tbody>{formExamples.map(row => {
    const date = Date.parse(row.date);
    const inWindow = date >= Date.parse(formContext.date) - 180 * 86400000 && date < Date.parse(formContext.date);
    const qualifies = view === 'recent' ? recent.includes(row) : view === 'comparable' ? comparable.includes(row) : comparableExample(row) && inWindow && row.timeMs != null;
    return <tr key={row.date} className={qualifies ? 'guide-row-highlight' : ''}><td>{row.date}</td><td>{row.venue}<small>{row.distance} m · {row.surface}</small></td><td>{row.finish}</td><td>{educationTime(row.timeMs)}{view === 'best' && qualifies && row.timeMs === best && <small><Check size={12} /> Best qualifying time</small>}</td><td>{!comparableExample(row) ? 'Different conditions' : !inWindow ? 'Outside 180 days' : row.timeMs == null ? 'Matching · time unavailable' : 'Same track & distance'}</td></tr>;
  })}</tbody></table></div></div>;
}

export function EventCoverage() {
  const [race, setRace] = useState(4);
  const [event, setEvent] = useState<number | null>(null);
  const linked = eventsForExampleRace(race);
  return <div className="guide-interactive"><p className="guide-example-label">FICTIONAL 12-RACE MEETING · ILLUSTRATIVE COVERAGE, NOT A UNIVERSAL SCHEDULE</p><p>Select a race to find overlapping events, or select an event row to highlight its legs.</p><div className="guide-coverage-scroll" tabIndex={0} role="region" aria-label="Twelve-race event coverage diagram"><div className="guide-coverage-grid"><span className="guide-coverage-label">RACE MEETING</span>{Array.from({ length: 12 }, (_, i) => <button type="button" key={i} className={`guide-coverage-race${race === i + 1 ? ' is-selected' : ''}`} aria-pressed={race === i + 1 && event == null} onClick={() => { setRace(i + 1); setEvent(null); }} aria-label={`Explore race ${i + 1}`}>R{i + 1}</button>)}{coverageExamples.map((e, index) => <div className="guide-coverage-row" key={e.name}><button type="button" className={`guide-coverage-label${event === index ? ' is-selected' : ''}`} aria-pressed={event === index} onClick={() => setEvent(event === index ? null : index)}>{e.name}</button>{Array.from({ length: 12 }, (_, i) => { const covered = e.races.includes(i + 1); return <span key={i} className={`guide-coverage-cell${covered ? ' covered' : ''}${covered && (event === index || (event == null && race === i + 1)) ? ' emphasized' : ''}`} aria-label={`${e.name}, race ${i + 1}: ${covered ? 'included' : 'not included'}`}>{covered ? <span aria-hidden="true">{e.races.indexOf(i + 1) + 1}</span> : <span aria-hidden="true">—</span>}</span>; })}</div>)}</div></div><div className="guide-interaction-caption" aria-live="polite">{event == null ? <><strong>Race {race}</strong> is included in {linked.length ? linked.map(e => e.name).join(', ') : 'none of these example events'}. {linked.length > 1 && 'One sporting result can supply a leg to several separate events.'}</> : <><strong>{coverageExamples[event].name}</strong> uses {coverageExamples[event].races.length} legs: {coverageExamples[event].races.map(r => `R${r}`).join(' → ')}. Cell numbers show leg order.</>}</div><p className="guide-small">R11 and R12 still belong to the meeting even when none of these four events includes them. Actual event availability, leg assignments, changes and cancellations come from that meeting’s published program.</p></div>;
}

const resultFields = [
  { title: 'Finishing order', text: 'Rows follow the recorded result, not gate order or horse-number order. In this official teaching result, no. 2 wins; nos. 4 and 1 share second place. Their program numbers stay the same.' },
  { title: 'Clocking & sectionals', text: 'The winner’s overall time is 1:12.60. The three teaching segments total 72.60 seconds. Real records may label quarters, distances or cumulative readings; do not add cumulative times together or invent missing splits.' },
  { title: 'Margins & positions', text: 'A margin describes recorded separation at the finish. Intermediate columns describe earlier positions: here ½ means halfway, while ¼-to-go means one quarter of the race distance remained. They are not finishing positions or times.' },
  { title: 'DH, DQ & decisions', text: 'DH marks a dead heat: two horses share a placing. DQ marks a disqualification under an official decision. Read the decision and publication status before interpreting a result; a provisional listing may change.' },
];
export function ResultExplorer() {
  const [selected, setSelected] = useState(0);
  return <div className="guide-interactive"><p className="guide-example-label">FICTIONAL OFFICIAL RESULT · NOT CONNECTED TO A LIVE RACE</p><div className="guide-segmented" role="group" aria-label="Explore result fields">{resultFields.map((field, i) => <button type="button" key={field.title} aria-pressed={selected === i} onClick={() => setSelected(i)}>{field.title}</button>)}</div><div className="guide-result-clock"><span><small>RACE 3 · 1,200 M</small><strong>1:12.60</strong><small>Winning time · Official example</small></span><div className="guide-sectionals" aria-label="Fictional non-cumulative 400 metre segment timings"><span>0–400 m<b>24.00 s</b></span><span>400–800 m<b>23.80 s</b></span><span>800–1,200 m<b>24.80 s</b></span></div></div><div className="guide-sample-scroll" tabIndex={0} role="region" aria-label="Sample result placings"><table className="guide-sample-table"><caption>Fictional placings and intermediate-position example</caption><thead><tr><th>Finish</th><th>No. / horse</th><th>½</th><th>¼-to-go</th><th>Horse time</th><th>Margin / mark</th></tr></thead><tbody><tr><td>1</td><td>2 · Amihan Express</td><td>3</td><td>1</td><td>1:12.60</td><td>Winner</td></tr><tr><td>2 =</td><td>4 · Copper Horizon</td><td>1</td><td>2</td><td>1:12.80</td><td>1 length · DH</td></tr><tr><td>2 =</td><td>1 · Moonlit Harbor</td><td>2</td><td>3</td><td>1:12.80</td><td>1 length · DH</td></tr><tr><td>DQ</td><td>3 · Isla Bonita</td><td>4</td><td>4</td><td>Unavailable</td><td>Disqualified · see decision</td></tr></tbody></table></div><p className="guide-interaction-caption" aria-live="polite"><strong>{resultFields[selected].title}.</strong> {resultFields[selected].text}</p><p className="guide-small">Example decision: no. 3 disqualified following an official interference decision. These illustrative margins and timings are independent recorded fields; no universal seconds-per-length conversion is assumed.</p></div>;
}

export function DividendExample() {
  const [view, setView] = useState<'odds' | 'dividend'>('dividend');
  return <div className="guide-interactive"><p className="guide-example-label">FICTIONAL PUBLICATION · AMOUNTS ARE FOR LEARNING ONLY</p><div className="guide-segmented" role="group" aria-label="Compare odds and dividends"><button type="button" aria-pressed={view === 'odds'} onClick={() => setView('odds')}>Before the race · Odds</button><button type="button" aria-pressed={view === 'dividend'} onClick={() => setView('dividend')}>After the race · Dividend</button></div><div className="guide-dividend-display" aria-live="polite">{view === 'odds' ? <><span className="guide-status">MARKET QUOTE · PRE-RACE</span><h3>Horse no. 2 · Quoted odds 3.10</h3><p>A number such as 3.10 is a market quote. Its convention and time of publication matter. It does not establish a final dividend or guarantee a return.</p><span className="guide-small">Official dividend: not published at this stage.</span></> : <><span className="guide-status">OFFICIAL · TEACHING EXAMPLE</span><h3>WIN · Winning combination 2</h3><div className="guide-dividend-values"><div><small>PUBLISHED DIVIDEND</small><strong>PHP 31.00</strong></div><div><small>PUBLISHED UNIT</small><strong>PHP 10.00</strong></div></div><p>Read the amount with its unit, currency, combination and status. The PHP 31.00 figure here is the published dividend for the stated PHP 10.00 unit, not a quoted odd and not a horse-performance score.</p><span className="guide-small">Source: JOCKEY fictional learning example · Historical publications retain their date and corrections.</span></>}</div></div>;
}

export function GlossarySearch() {
  const [query, setQuery] = useState('');
  const results = glossary.filter(g => `${g.term} ${g.definition}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <><label className="guide-glossary-search"><Search size={18} /><span className="guide-sr-only">Search racing glossary</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try ‘gate’, ‘DH’, or ‘dividend’…" /></label><p className="guide-small" role="status">{results.length} terms found</p><dl className="guide-glossary">{results.map(g => <div key={g.term}><dt>{g.term}</dt><dd>{g.definition}</dd></div>)}</dl>{!results.length && <p>No matching terms. Try a shorter word or clear your search.</p>}</>;
}

const questions = [
  { question: 'Horse no. 2 is assigned gate 4. Which number identifies its starting stall?', options: ['2', '4', 'The race number'], answer: 1, explanation: 'Gate 4 is the starting stall. Horse no. 2 is the entry’s program number.' },
  { question: 'A horse ran faster at a different venue. Is that automatically its best comparable time here?', options: ['Yes, any faster time counts', 'Only if it won', 'No, the comparison criteria must match'], answer: 2, explanation: 'JOCKEY’s best comparable time requires the same venue, surface and distance within the stated 180-day window.' },
  { question: 'A race appears in two multi-race events. How many sporting results does that contest produce?', options: ['One result, used by both events', 'Two separate race results', 'One result for each pool'], answer: 0, explanation: 'The contest has one sporting result. Separate event records can use that result as one of their legs.' },
];
export function KnowledgeCheck() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return <div className="guide-quiz">{questions.map((q, i) => <fieldset key={q.question}><legend>{i + 1}. {q.question}</legend>{q.options.map((option, j) => <label key={option}><input type="radio" name={`guide-question-${i}`} value={j} checked={answers[i] === j} onChange={() => setAnswers({ ...answers, [i]: j })} />{option}</label>)}{answers[i] != null && <p role="status" className={answers[i] === q.answer ? 'guide-answer-correct' : 'guide-answer-retry'}>{answers[i] === q.answer ? 'Correct. ' : 'Take another look. '}{q.explanation}</p>}</fieldset>)}</div>;
}
