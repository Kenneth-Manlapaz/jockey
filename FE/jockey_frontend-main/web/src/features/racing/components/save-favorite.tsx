'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/auth/tokens';
import { request } from '@/lib/api/http';

export function FavoriteButton({ horseId, compact = false }: { horseId: number; compact?: boolean }) {
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
  return <><button type="button" className={compact ? 'runner-favorite' : 'app-button secondary sm'} disabled={pending || message === 'Saved'} onClick={() => void save()} aria-label={message === 'Saved' ? 'Horse saved to favorites' : 'Save horse to favorites'} aria-pressed={message === 'Saved'} title={message === 'Saved' ? 'Saved to favorites' : 'Save horse to favorites'}><Star size={15} fill={message === 'Saved' ? 'currentColor' : 'none'} aria-hidden="true" />{!compact && <span>{message === 'Saved' ? 'Saved' : pending ? 'Saving...' : 'Favorite'}</span>}</button>{message !== 'Saved' && message && <small role="status">{message}</small>}</>;
}
