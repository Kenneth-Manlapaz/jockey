import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { InformationNavigation } from '@web/components/common/information-navigation';
import { AnnotatedProgram, HorseFormExample, EventCoverage, ResultExplorer, DividendExample, GlossarySearch, KnowledgeCheck } from '@web/features/education/guide-examples';
import { SupportNote } from '@web/features/education/support-note';
import { bestTimeExample, eventsForExampleRace } from '@web/lib/education';
import { getMe } from '@/lib/api/auth';

jest.mock('next/navigation', () => ({ usePathname: () => '/directory/horses' }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, onClick, ...props }: { href: string; children: ReactNode; onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void }) => <a href={href} {...props} onClick={event => { event.preventDefault(); onClick?.(event); }}>{children}</a> }));
jest.mock('@/lib/api/auth', () => ({ getMe: jest.fn() }));

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  jest.mocked(getMe).mockRejectedValue(new Error('Signed out'));
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { callback(0); return 1; });
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); jest.restoreAllMocks(); });
async function render(content: ReactNode) { await act(async () => { root.render(content); }); }
async function click(element: Element | null) { expect(element).not.toBeNull(); await act(async () => { (element as HTMLElement).click(); }); }
function button(label: string) { return Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes(label)) ?? null; }

describe('Racing Stats disclosure navigation', () => {
  test('supports click, keyboard movement and Escape focus restoration', async () => {
    await render(<InformationNavigation />);
    const trigger = button('Racing Stats')!;
    const panel = container.querySelector('#jockey-stats-links') as HTMLElement;
    expect(panel.hidden).toBe(true);
    await click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(Array.from(panel.querySelectorAll('a')).map(a => a.getAttribute('href'))).toEqual(['/directory/horses', '/directory/jockeys', '/directory/trainers', '/directory/owners']);
    trigger.focus();
    await act(async () => { trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); });
    expect(document.activeElement?.textContent).toContain('Horses');
    await act(async () => { document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })); });
    expect(document.activeElement?.textContent).toContain('Owners');
    await act(async () => { document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });
  test('mobile navigation opens, expands directories and closes after selection', async () => {
    await render(<InformationNavigation />);
    const toggle = container.querySelector('[aria-controls="jockey-main-navigation"]')!;
    await click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    await click(button('Racing Stats'));
    await click(container.querySelector('a[href="/directory/trainers"]'));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(button('Racing Stats')?.getAttribute('aria-expanded')).toBe('false');
  });
  test('hover opens directories and clicking outside closes the navigation', async () => {
    await render(<InformationNavigation />);
    const dropdown = button('Racing Stats')!.parentElement!;
    await act(async () => { dropdown.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); });
    expect(button('Racing Stats')?.getAttribute('aria-expanded')).toBe('true');
    await act(async () => { document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })); });
    expect(button('Racing Stats')?.getAttribute('aria-expanded')).toBe('false');
  });
  test('shows Favorites in the account menu only after account verification', async () => {
    jest.mocked(getMe).mockResolvedValue({ first_name: 'Ana' } as Awaited<ReturnType<typeof getMe>>);
    await render(<InformationNavigation />);
    expect(container.querySelector('a[href="/login"]')).toBeNull();
    await click(button('Account'));
    expect((container.querySelector('#jockey-account-links') as HTMLElement).hidden).toBe(false);
    expect(container.querySelector('a[href="/favorites"]')?.textContent).toBe('Favorites');
  });
});

describe('Original interactive racing examples', () => {
  test('program annotations update and retain keyboard focus', async () => {
    await render(<AnnotatedProgram />);
    const gate = container.querySelector('[aria-label="5. Starting gate"]') as HTMLButtonElement;
    gate.focus(); await click(gate);
    expect(container.querySelector('#program-explanation')?.textContent).toContain('horse number 2 starts from gate 4');
    expect(document.activeElement).toBe(gate);
    expect(gate.getAttribute('aria-pressed')).toBe('true');
  });
  test('recent and comparable forms select different rows and best time excludes the old fastest run', async () => {
    await render(<HorseFormExample />);
    expect(container.querySelectorAll('.guide-row-highlight')).toHaveLength(5);
    await click(button('Last 5 DIST'));
    const comparable = Array.from(container.querySelectorAll('.guide-row-highlight')).map(row => row.textContent);
    expect(comparable.every(row => row?.includes('Sierra Verde Park'))).toBe(true);
    expect(comparable.some(row => row?.includes('Unavailable'))).toBe(true);
    expect(bestTimeExample()).toBe(72600);
    await click(button('Best time'));
    expect(container.querySelector('[role="status"]')?.textContent).toContain('1:12.60');
    expect(Array.from(container.querySelectorAll('.guide-row-highlight')).some(row => row.textContent?.includes('2026-03-22'))).toBe(false);
  });
  test('coverage links one race to multiple events and handles uncovered races', async () => {
    await render(<EventCoverage />);
    expect(eventsForExampleRace(4)).toHaveLength(4);
    await click(container.querySelector('[aria-label="Explore race 12"]'));
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain('none of these example events');
    await click(button('1st PICK 5'));
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain('R2 → R3 → R4 → R5 → R6');
  });
  test('result annotations explain DH, DQ and the official decision', async () => {
    await render(<ResultExplorer />); await click(button('DH, DQ'));
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain('dead heat');
    expect(container.textContent).toContain('interference decision');
  });
  test('odds and dividends remain separate publications', async () => {
    await render(<DividendExample />);
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain('PHP 10.00');
    await click(button('Before the race'));
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain('Quoted odds 3.10');
    expect(container.querySelector('[aria-live="polite"]')?.textContent).not.toContain('PHP 31.00');
  });
  test('glossary search narrows definitions and gives an empty state', async () => {
    await render(<GlossarySearch />);
    const input = container.querySelector('input')!;
    async function type(value: string) { await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); }); }
    await type('dead heat');
    expect(container.querySelectorAll('dt')).toHaveLength(1);
    expect(container.querySelector('dt')?.textContent).toContain('Dead heat');
    await type('zzzzzz'); expect(container.textContent).toContain('No matching terms');
  });
  test('knowledge checks give explanatory feedback', async () => {
    await render(<KnowledgeCheck />);
    await click(container.querySelector('input[name="guide-question-0"][value="1"]'));
    expect(container.querySelector('.guide-answer-correct')?.textContent).toContain('Gate 4 is the starting stall');
  });
  test('support note downloads a local file without claiming message delivery', async () => {
    const makeUrl = jest.fn(() => 'blob:sample-note');
    Object.defineProperty(URL, 'createObjectURL', { value: makeUrl, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: jest.fn(), configurable: true });
    const download = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    await render(<SupportNote />);
    await act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(makeUrl).toHaveBeenCalledTimes(1); expect(download).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="status"]')?.textContent).toContain('No message has been sent');
  });
});
