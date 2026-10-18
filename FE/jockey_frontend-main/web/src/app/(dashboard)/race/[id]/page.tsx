import { ProgramPage } from '@web/features/racing/components/program-page';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <ProgramPage id={(await params).id} />; }
