import { Metadata } from "next";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";
import HorseBuyDetailClient from "@/components/organisms/HorseBuyDetailClient";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/horse-buys/${params.id}`, { cache: 'no-store' });
    if (!res.ok) return { title: 'Ønskes kjøpt' };
    const { data } = await res.json();
    return { title: data?.name ? `${data.name} – Ønskes kjøpt` : 'Ønskes kjøpt' };
  } catch {
    return { title: 'Ønskes kjøpt' };
  }
}

export default async function Page({ params }: Params) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/horse-buys/${params.id}`, { cache: 'no-store' });
  if (!res.ok) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-8">Kunne ikke laste ønskes kjøpt.</div>
        <Footer />
      </div>
    );
  }
  const { data } = await res.json();
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        <HorseBuyDetailClient horseBuy={data} />
      </div>
      <Footer />
    </div>
  );
}
