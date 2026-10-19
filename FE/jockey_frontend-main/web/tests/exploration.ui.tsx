import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ProgramField } from '@web/features/racing/components/program-field';
import { queryString, timeBasis } from '@web/lib/racing-format';
import type { Program, Entry } from '@web/lib/racing';
jest.mock('@web/features/racing/components/save-favorite', () => ({ FavoriteButton: () => <span>Save</span> }));
let container: HTMLDivElement;
let root: Root;
const form = { recent: [], comparable: [], trend: [], stats: { recorded_finishes: 0, wins: 0, top_three: 0 }, best_time_ms: null, best_time_window_days: 180, basis: '', comparable_count: 0, timed_comparable_count: 0, best_time_reason: 'no_comparable_records' };
function program(): Program {
  return { id: 42, timezone: 'Asia/Manila', entries: Array.from({ length: 6 }, (_, i) => ({ id: i+1, horse: { id: i+1, name: `Runner ${i+1}` }, horse_number: i+1, gate: i+1, jockey: null, trainer: null, owner: null, status: i === 5 ? 'scratched' : 'declared', original_declaration: {}, changes: [], form, published_odds: null } as unknown as Entry)) } as Program;
}
beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function click(selector: string) { await act(async () => { (container.querySelector(selector) as HTMLElement).click(); }); }
test('limits comparison to two through four active runners and submits race-scoped IDs', async () => {
  await act(async () => root.render(<ProgramField program={program()} />));
  const submit = container.querySelector('button[type=submit]') as HTMLButtonElement;
  expect(submit.disabled).toBe(true);
  expect((container.querySelector('input[value="6"]') as HTMLInputElement).disabled).toBe(true);
  for (const id of [1, 2, 3, 4]) await click(`input[value="${id}"]`);
  expect(submit.disabled).toBe(false);
  expect((container.querySelector('input[value="5"]') as HTMLInputElement).disabled).toBe(true);
  expect(container.querySelector('form')?.getAttribute('action')).toBe('/race/42/compare');
  expect(new FormData(container.querySelector('form')!).getAll('horse')).toEqual(['1', '2', '3', '4']);
  await click('input[value="4"]');
  expect((container.querySelector('input[value="5"]') as HTMLInputElement).disabled).toBe(false);
});
test('expands entry evidence and sorts missing times without fabricating values', async () => {
  const data = program(); data.entries[2].form = { ...form, best_time_ms: 72000, timed_comparable_count: 2 };
  await act(async () => root.render(<ProgramField program={data} />));
  await click('button[aria-label="Show details for Runner 1"]');
  expect(container.querySelector('#runner-detail-1')?.textContent).toContain('No matching venue');
  const select = container.querySelector('select')!;
  await act(async () => { select.value = 'time'; select.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(container.querySelector('tbody tr input')?.getAttribute('value')).toBe('3');
  expect(container.textContent).toContain('2 timed matches');
  await click('button[aria-label="Hide details for Runner 1"]');
  expect(container.querySelector('#runner-detail-1')).toBeNull();
});
test('preserves history scope during pagination and explains missing timing', () => {
  expect(queryString({ from: '2026-01-01', race: '42', page: '1', surface: 'dirt' }, { page: 2 })).toBe('from=2026-01-01&race=42&page=2&surface=dirt');
  expect(timeBasis({ ...form, best_time_reason: 'race_context_required' })).toContain('Select a race');
  expect(timeBasis({ ...form, best_time_reason: 'no_eligible_individual_time' })).toContain('180-day window');
});
