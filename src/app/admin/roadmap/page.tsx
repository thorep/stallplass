import { getAllRoadmapItems } from '@/services/roadmap-service';
import { RoadmapAdmin } from '@/components/organisms/RoadmapAdmin';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roadmap Admin | Stallplass',
  description: 'Administrer roadmap funksjoner og planlagte features.',
};


export default async function RoadmapAdminPage() {
  const roadmapItems = await getAllRoadmapItems();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Roadmap Administrasjon
              </h1>
              <p className="text-slate-600">
                Administrer roadmap funksjoner og planlagte features.
              </p>
            </div>
            
            <RoadmapAdmin initialItems={roadmapItems} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}