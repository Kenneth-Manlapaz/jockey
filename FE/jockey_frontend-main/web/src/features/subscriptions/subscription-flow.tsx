'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, LockKeyhole, CalendarDays, ArrowRight } from 'lucide-react';
import { request } from '@/lib/api/http';
import '@/lib/api/auth';
import { localReturn } from '@web/lib/return-path';

type Plan = { id: number; code: string; name: string; period: 'daily' | 'monthly'; price: string; currency: string };
type Status = { active: boolean; access_until?: string | null; subscription: { plan: string; starts_at: string; expires_at: string; period: string } | null };
type Checkout = { id: string; price: string; currency: string; plan: string; period: string; provider: string };
const money = (price: string) => Number(price).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function SubscriptionFlow({ destination = '/', initialPlan = '' }: { destination?: string; initialPlan?: string }) {
  const router = useRouter();
  const next = localReturn(destination);
  const frame = useRef<HTMLIFrameElement>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const catalog = await request<{ plans: Plan[]; preview_checkout_enabled: boolean }>('/subscriptions/plans/');
        if (!active) return;
        setPlans(catalog.plans); setEnabled(catalog.preview_checkout_enabled);
        try {
          const access = await request<Status>('/subscriptions/status/', { auth: true });
          if (active) { setStatus(access); setSignedIn(true); }
        } catch { if (active) setSignedIn(false); }
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Membership plans could not be loaded.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!checkout) return;
    document.getElementById('membership-checkout')?.scrollIntoView?.({ behavior: 'auto', block: 'start' });
    let confirming = false;
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== 'null' || event.data?.checkoutId !== checkout.id) return;
      if (event.data.type === 'jockey.checkout.cancel') { setCheckout(null); return; }
      if (event.data.type !== 'jockey.checkout.complete' || confirming) return;
      confirming = true; setBusy(checkout.id); setError('');
      void request('/subscriptions/confirm-preview/', { method: 'POST', auth: true, body: { checkout_id: checkout.id } }).then(async () => {
        const access = await request<Status>('/subscriptions/status/', { auth: true });
        setStatus(access); setCheckout(null); setSuccess(true); router.refresh();
      }).catch(cause => { setError(cause instanceof Error ? cause.message : 'Could not activate membership.'); confirming = false; }).finally(() => setBusy(''));
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [checkout, router]);

  async function choose(plan: Plan) {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/subscribe?plan=${plan.code}&next=${encodeURIComponent(next)}`)}`);
      return;
    }
    setBusy(plan.code); setError(''); setSuccess(false);
    try { setCheckout(await request<Checkout>('/subscriptions/checkout/', { method: 'POST', auth: true, body: { plan: plan.code } })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not open checkout.'); }
    finally { setBusy(''); }
  }
  const daily = plans.find(p => p.period === 'daily');
  const monthly = plans.find(p => p.period === 'monthly');
  const saving = daily && monthly ? Number(daily.price) * 30 - Number(monthly.price) : 0;
  return <main className="web-main racing-page subscription-page">
    <section className="dashboard-hero"><span className="eyebrow">JOCKEY MEMBERSHIP</span><h1>Every race.<br />A clearer picture.</h1><p>Race programs, horse form, racing statistics and published results in one place.</p></section>
    {error && <section className="web-card" role="alert"><h2>Could not complete that step</h2><p>{error}</p></section>}
    {loading ? <section className="web-card"><p role="status">Loading membership plans…</p></section> : <>
      {status?.active && <section className="web-card subscription-active"><span className="subscription-check"><Check size={22} /></span><div><h2>{success ? 'Your membership is active' : 'You’re a JOCKEY member'}</h2><p>{status.subscription?.plan} · Access until {status.subscription && new Date(status.access_until || status.subscription.expires_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })} PHT</p><Link className="app-button primary" href={next === '/subscribe' ? '/' : next}>Continue to racing <ArrowRight size={15} /></Link></div></section>}
      {!signedIn && <section className="subscription-signin"><LockKeyhole size={18} /><span>Choose a plan, then sign in or create your account to continue.</span><Link href={`/login?next=${encodeURIComponent(`/subscribe?next=${encodeURIComponent(next)}${initialPlan ? `&plan=${initialPlan}` : ''}`)}`}>Already a member? Sign in</Link></section>}
      <div className="subscription-plans">{plans.map(plan => <section className={`web-card subscription-plan${plan.period === 'monthly' ? ' recommended' : ''}${initialPlan === plan.code ? ' selected-plan' : ''}`} key={plan.code}>{plan.period === 'monthly' && <span className="subscription-value">BEST VALUE</span>}<span className="racing-kicker">{plan.period === 'daily' ? 'ONE RACE DAY AND MORE' : 'FOLLOW THE FULL MONTH'}</span><h2>{plan.name}</h2><div className="subscription-price"><span>₱</span><strong>{money(plan.price)}</strong><small>/{plan.period === 'daily' ? '24 hours' : 'calendar month'}</small></div><p>{plan.period === 'daily' ? 'Full access for 24 hours from activation, regardless of the time you join.' : 'Full access for one calendar month. One membership for every racing date in that period.'}</p><ul>{['Complete race programs & declared entries', 'Horse, jockey, trainer & owner statistics', 'Recent & comparable historical form', 'Results, event legs & published dividends'].map(feature => <li key={feature}><Check size={14} />{feature}</li>)}</ul>{plan.period === 'monthly' && saving > 0 && <p className="subscription-saving">Save ₱{saving.toLocaleString('en-PH')} versus 30 daily passes.</p>}<button className={`app-button ${plan.period === 'monthly' ? 'accent' : 'primary'}`} disabled={!!busy || (signedIn && !enabled)} onClick={() => void choose(plan)}>{busy === plan.code ? 'Opening checkout…' : !signedIn && initialPlan === plan.code ? 'Sign in & continue' : status?.active ? 'Extend membership' : `Choose ${plan.period === 'daily' ? 'daily access' : 'monthly membership'}`}</button></section>)}</div>
      {!enabled && <section className="web-card"><p>Online checkout is not configured for this server yet. Existing memberships remain available through your account.</p></section>}
      {checkout && <section className="web-card subscription-checkout" id="membership-checkout"><div className="section-head"><h2>Complete your membership</h2><button className="app-button secondary sm" disabled={!!busy} onClick={() => setCheckout(null)}>Close</button></div><p>{checkout.plan} · {checkout.currency} {money(checkout.price)}</p><p className="subscription-preview-note">Demo checkout · Every payment is approved. No money will be charged. Complete the payment step below to activate your membership.</p><iframe ref={frame} title="Membership payment preview" src={`/subscription/payment-frame?checkout=${encodeURIComponent(checkout.id)}`} sandbox="allow-scripts" referrerPolicy="no-referrer" />{busy === checkout.id && <p role="status">Activating your membership…</p>}</section>}
      <section className="web-card subscription-details"><h2>Access that fits your race day</h2><div><p><CalendarDays size={18} /> Daily access lasts exactly 24 hours. Monthly access ends at the same local time one calendar month later; shorter months use their final day.</p><p>Both plans unlock the same racing information. Renewals add time after your current membership, so remaining access is retained. There is no automatic renewal in this flow.</p><p>The calendar and learning guide remain open to everyone. A signed-in account and active membership are required for programs, directories, statistics, results and dividends.</p></div></section>
    </>}
  </main>;
}
