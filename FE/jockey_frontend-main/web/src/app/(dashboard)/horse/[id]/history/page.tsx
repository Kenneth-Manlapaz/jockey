import { HistoryBrowser } from '@web/features/racing/components/exploration';
import { type Query } from '@web/lib/racing';
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Query> }) {
  const { id } = await params;
  return <HistoryBrowser endpoint={`horses/${encodeURIComponent(id)}/history/`} back={`/horse/${id}`} title="Horse racing history" query={await searchParams} />;
}
