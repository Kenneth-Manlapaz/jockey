'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CircleAlert, X, Trophy } from 'lucide-react';
import { Button } from '@web/components/ui/button';
import { api } from '@/lib/api/client';
import type { AuthUser } from '@/types';
import { getAuthErrorMessage } from '../error-message';
import { localReturn } from '@web/lib/return-path';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const register = mode === 'register';

  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(''), 6500);
    return () => window.clearTimeout(timeout);
  }, [error]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const fields = new FormData(event.currentTarget);
    try {
      let user: AuthUser;
      if (register) {
        const [firstName, ...lastParts] = String(fields.get('name') ?? '').trim().split(/\s+/);
        user = await api.signUp({ firstName, lastName: lastParts.join(' ') || firstName, email: String(fields.get('email')), mobile: '', password: String(fields.get('password')) });
      } else {
        user = await api.signIn({ email: String(fields.get('email')), password: String(fields.get('password')) });
      }
      localStorage.setItem('pj-web-profile', JSON.stringify(user));
      const query = new URLSearchParams(window.location.search);
      router.replace(localReturn(query.get('next')));
    } catch (cause) {
      setError(getAuthErrorMessage(cause, mode));
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="auth-wrap">
      {error && (
        <div className="auth-toast" role="alert" aria-live="assertive">
          <CircleAlert size={19} aria-hidden="true" />
          <span>{error}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => setError('')}><X size={17} /></button>
        </div>
      )}
      <section className="auth-card">
        <Link className="brand-lockup" href="/">
          <span className="brand-mark"><Trophy size={17} /></span>
          <span><small>PHILIPPINE</small><strong>JOCKEY</strong></span>
        </Link>
        <h1>{register ? 'Join the club.' : 'Welcome back.'}</h1>
        <p>{register ? 'Create your account to follow every race day.' : 'Sign in to pick up where race day left off.'}</p>
        <form className="auth-form" onSubmit={onSubmit}>
          {register && <label>Full name<input name="name" autoComplete="name" required placeholder="Your name" /></label>}
          <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
          <label>Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={8} required placeholder="At least 8 characters" /></label>
          {register && <label className="auth-terms"><input name="acceptTerms" type="checkbox" required />I accept the account terms.</label>}
          <Button className="auth-submit" label={register ? 'Create account' : 'Sign in'} variant="accent" type="submit" loading={loading} />
        </form>
        <p className="auth-note">{register ? 'Already a member?' : 'New to Philippine Jockey?'}{' '}
          <Link href={register ? '/login' : '/register'} onClick={(event) => { event.preventDefault(); router.push(`${register ? '/login' : '/register'}${window.location.search}`); }}>{register ? 'Sign in' : 'Create an account'}</Link>
        </p>
      </section>
    </main>
  );
}
