import { ForumMain } from './ForumMain';

export const metadata = {
  title: 'Forum - Stallplass',
  description: 'Diskuter alt om hester, stell og riding med andre hesteeiere på Stallplass forum.',
};

export default async function ForumPage() {
  return <ForumMain />;
}