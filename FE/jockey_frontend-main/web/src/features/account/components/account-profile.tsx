'use client';
import { useEffect, useState } from 'react';
import type { Profile } from '@/types';
import { api } from '@/lib/api/client';
import { ProfileOverview } from './profile-overview';
import { EditProfileForm } from './edit-profile-form';

export function AccountProfile({ edit = false }: { edit?: boolean }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { void api.getProfile().then(setProfile).catch(e => setError(e instanceof Error ? e.message : 'Could not load account.')); }, []);
  if (!profile) return <main className="web-main"><section className="web-card"><p role="status">{error || 'Loading account…'}</p></section></main>;
  return edit ? <main className="app-page"><header className="app-page-heading"><span>YOUR ACCOUNT</span><h1>Edit profile</h1></header><EditProfileForm profile={profile} /></main> : <ProfileOverview initialProfile={profile} />;
}
