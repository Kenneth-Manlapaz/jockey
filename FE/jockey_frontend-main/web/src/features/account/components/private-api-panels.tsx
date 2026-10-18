'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bell, Heart } from 'lucide-react';
import { api } from '@/lib/api/client';
import { deleteFavorite } from '@/lib/api/endpoints';

type RecordValue = Record<string, unknown>;

function recordsOf(value: unknown): RecordValue[] {
  if (Array.isArray(value)) return value.filter((row): row is RecordValue => typeof row === 'object' && row !== null);
  if (typeof value === 'object' && value !== null) {
    const root = value as RecordValue;
    for (const key of ['results', 'favorites', 'notifications']) {
      if (Array.isArray(root[key])) return (root[key] as unknown[]).filter((row): row is RecordValue => typeof row === 'object' && row !== null);
    }
  }
  return [];
}

function firstText(record: RecordValue, keys: string[]) {
  for (const key of keys) if (typeof record[key] === 'string' && record[key]) return record[key] as string;
  return '';
}

function favoriteView(record: RecordValue, index: number) {
  const entity = (record.horse ?? record.jockey ?? record.entry ?? record.target ?? record.object ?? record) as RecordValue;
  const kind = firstText(record, ['type', 'favorite_type', 'content_type'])
    || firstText(record, ['target_type']) || (record.horse ? 'horse' : record.jockey ? 'jockey' : 'favorite');
  const target = record[kind];
  const targetId = typeof target === 'number' || typeof target === 'string' ? String(target) : '';
  const href = !targetId ? '/races' : kind === 'horse' ? `/horse/${targetId}` : kind === 'race' ? `/race/${targetId}`
    : kind === 'jockey' ? `/people/jockeys/${targetId}` : kind === 'trainer' ? `/people/trainers/${targetId}` : '/races';
  return {
    id: record.id == null ? '' : String(record.id),
    name: firstText(record, ['target_name']) || firstText(entity, ['full_name', 'name', 'horse_name', 'display_name']) || `Saved ${kind} ${index + 1}`,
    kind,
    href,
    image: firstText(entity, ['photo_url', 'image_url', 'horse_photo']),
  };
}

export function FavoritesPanel() {
  const [items, setItems] = useState<RecordValue[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [removeError, setRemoveError] = useState('');
  const [removing, setRemoving] = useState('');

  async function remove(id: string) {
    setRemoving(id);
    setRemoveError('');
    try { await deleteFavorite(id); await reload(); }
    catch (cause) { setRemoveError(cause instanceof Error ? cause.message : 'Could not remove favorite.'); }
    finally { setRemoving(''); }
  }

  async function reload() {
    setLoading(true);
    setError('');
    try {
      setItems(recordsOf(await api.getFavorites()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load favorites.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void reload(); }, []);

  if (loading) return <p className="app-empty">Loading favorites…</p>;
  if (error) return <section className="app-empty-card"><Heart size={22} /><strong>Sign in to view favorites</strong><small>{error}</small><Link href="/login">Sign in</Link></section>;
  if (!items.length) return <section className="app-empty-card"><Heart size={22} /><strong>No saved favorites</strong><small>Favorites from your account will show here.</small><Link href="/races">Explore races</Link></section>;

  return <>{removeError && <p role="alert">{removeError}</p>}<div className="app-card-list">{items.map((item, index) => {
    const favorite = favoriteView(item, index);
    return <article className="app-favorite-row" key={favorite.id || index}>
      {favorite.image ? <img src={favorite.image} alt="" /> : <span className="app-race-number">★</span>}
      <span><Link href={favorite.href}><strong>{favorite.name}</strong></Link><small>Favorite {favorite.kind}</small></span>
      <button className="app-button secondary sm" disabled={removing === favorite.id} onClick={() => void remove(favorite.id)}>Remove</button>
    </article>;
  })}</div></>;
}

export function NotificationsPanel() {
  const [payload, setPayload] = useState<unknown>(null);
  const [localNotifications, setLocalNotifications] = useState<RecordValue[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  async function reload() {
    setLoading(true);
    setError('');
    try {
      setLocalNotifications(recordsOf(JSON.parse(localStorage.getItem('pj-web-notifications') ?? '[]')));
    } catch {
      setLocalNotifications([]);
    }
    try {
      setPayload(await api.getNotifications());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void reload(); }, []);

  async function markRead() {
    setMarking(true);
    const read = localNotifications.map((notification) => ({ ...notification, is_read: true }));
    setLocalNotifications(read);
    localStorage.setItem('pj-web-notifications', JSON.stringify(read));
    try {
      await api.markAllNotificationsRead();
      await reload();
    } catch (cause) {
      if (!localNotifications.length) setError(cause instanceof Error ? cause.message : 'Could not update notifications.');
    } finally {
      setMarking(false);
    }
  }

  if (loading) return <p className="app-empty">Loading notifications…</p>;
  if (error && !localNotifications.length) return <section className="app-empty-card"><Bell size={23} /><strong>Sign in to view notifications</strong><small>{error}</small><Link href="/login">Sign in</Link></section>;

  const remoteRows = recordsOf(payload);
  const rows = [...localNotifications, ...remoteRows];
  const remoteUnread = typeof payload === 'object' && payload !== null && 'unread_count' in payload
    ? Number((payload as RecordValue).unread_count)
    : remoteRows.filter((row) => row.is_read === false || row.read === false).length;
  const unread = remoteUnread + localNotifications.filter((row) => row.is_read === false).length;

  return <section className="app-notifications-panel">
    <div className="app-section-title"><span>{unread} unread</span><button type="button" onClick={() => void markRead()} disabled={!unread || marking}>{marking ? 'Updating…' : 'Mark all read'}</button></div>
    {rows.length ? rows.map((row, index) => {
      const content = <><Bell size={17} /><span><strong>{firstText(row, ['title', 'message', 'text']) || 'Race day update'}</strong>{firstText(row, ['body']) ? <small>{firstText(row, ['body'])}</small> : null}<small>{firstText(row, ['created_at', 'timestamp', 'date'])}</small></span></>;
      const destination = firstText(row, ['deep_link', 'href']);
      return destination.startsWith('/')
        ? <Link className="app-notification-row" href={destination} key={String(row.id ?? index)}>{content}</Link>
        : <article className="app-notification-row" key={String(row.id ?? index)}>{content}</article>;
    }) : <section className="app-empty-card"><Bell size={23} /><strong>You’re all caught up</strong><small>There are no unread notifications.</small></section>}
  </section>;
}
