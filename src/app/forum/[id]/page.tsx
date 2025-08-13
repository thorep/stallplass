import { getUser } from '@/lib/server-auth';
import { ThreadView } from './ThreadView';
import { notFound } from 'next/navigation';
import { getThreadById } from '@/services/forum/forum-service';

interface ThreadPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ThreadPageProps) {
  const { id } = await params;
  
  try {
    const thread = await getThreadById(id);
    
    if (!thread) {
      return {
        title: 'Tråd ikke funnet - Stallplass Forum',
        description: 'Diskuter hester, stell og riding med andre hesteeiere.',
      };
    }

    // Create a clean description from content (remove HTML tags and limit length)
    const cleanContent = thread.content
      ?.replace(/<[^>]*>/g, '') // Remove HTML tags
      ?.replace(/\s+/g, ' ') // Normalize whitespace
      ?.trim()
      ?.substring(0, 160) || 'Diskuter hester, stell og riding med andre hesteeiere.';

    const authorName = thread.author.nickname || 
      `${thread.author.firstname || ''} ${thread.author.lastname || ''}`.trim() ||
      'Anonym bruker';

    return {
      title: `${thread.title} - Stallplass Forum`,
      description: cleanContent.length > 157 ? cleanContent + '...' : cleanContent,
      openGraph: {
        title: thread.title,
        description: cleanContent,
        type: 'article',
        publishedTime: thread.createdAt.toISOString(),
        authors: [authorName],
        section: thread.category?.name || 'Forum',
      },
      twitter: {
        card: 'summary',
        title: thread.title,
        description: cleanContent,
      },
    };
  } catch (error) {
    console.error('Failed to fetch thread for metadata:', error);
    return {
      title: 'Tråd - Stallplass Forum',
      description: 'Diskuter hester, stell og riding med andre hesteeiere.',
    };
  }
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { id } = await params;
  const user = await getUser();
  
  // Validate thread ID format
  if (!id || typeof id !== 'string') {
    notFound();
  }
  
  return <ThreadView threadId={id} user={user} />;
}