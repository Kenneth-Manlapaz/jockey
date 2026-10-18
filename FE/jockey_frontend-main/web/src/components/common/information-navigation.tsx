'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown, Menu, Trophy, X } from 'lucide-react';
import { getMe } from '@/lib/api/auth';

const directories = [ ['Horses', '/directory/horses'], ['Jockeys', '/directory/jockeys'], ['Trainers', '/directory/trainers'], ['Owners', '/directory/owners'] ];

export function InformationNavigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const nav = useRef<HTMLElement>(null);
  const stats = useRef<HTMLDivElement>(null);
  const statsButton = useRef<HTMLButtonElement>(null);
  const accountButton = useRef<HTMLButtonElement>(null);
  const mobileButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    void getMe().then(user => { if (active) setAccount(user.first_name || 'Account'); }).catch(() => { if (active) setAccount(null); });
    const closeOutside = (event: PointerEvent) => { if (!nav.current?.contains(event.target as Node)) { setStatsOpen(false); setAccountOpen(false); setMobileOpen(false); } };
    document.addEventListener('pointerdown', closeOutside);
    return () => { active = false; document.removeEventListener('pointerdown', closeOutside); };
  }, []);

  function close() { setMobileOpen(false); setStatsOpen(false); setAccountOpen(false); }
  function active(href: string) {
    return href === '/' ? ['/', '/dashboard', '/races'].includes(pathname) || ['/race/', '/meeting/', '/event/'].some(prefix => pathname.startsWith(prefix)) : pathname === href || pathname.startsWith(`${href}/`);
  }
  const inStats = ['/directory/', '/horse/', '/jockey/', '/people/'].some(prefix => pathname.startsWith(prefix));
  function statsKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setStatsOpen(false); statsButton.current?.focus(); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    setStatsOpen(true);
    requestAnimationFrame(() => {
      const links = Array.from(stats.current?.querySelectorAll<HTMLAnchorElement>('.site-dropdown-panel a') ?? []);
      const current = links.findIndex(link => link === document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : event.key === 'ArrowDown' ? (current + 1) % links.length : (current < 0 ? links.length - 1 : (current - 1 + links.length) % links.length);
      links[next]?.focus();
    });
  }
  return <header ref={nav} className="web-nav jockey-navigation" onKeyDown={event => {
    if (event.key !== 'Escape') return;
    if (accountOpen) { setAccountOpen(false); accountButton.current?.focus(); }
    else { close(); mobileButton.current?.focus(); }
  }}>
    <Link className="brand-lockup" href="/" onClick={close} aria-label="Philippine Jockey home"><span className="brand-mark"><Trophy size={17} /></span><span><small>PHILIPPINE</small><strong>JOCKEY</strong></span></Link>
    <button ref={mobileButton} className="site-mobile-toggle" type="button" aria-expanded={mobileOpen} aria-controls="jockey-main-navigation" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} onClick={() => { if (mobileOpen) close(); else setMobileOpen(true); }}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}<span>Menu</span></button>
    <nav className={`site-navigation-links${mobileOpen ? ' is-open' : ''}`} id="jockey-main-navigation" aria-label="Main navigation">
      <Link className={active('/') ? 'is-active' : ''} aria-current={active('/') ? pathname === '/' ? 'page' : 'location' : undefined} href="/" onClick={close}>Calendar / Races</Link>
      <div className="site-dropdown" ref={stats} onKeyDown={statsKeys} onMouseEnter={() => { setStatsOpen(true); setAccountOpen(false); }} onMouseLeave={() => { if (!stats.current?.contains(document.activeElement)) setStatsOpen(false); }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setStatsOpen(false); }}>
        <button ref={statsButton} className={inStats ? 'is-active' : ''} type="button" aria-expanded={statsOpen} aria-controls="jockey-stats-links" onClick={() => { setStatsOpen(!statsOpen); setAccountOpen(false); }}>Racing Stats <ChevronDown size={14} /></button>
        <div className="site-dropdown-panel" id="jockey-stats-links" hidden={!statsOpen} aria-label="Racing statistics directories">{directories.map(([name, href]) => <Link href={href} key={href} className={active(href) || (name === 'Horses' && pathname.startsWith('/horse/')) || pathname.startsWith(`/people/${name.toLowerCase()}/`) ? 'is-active' : ''} aria-current={active(href) ? 'page' : undefined} onClick={close}>{name}<span>Profiles &amp; recorded form</span></Link>)}</div>
      </div>
      <Link className={active('/race-guide') || active('/jockeyph-guide') ? 'is-active' : ''} aria-current={active('/race-guide') ? 'page' : undefined} href="/race-guide" onClick={close}>Learn How to Race</Link>
      <Link className={active('/results') ? 'is-active' : ''} aria-current={active('/results') ? 'page' : undefined} href="/results" onClick={close}>Results</Link>
      <Link className={active('/subscribe') ? 'is-active' : ''} href="/subscribe" onClick={close}>Membership</Link>
      <Link className={active('/about') ? 'is-active' : ''} aria-current={active('/about') ? 'page' : undefined} href="/about" onClick={close}>About Us</Link>
      <Link className={active('/contact') ? 'is-active' : ''} aria-current={active('/contact') ? 'page' : undefined} href="/contact" onClick={close}>Contact Us</Link>
      {account ? <div className="site-dropdown site-account" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setAccountOpen(false); }}><button ref={accountButton} type="button" aria-expanded={accountOpen} aria-controls="jockey-account-links" onClick={() => { setAccountOpen(!accountOpen); setStatsOpen(false); }}>Account <ChevronDown size={14} /></button><div className="site-dropdown-panel" id="jockey-account-links" hidden={!accountOpen}><span className="site-account-name">Hello, {account}</span><Link href="/profile" onClick={close}>My profile</Link><Link href="/favorites" onClick={close}>Favorites</Link><Link href="/subscribe" onClick={close}>My membership</Link><Link href="/settings" onClick={close}>Settings</Link></div></div> : <Link className="site-sign-in" href="/login" onClick={close}>Sign in</Link>}
    </nav>
  </header>;
}
