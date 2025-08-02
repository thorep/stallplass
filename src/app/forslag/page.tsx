import { Metadata } from 'next';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import SuggestionForm from '@/components/organisms/SuggestionForm';

export const metadata: Metadata = {
  title: 'Forslag - Stallplass',
  description: 'Send inn forslag for å forbedre Stallplass.no',
};

export default function ForslagPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8 sm:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-h1 font-bold text-gray-900 mb-4">
              Send inn forslag
            </h1>
            <p className="text-body-lg text-gray-600">
              Vi ønsker å forbedre Stallplass.no basert på dine tilbakemeldinger. 
              Send inn forslag til nye funksjoner, forbedringer eller rapporter om problemer.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            <SuggestionForm />
          </div>

          <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200/50">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Hva kan du foreslå?
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Nye funksjoner som kan gjøre plattformen bedre</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Forbedringer av eksisterende funksjoner</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Rapporter om tekniske problemer eller feil</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Forslag til bedre brukeropplevelse</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Ideer for markedsføring og vekst</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}