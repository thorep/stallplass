import { getUser } from '@/lib/server-auth';
import { CategoryPage } from './CategoryPage';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  
  // TODO: Add server-side category fetch for better SEO
  return {
    title: `${slug} - Stallplass Forum`,
    description: `Diskuter ${slug} med andre hesteeiere på Stallplass forum.`,
  };
}

export default async function CategoryThreadsPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const user = await getUser();
  
  // Validate slug format
  if (!slug || typeof slug !== 'string') {
    notFound();
  }
  
  return <CategoryPage categorySlug={slug} user={user} />;
}