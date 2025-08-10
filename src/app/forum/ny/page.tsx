import { requireAuth } from '@/lib/server-auth';
import { NewThreadPage } from './NewThreadPage';

export const metadata = {
  title: 'Ny tråd - Stallplass Forum',
  description: 'Opprett en ny diskusjonstråd i Stallplass forum.',
};

export default async function NewThread() {
  const user = await requireAuth('/forum/ny');
  
  return <NewThreadPage user={user} />;
}