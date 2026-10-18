'use client';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getMe } from '@/lib/api/auth';

const privateRoutes = ['/favorites', '/profile', '/edit-profile', '/settings', '/notifications', '/rewards'];
export function AccountBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const restricted = privateRoutes.includes(pathname);
  const [state, setState] = useState<'loading' | 'signed-in' | 'signed-out'>('loading');
  useEffect(() => {
    if (!restricted) return;
    let active = true;
    void getMe().then(() => { if (active) setState('signed-in'); }).catch(() => { if (active) setState('signed-out'); });
    return () => { active = false; };
  }, [pathname, restricted]);
  if (!restricted || state === 'signed-in') return children;
  return <main className="web-main racing-page"><section className="web-card"><h2>{state === 'loading' ? 'Loading your account…' : 'Sign in to continue'}</h2>{state === 'signed-out' && <><p>Sign in to manage your account. Racing information is available with an active daily or monthly membership.</p><Link className="app-button primary" href={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link><p><Link className="racing-link" href="/">Explore the racing calendar</Link></p></>}</section></main>;
}
