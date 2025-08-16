import PartLoanHorseDetailClient from "@/components/organisms/PartLoanHorseDetailClient";
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import { getUser } from "@/lib/server-auth";
import { Metadata } from "next";

interface PartLoanHorsePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PartLoanHorsePageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    // Fetch part-loan horse data for metadata
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/part-loan-horses/${id}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      return {
        title: "Fôrhest ikke funnet - Stallplass",
      };
    }
    
    const data = await response.json();
    const horse = data.data;
    
    if (!horse) {
      return {
        title: "Fôrhest ikke funnet - Stallplass",
      };
    }

    return {
      title: `${horse.name} - Fôrhest | Stallplass`,
      description: horse.description || `Fôrhest ${horse.name} tilgjengelig for deling`,
      openGraph: {
        title: `${horse.name} - Fôrhest`,
        description: horse.description || `Fôrhest ${horse.name} tilgjengelig for deling`,
        images: horse.images && horse.images.length > 0 ? [horse.images[0]] : [],
      },
    };
  } catch {
    return {
      title: "Fôrhest - Stallplass",
    };
  }
}

export default async function PartLoanHorsePage({ params }: PartLoanHorsePageProps) {
  const { id } = await params;
  const user = await getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <PartLoanHorseDetailClient horseId={id} user={user} />
      </main>
      <Footer />
    </div>
  );
}