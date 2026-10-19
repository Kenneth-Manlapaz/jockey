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
type Activation = { starts_at: string; expires_at: string };
const money = (price: string) => Number(price).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function SubscriptionFlow({ destination = '/', initialPlan = '' }: { destination?: string; initialPlan?: string }) {
  const router = useRouter();
  const next = localReturn(destination);
  const pendingCheckout = useRef<Checkout | null>(null);
  const confirming = useRef(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
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
    if (!selectedPlan) return;
    document.getElementById('membership-checkout')?.scrollIntoView?.({ behavior: 'auto', block: 'start' });
  }, [selectedPlan]);

  useEffect(() => {
    if (success) document.getElementById('membership-success')?.scrollIntoView?.({ behavior: 'auto', block: 'start' });
  }, [success]);

  function choose(plan: Plan) {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/subscribe?plan=${plan.code}&next=${encodeURIComponent(next)}`)}`);
      return;
    }
    pendingCheckout.current = null;
    setSelectedPlan(plan); setError(''); setSuccess(false);
  }

  async function confirmMembership() {
    if (!selectedPlan || confirming.current) return;
    confirming.current = true; setBusy(selectedPlan.code); setError('');
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('The server did not respond. Please try Confirm payment again.'));
        controller.abort();
      }, 15000);
    });
    try {
      const activation = await Promise.race([timeout, (async () => {
        if (!pendingCheckout.current) {
          pendingCheckout.current = await request<Checkout>('/subscriptions/checkout/', {
            method: 'POST', auth: true, body: { plan: selectedPlan.code }, signal: controller.signal,
          });
        }
        // Demo activation only: no provider, payment details or money movement.
        return request<Activation>('/subscriptions/confirm-preview/', {
          method: 'POST', auth: true, body: { checkout_id: pendingCheckout.current.id }, signal: controller.signal,
        });
      })()]);
      setStatus({ active: true, access_until: activation.expires_at,
        subscription: status?.subscription ?? { plan: selectedPlan.name, period: selectedPlan.period,
          starts_at: activation.starts_at, expires_at: activation.expires_at } });
      pendingCheckout.current = null;
      setSelectedPlan(null); setSuccess(true); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not activate membership. Please try again.');
    } finally {
      clearTimeout(timer!); confirming.current = false; setBusy('');
    }
  }
  const daily = plans.find(p => p.period === 'daily');
  const monthly = plans.find(p => p.period === 'monthly');
  const saving = daily && monthly ? Number(daily.price) * 30 - Number(monthly.price) : 0;
  return <main className="web-main racing-page subscription-page">
    <section className="dashboard-hero"><span className="eyebrow">JOCKEY MEMBERSHIP</span><h1>Every race.<br />A clearer picture.</h1><p>Race programs, horse form, racing statistics and published results in one place.</p></section>
    {error && <section className="web-card" role="alert"><h2>Could not complete that step</h2><p>{error}</p></section>}
    {loading ? <section className="web-card"><p role="status">Loading membership plans…</p></section> : <>
      {status?.active && <section className="web-card subscription-active" id="membership-success" role="status"><span className="subscription-check"><Check size={22} /></span><div><h2>{success ? 'Your membership is active' : 'You’re a JOCKEY member'}</h2><p>{status.subscription?.plan} · Access until {status.subscription && new Date(status.access_until || status.subscription.expires_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })} PHT</p><Link className="app-button primary" href={next === '/subscribe' ? '/' : next}>Continue to racing <ArrowRight size={15} /></Link></div></section>}
      {!signedIn && <section className="subscription-signin"><LockKeyhole size={18} /><span>Choose a plan, then sign in or create your account to continue.</span><Link href={`/login?next=${encodeURIComponent(`/subscribe?next=${encodeURIComponent(next)}${initialPlan ? `&plan=${initialPlan}` : ''}`)}`}>Already a member? Sign in</Link></section>}
      <div className="subscription-plans">{plans.map(plan => <section className={`web-card subscription-plan${plan.period === 'monthly' ? ' recommended' : ''}${initialPlan === plan.code ? ' selected-plan' : ''}`} key={plan.code}>{plan.period === 'monthly' && <span className="subscription-value">BEST VALUE</span>}<span className="racing-kicker">{plan.period === 'daily' ? 'ONE RACE DAY AND MORE' : 'FOLLOW THE FULL MONTH'}</span><h2>{plan.name}</h2><div className="subscription-price"><span>₱</span><strong>{money(plan.price)}</strong><small>/{plan.period === 'daily' ? '24 hours' : 'calendar month'}</small></div><p>{plan.period === 'daily' ? 'Full access for 24 hours from activation, regardless of the time you join.' : 'Full access for one calendar month. One membership for every racing date in that period.'}</p><ul>{['Complete race programs & declared entries', 'Horse, jockey, trainer & owner statistics', 'Recent & comparable historical form', 'Results, event legs & published dividends'].map(feature => <li key={feature}><Check size={14} />{feature}</li>)}</ul>{plan.period === 'monthly' && saving > 0 && <p className="subscription-saving">Save ₱{saving.toLocaleString('en-PH')} versus 30 daily passes.</p>}<button className={`app-button ${plan.period === 'monthly' ? 'accent' : 'primary'}`} disabled={!!busy || (signedIn && !enabled)} onClick={() => choose(plan)}>{busy === plan.code ? 'Activating membership...' : !signedIn && initialPlan === plan.code ? 'Sign in & continue' : status?.active ? 'Extend membership' : `Choose ${plan.period === 'daily' ? 'daily access' : 'monthly membership'}`}</button></section>)}</div>
      {!enabled && <section className="web-card"><p>Online checkout is not configured for this server yet. Existing memberships remain available through your account.</p></section>}
      {selectedPlan && <section className="web-card subscription-checkout" id="membership-checkout" aria-labelledby="confirmation-heading">
        <h2 id="confirmation-heading">Confirm your membership</h2>
        <p>{selectedPlan.name} · {selectedPlan.currency} {money(selectedPlan.price)} / {selectedPlan.period === 'daily' ? '24 hours' : 'calendar month'}</p>
        <p className="subscription-preview-note">This is a demonstration. Confirm payment to activate your membership. No payment details are needed and no money will be charged.</p>
        {error && <p role="alert">{error}</p>}
        <div className="subscription-actions">
          <button className="app-button primary" disabled={!!busy} onClick={() => void confirmMembership()}>{busy ? 'Activating membership...' : 'Confirm payment'}</button>
          <button className="app-button secondary" disabled={!!busy} onClick={() => { setSelectedPlan(null); pendingCheckout.current = null; setError(''); }}>Cancel</button>
        </div>
      </section>}
      <section className="web-card subscription-details"><h2>Access that fits your race day</h2><div><p><CalendarDays size={18} /> Daily access lasts exactly 24 hours. Monthly access ends at the same local time one calendar month later; shorter months use their final day.</p><p>Both plans unlock the same racing information. Renewals add time after your current membership, so remaining access is retained. There is no automatic renewal in this flow.</p><p>The calendar and learning guide remain open to everyone. A signed-in account and active membership are required for programs, directories, statistics, results and dividends.</p></div></section>
    </>}
  </main>;
}
