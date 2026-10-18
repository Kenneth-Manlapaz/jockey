import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SubscriptionFlow } from '@web/features/subscriptions/subscription-flow';
import { request } from '@/lib/api/http';

const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush, refresh: mockRefresh }) }));
jest.mock('@/lib/api/http', () => ({ request: jest.fn() }));
jest.mock('@/lib/api/auth', () => ({}));
const plans = [{ id: 1, code: 'daily', name: 'Daily Access', period: 'daily', price: '50.00', currency: 'PHP' },
  { id: 2, code: 'monthly', name: 'Monthly Membership', period: 'monthly', price: '499.00', currency: 'PHP' }];
let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string) {
  const button = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes(text));
  expect(button).toBeDefined(); await act(async () => button!.click());
}
test('daily and monthly plans have distinct validity, savings and a contextual login destination', async () => {
  jest.mocked(request).mockImplementation(async path => {
    if (path.includes('plans')) return { plans, preview_checkout_enabled: true } as never;
    throw new Error('Sign in');
  });
  await act(async () => { root.render(<SubscriptionFlow destination="/race/42" />); });
  expect(host.textContent).toContain('24 hours'); expect(host.textContent).toContain('calendar month');
  expect(host.textContent).toContain('Save ₱1,001');
  await click('Choose daily access');
  expect(mockPush.mock.calls[0][0]).toContain('/login?next=');
  expect(decodeURIComponent(mockPush.mock.calls[0][0])).toContain('plan=daily');
});
test('checkout frame must match both its source and checkout ID before activation', async () => {
  const id = '11111111-1111-1111-1111-111111111111';
  let confirmed = false;
  jest.mocked(request).mockImplementation(async path => {
    if (path.includes('plans')) return { plans, preview_checkout_enabled: true } as never;
    if (path.includes('confirm-preview')) { confirmed = true; return { active: true } as never; }
    if (path.includes('checkout')) return { id, plan: 'Daily Access', price: '50.00', currency: 'PHP', period: 'daily', provider: 'preview' } as never;
    return { active: confirmed, subscription: confirmed ? { plan: 'Daily Access', starts_at: '2026-10-18T08:00:00Z', expires_at: '2026-10-19T08:00:00Z', period: 'daily' } : null } as never;
  });
  await act(async () => { root.render(<SubscriptionFlow destination="/race/42" />); });
  await click('Choose daily access');
  const frame = host.querySelector('iframe')!;
  expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
  expect(host.textContent).toContain('No money will be charged');
  await act(async () => { window.dispatchEvent(new MessageEvent('message', { source: window, origin: 'null', data: { type: 'jockey.checkout.complete', checkoutId: id } })); });
  expect(confirmed).toBe(false);
  await act(async () => { window.dispatchEvent(new MessageEvent('message', { source: frame.contentWindow, origin: 'null', data: { type: 'jockey.checkout.complete', checkoutId: id } })); });
  expect(confirmed).toBe(true);
  expect(host.textContent).toContain('Your membership is active');
  expect(host.querySelector('a[href="/race/42"]')).not.toBeNull();
});
test('server-disabled preview does not allow checkout activation', async () => {
  jest.mocked(request).mockImplementation(async path => (path.includes('plans') ? { plans, preview_checkout_enabled: false } : { active: false, subscription: null }) as never);
  await act(async () => { root.render(<SubscriptionFlow />); });
  expect(Array.from(host.querySelectorAll('button')).every(b => b.disabled)).toBe(true);
  expect(host.textContent).toContain('Online checkout is not configured');
});
