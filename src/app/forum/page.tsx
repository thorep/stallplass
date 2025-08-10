import { requireAuth } from '@/lib/server-auth';
import { ForumMain } from './ForumMain';

export const metadata = {
  title: 'Forum - Stallplass',
  description: 'Diskuter alt om hester, stell og riding med andre hesteeiere på Stallplass forum.',
};

export default async function ForumPage() {
  const user = await requireAuth('/forum');
  
  return <ForumMain user={user} />;
}