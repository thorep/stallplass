import { notFound } from 'next/navigation';
import { StableWithAmenities } from '@/types/stable';
import StableLandingClient from '@/components/organisms/StableLandingClient';
import { getStableById } from '@/services/stable-service';

// Force dynamic rendering to avoid database calls during build
export const dynamic = 'force-dynamic';

async function getStable(id: string): Promise<StableWithAmenities | null> {
  try {
    const stable = await getStableById(id);
    return stable;
  } catch (error) {
    console.error('Error fetching stable:', error);
    return null;
  }
}

interface StablePageProps {
  params: Promise<{ id: string }>;
}

export default async function StablePage({ params }: StablePageProps) {
  const { id } = await params;
  const stable = await getStable(id);
  
  if (!stable) {
    notFound();
  }

  return <StableLandingClient stable={stable} />;
}

export async function generateMetadata({ params }: StablePageProps) {
  const { id } = await params;
  const stable = await getStable(id);
  
  if (!stable) {
    return {
      title: 'Stall ikke funnet - Stallplass',
    };
  }

  return {
    title: `${stable.name} - ${stable.postalPlace || stable.address || ''} | Stallplass`,
    description: stable.description.substring(0, 160),
    openGraph: {
      title: `${stable.name} - ${stable.postalPlace || stable.address || ''}`,
      description: stable.description.substring(0, 160),
      images: stable.images && stable.images.length > 0 ? [stable.images[0]] : [],
    },
  };
}