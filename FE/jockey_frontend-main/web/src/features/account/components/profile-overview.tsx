'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, ChevronRight, Crown, Heart, LogOut, Settings, ShieldCheck } from 'lucide-react';
import type { Profile } from '@/types';
import { api } from '@/lib/api/client';
import { clearAuthTokens } from '@/lib/auth/tokens';
import { logout } from '@/lib/api/auth';

const options = [
  { label: 'My membership', detail: 'Daily access, monthly membership and renewal', href: '/subscribe', Icon: Crown },
  { label: 'Security settings', detail: 'Manage account security', href: '/settings', Icon: ShieldCheck },
  { label: 'Favorites', detail: 'Your saved contenders', href: '/favorites', Icon: Heart },
  { label: 'Notifications', detail: 'Race day updates', href: '/notifications', Icon: Bell },
];

export function ProfileOverview({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [signoutError, setSignoutError] = useState('');
  useEffect(() => {
    const saved = localStorage.getItem('pj-web-profile');
    if (saved) setProfile({ ...initialProfile, ...JSON.parse(saved) as Partial<Profile> });
    void api.getProfile().then((next) => setProfile((current) => ({ ...current, ...next }))).catch(() => undefined);
  }, [initialProfile]);

  async function signOut() {
    try { await logout(); }
    catch { setSignoutError('Could not end your session. Please try again.'); return; }
    localStorage.removeItem('pj-web-profile');
    clearAuthTokens();
    router.push('/login');
  }

  return <main className="app-page profile-page">
    <header className="account-profile-hero">
      <div className="account-profile-top"><span>PROFILE</span><Link href="/settings" aria-label="Open settings"><Settings size={15} /></Link></div>
      <span className="profile-avatar">{profile.initials}</span><p>{profile.memberSince}</p><h1>{profile.firstName} {profile.lastName}</h1><span className="account-profile-email">{profile.email}</span>
    </header>
    <Link className="account-edit-profile" href="/edit-profile">Edit profile <Settings size={13} /></Link>
    <section className="account-wallet-card">
      <div className="account-wallet-heading"><span><Crown size={18} /></span><small>JOCKEY MEMBERSHIP</small></div>
      <strong>Your racing access</strong>
      <Link className="account-withdraw-link" href="/subscribe">View plans &amp; membership <ChevronRight size={16} /></Link>
      <small className="account-wallet-note">Race programs, historical form, statistics and results.</small>
    </section>
    <div className="app-card-list account-profile-options">{options.map(({ label, detail, href, Icon }) => <Link className="profile-option" href={href} key={label}><Icon size={17} /><span><strong>{label}</strong><small>{detail}</small></span><ChevronRight size={16} /></Link>)}</div>
    {signoutError && <p role="alert">{signoutError}</p>}
    <button className="profile-signout" type="button" onClick={() => void signOut()}><LogOut size={15} /> Log out</button>
  </main>;
}
