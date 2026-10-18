'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flag, Home, Medal, BookOpen, User } from 'lucide-react';

const tabs = [
  { href: '/dashboard', label: 'Home', Icon: Home },
  { href: '/races', label: 'Races', Icon: Flag },
  { href: '/race-guide', label: 'Guide', Icon: BookOpen },
  { href: '/results', label: 'Results', Icon: Medal },
  { href: '/profile', label: 'Profile', Icon: User },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const tabScreens = ['/dashboard', '/races', '/race-guide', '/results', '/profile'];
  if (pathname !== '/' && !tabScreens.includes(pathname)) return null;
  return (
    <nav className={`mobile-tab-bar${pathname === '/dashboard' ? ' dashboard-tab-bar' : ''}`} aria-label="Main navigation">
      {tabs.map(({ href, label, Icon }) => {
        const selected = pathname === href || (href === '/dashboard' && pathname === '/') || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={selected ? 'page' : undefined}
            className={selected ? 'active' : undefined}
          >
            <span className="tab-icon-wrap">{selected && <i aria-hidden="true" />}<Icon size={20} strokeWidth={selected ? 2.4 : 2} /></span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
