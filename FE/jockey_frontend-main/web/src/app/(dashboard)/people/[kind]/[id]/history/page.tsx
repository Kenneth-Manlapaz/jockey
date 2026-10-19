import { HistoryBrowser } from '@web/features/racing/components/exploration';
import { type Query } from '@web/lib/racing';
export default async function Page({ params, searchParams }: { params: Promise<{ kind: string; id: string }>; searchParams: Promise<Query> }) {
  const { kind, id } = await params;
  return <HistoryBrowser endpoint={`people/${encodeURIComponent(kind)}/${encodeURIComponent(id)}/history/`} back={`/people/${kind}/${id}`} title="Participant racing history" query={await searchParams} />;
}
