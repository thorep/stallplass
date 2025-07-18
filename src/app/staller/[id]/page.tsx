import { notFound } from 'next/navigation';
import { Stable } from '@/types/stable';
import StableLandingClient from '@/components/organisms/StableLandingClient';
import { getStableById } from '@/services/stable-service';

async function getStable(id: string): Promise<Stable | null> {
  try {
    const stable = await getStableById(id);
    return stable as Stable | null;
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
    title: `${stable.name} - ${stable.location} | Stallplass`,
    description: stable.description.substring(0, 160),
    openGraph: {
      title: `${stable.name} - ${stable.location}`,
      description: stable.description.substring(0, 160),
      images: stable.images.length > 0 ? [stable.images[0]] : [],
    },
  };
}