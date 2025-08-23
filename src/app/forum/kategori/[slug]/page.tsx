import { getUser } from '@/lib/server-auth';
import { CategoryPage } from './CategoryPage';
import { notFound } from 'next/navigation';
import { getCategoryBySlug } from '@/services/forum/forum-service';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;

  try {
    const category = await getCategoryBySlug(slug);
    if (!category) {
      return {
        title: 'Kategori ikke funnet - Stallplass Forum',
        description: 'Diskuter hest, stell og ridning på Stallplass forum.',
      };
    }

    const title = `${category.name} - Stallplass Forum`;
    const description = category.description
      ? category.description
      : `Diskuter ${category.name.toLowerCase()} med andre hesteeiere på Stallplass forum.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
    };
  } catch {
    return {
      title: `${slug} - Stallplass Forum`,
      description: `Diskuter ${slug} med andre hesteeiere på Stallplass forum.`,
    };
  }
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
