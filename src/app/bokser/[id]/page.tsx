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
      title: `${box.name} - ${box.stable.name} | Stallplass`,
      description: box.description || `Stallboks til leie hos ${box.stable.name} i ${box.stable.location}`,
      openGraph: {
        title: `${box.name} - ${box.stable.name}`,
        description: box.description || `Stallboks til leie hos ${box.stable.name}`,
        images: box.stable.images ? [box.stable.images[0]] : [],
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
      redirect('/staller');
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
    redirect('/staller');
  }
}