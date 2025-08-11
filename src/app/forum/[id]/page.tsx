import { requireAuth } from '@/lib/server-auth';
import { ThreadView } from './ThreadView';
import { notFound } from 'next/navigation';

interface ThreadPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ThreadPageProps) {
  const { id: _id } = await params;
  
  // TODO: Add server-side thread fetch for better SEO
  return {
    title: `Tråd - Stallplass Forum`,
    description: 'Diskuter hester, stell og riding med andre hesteeiere.',
  };
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { id } = await params;
  const user = await requireAuth(`/forum/${id}`);
  
  // Validate thread ID format
  if (!id || typeof id !== 'string') {
    notFound();
  }
  
  return <ThreadView threadId={id} user={user} />;
}