import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import BoxDetailClient from '@/components/organisms/BoxDetailClient';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import { getBoxWithStable } from '@/services/box-service';

interface BoxPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: BoxPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const box = await getBoxWithStable(id);
    if (!box) {
      return {
        title: 'Boks ikke funnet - Stallplass'
      };
    }

    return {
      title: `${box.name} - ${box.stable?.name || 'Stallboks'} | Stallplass`,
      description: box.description || `Stallboks til leie hos ${box.stable?.name || 'ukjent stall'} i ${box.stable?.location || 'ukjent lokasjon'}`,
      openGraph: {
        title: `${box.name} - ${box.stable?.name || 'Stallboks'}`,
        description: box.description || `Stallboks til leie hos ${box.stable?.name || 'ukjent stall'}`,
        images: box.stable?.images ? [box.stable.images[0]] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata for box:', error);
    return {
      title: 'Stallboks - Stallplass'
    };
  }
}

export default async function BoxPage({ params }: BoxPageProps) {
  const { id } = await params;
  try {
    const box = await getBoxWithStable(id);
    
    if (!box) {
      redirect('/stables');
    }

    return (
      <>
        <Header />
        <BoxDetailClient box={box} />
        <Footer />
      </>
    );
  } catch (error) {
    console.error('Error loading box:', error);
    redirect('/stables');
  }
}