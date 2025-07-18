import { getAllRoadmapItems } from '@/services/roadmap-service';
import { RoadmapClient } from '@/components/organisms/RoadmapClient';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roadmap | Stallplass',
  description: 'Se hva som kommer i fremtiden for Stallplass - nye funksjoner og forbedringer.',
};


export default async function RoadmapPage() {
  const roadmapItems = await getAllRoadmapItems();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
              Roadmap
            </h1>
            <p className="text-lg text-slate-600">
              Se hva som kommer i fremtiden for Stallplass - nye funksjoner og forbedringer.
            </p>
          </div>
          
          <RoadmapClient initialItems={roadmapItems} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}