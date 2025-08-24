import HorseSaleDetailClient from "@/components/organisms/HorseSaleDetailClient";
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";

interface HorseSalePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: HorseSalePageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    // Fetch horse sale data for metadata
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/horse-sales/${id}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      return {
        title: "Hest til salgs ikke funnet - Stallplass",
      };
    }
    
    const data = await response.json();
    const horseSale = data.data;
    
    if (!horseSale) {
      return {
        title: "Hest til salgs ikke funnet - Stallplass",
      };
    }

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat("nb-NO").format(price);
    };

    return {
      title: `${horseSale.name} - Hest til salgs | Stallplass`,
      description: horseSale.description || `${horseSale.name}, ${horseSale.age} år gammel ${horseSale.breed.name}. Pris: ${formatPrice(horseSale.price)} kr`,
      openGraph: {
        title: `${horseSale.name} - Hest til salgs`,
        description: horseSale.description || `${horseSale.name}, ${horseSale.age} år gammel ${horseSale.breed.name}. Pris: ${formatPrice(horseSale.price)} kr`,
        images: horseSale.images && horseSale.images.length > 0 ? [horseSale.images[0]] : [],
      },
    };
  } catch {
    return {
      title: "Hest til salgs - Stallplass",
    };
  }
}

export default async function HorseSalePage({ params }: HorseSalePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <HorseSaleDetailClient horseSaleId={id} user={user} />
      </main>
      <Footer />
    </div>
  );
}
