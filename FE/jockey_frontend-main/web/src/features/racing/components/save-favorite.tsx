'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/auth/tokens';
import { request } from '@/lib/api/http';

export function FavoriteButton({ horseId }: { horseId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  async function save() {
    if (!getAccessToken()) { router.push(`/login?next=${encodeURIComponent(pathname + window.location.search)}`); return; }
    setPending(true);
    try { await request('/favorites/', { method: 'POST', auth: true, body: { target_type: 'horse', horse: horseId } }); setMessage('Saved'); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Could not save favorite.'); }
    finally { setPending(false); }
  }
  return <><button type="button" className="app-button secondary sm" disabled={pending || message === 'Saved'} onClick={() => void save()} aria-label="Save horse to favorites">{message === 'Saved' ? '★ Saved' : pending ? 'Saving…' : '☆ Favorite'}</button>{message !== 'Saved' && message && <small role="status">{message}</small>}</>;
}
