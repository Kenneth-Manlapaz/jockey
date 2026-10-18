import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function BackLink({ href }: { href: string }) {
  return <Link className="app-back-link" href={href}><ArrowLeft size={16} /> Back</Link>;
}
