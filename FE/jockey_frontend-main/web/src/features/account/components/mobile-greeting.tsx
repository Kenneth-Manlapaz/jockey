'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

export function MobileGreeting({ dateLabel, greetingName }: { dateLabel: string; greetingName: string }) {
  const [name, setName] = useState(greetingName);
  useEffect(() => {
    const stored = localStorage.getItem('pj-web-profile');
    if (stored) {
      const profile = JSON.parse(stored) as { firstName?: string };
      if (profile.firstName) setName(profile.firstName);
    }
  }, []);
  return <section className="mobile-dashboard-header">
    <div className="mobile-greeting-copy"><p className="mobile-date">{dateLabel}</p><h1>Good afternoon,<br /><span>{name}</span></h1></div>
    <div className="mobile-header-actions"><Link href="/notifications" aria-label="Notifications"><Bell size={18} /></Link><Link className="mobile-avatar" href="/profile" aria-label="Open profile">{name.slice(0, 2).toUpperCase()}</Link></div>
  </section>;
}
