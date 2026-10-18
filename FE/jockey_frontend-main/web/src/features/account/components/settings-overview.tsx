'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bell, ChevronRight, FileText, Info, LockKeyhole, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { logout } from '@/lib/api/auth';
import { clearAuthTokens } from '@/lib/auth/tokens';

const SETTINGS_KEY = 'pj-web-settings';

export function SettingsOverview() {
  const [preferences, setPreferences] = useState({ raceReminders: true, resultAnnouncements: true });
  const [signoutError, setSignoutError] = useState('');
  async function signOut() {
    try { await logout(); }
    catch { setSignoutError('Could not end your session. Please try again.'); return; }
    clearAuthTokens(); localStorage.removeItem('pj-web-profile'); localStorage.removeItem(SETTINGS_KEY);
    window.location.assign('/login');
  }
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<typeof preferences>;
      setPreferences((current) => ({ ...current, ...saved }));
    } catch { /* Keep the default preferences if local storage is unavailable. */ }
  }, []);

  function toggle(key: keyof typeof preferences) {
    setPreferences((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }

  return <main className="app-page settings-page">
    <header className="settings-hero"><span>PROFILE SETTINGS</span><h1>Settings</h1></header>
    <section className="settings-group"><h2>ACCOUNT</h2>
      <Link className="settings-row" href="/edit-profile"><UserRound size={16} /><span><strong>Account settings</strong><small>Personal information and profile</small></span><ChevronRight size={15} /></Link>
      <Link className="settings-row" href="/notifications"><Bell size={16} /><span><strong>Notification preferences</strong><small>Choose your race day updates</small></span><ChevronRight size={15} /></Link>
      <div className="settings-row settings-row-disabled" aria-disabled="true"><LockKeyhole size={16} /><span><strong>Change password</strong><small>Unavailable until account security is connected</small></span><ChevronRight size={15} /></div>
    </section>
    <section className="settings-group"><h2>LEGAL &amp; INFORMATION</h2>
      <details className="settings-disclosure"><summary><ShieldCheck size={16} /><span><strong>Account information</strong><small>Your profile and saved information</small></span><ChevronRight size={15} /></summary><p>Your account connects your profile, saved favorites and membership records. Use Contact Us for account questions.</p></details>
      <details className="settings-disclosure"><summary><FileText size={16} /><span><strong>Membership access</strong><small>Daily and monthly plans</small></span><ChevronRight size={15} /></summary><p>Daily access lasts 24 hours. Monthly membership lasts one calendar month. Your access period and checkout details are shown on the membership page.</p><Link href="/subscribe">Manage membership →</Link></details>
      <details className="settings-disclosure"><summary><Info size={16} /><span><strong>About this application</strong><small>Philippine Jockey</small></span><ChevronRight size={15} /></summary><p>Philippine Jockey connects race programs, horses, historical form, racing statistics, results and dividends.</p></details>
    </section>
    <section className="settings-toggles" aria-label="Race notifications">
      <label><span><strong>Race reminders</strong><small>Get notified before race time</small></span><input type="checkbox" checked={preferences.raceReminders} onChange={() => toggle('raceReminders')} /></label>
      <label><span><strong>Results announcements</strong><small>Get notified when results are official</small></span><input type="checkbox" checked={preferences.resultAnnouncements} onChange={() => toggle('resultAnnouncements')} /></label>
    </section>
    {signoutError && <p role="alert">{signoutError}</p>}
    <button className="profile-signout settings-signout" type="button" onClick={() => void signOut()}><LogOut size={15} /> Log out</button>
    <footer className="settings-footer">Philippine Jockey · Racing Information</footer>
  </main>;
}
