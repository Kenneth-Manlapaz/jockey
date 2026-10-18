import { redirect } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get('jockey_access')?.value;
  const response = await fetch(`${(process.env.JOCKEY_API_BASE_URL ?? API_BASE_URL).replace(/\/+$/, '')}/results/${encodeURIComponent(id)}/`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if ([401, 403].includes(response.status)) redirect(`/subscribe?next=${encodeURIComponent(`/result/${id}`)}`);
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('Result unavailable.');
  const result = await response.json() as { race: { id: number } };
  redirect(`/race/${result.race.id}#official-result`);
}
