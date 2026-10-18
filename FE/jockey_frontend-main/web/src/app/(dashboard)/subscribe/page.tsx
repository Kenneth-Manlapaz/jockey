import { SubscriptionFlow } from '@web/features/subscriptions/subscription-flow';
export const metadata = { title: 'Membership | Philippine Jockey' };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  return <SubscriptionFlow destination={typeof q.next === 'string' ? q.next : '/'} initialPlan={typeof q.plan === 'string' ? q.plan : ''} />;
}
