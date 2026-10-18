'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import type { Profile } from '@/types';
import { Button } from '@web/components/ui/button';
import { updateMe } from '@/lib/api/endpoints';

export function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const firstName = String(form.get('firstName'));
    const lastName = String(form.get('lastName'));
    setSaving(true);
    setError('');
    try {
    await updateMe({ first_name: firstName, last_name: lastName });
    localStorage.setItem('pj-web-profile', JSON.stringify({
      firstName,
      lastName,
      email: String(form.get('email')),
      initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
    }));
    router.push('/profile');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update profile.'); }
    finally { setSaving(false); }
  }
  return <form className="profile-edit-form" onSubmit={onSubmit}>
    <label>First name<input name="firstName" defaultValue={profile.firstName} required /></label>
    <label>Last name<input name="lastName" defaultValue={profile.lastName} required /></label>
    <label>Email address<input name="email" type="email" defaultValue={profile.email} readOnly /></label>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <Button label="Save changes" variant="accent" type="submit" loading={saving} leadingIcon={<Save size={16} />} />
  </form>;
}
