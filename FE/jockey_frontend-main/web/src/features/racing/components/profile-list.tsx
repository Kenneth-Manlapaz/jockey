import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

type ProfileItem = { id: number; name: string; href: string; detail?: string };

export function ProfileList({ items, label, compact = false, previewCount = items.length }: { items: ProfileItem[]; label: string; compact?: boolean; previewCount?: number }) {
  const renderList = (rows: ProfileItem[], listLabel: string) => <ul className={`racing-profile-list${compact ? ' compact' : ''}`} aria-label={listLabel}>
    {rows.map(item => <li key={item.id}>
      <Link href={item.href} className="racing-profile-link">
        <span className="racing-profile-initials" aria-hidden="true">{item.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('')}</span>
        <span className="racing-profile-name"><strong>{item.name}</strong>{item.detail && <small>{item.detail}</small>}</span>
        <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </li>)}
  </ul>;
  return <>{renderList(items.slice(0, previewCount), label)}{items.length > previewCount && <details className="participant-more"><summary>View {items.length - previewCount} more</summary>{renderList(items.slice(previewCount), `${label} continued`)}</details>}</>;
}
