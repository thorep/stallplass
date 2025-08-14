import { Metadata } from 'next';
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/24/outline';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';

export const metadata: Metadata = {
  title: 'Annonsering på Stallplass - Få flere kunder',
  description: 'Markedsfør din stall eller tjeneste til tusenvis av hestefolk. Velg mellom tre annonseringsnivåer og nå målgruppen din effektivt.',
  openGraph: {
    title: 'Annonsering på Stallplass - Få flere kunder',
    description: 'Markedsfør din stall eller tjeneste til tusenvis av hestefolk. Velg mellom tre annonseringsnivåer og nå målgruppen din effektivt.',
  },
};

const advertisingPlan = {
  name: 'Synlighet i søkeresultater',
  price: '1 499',
  description: 'Din annonse vises tilfeldig blant søkeresultatene og når tusenvis av potensielle kunder',
  features: [
    'Synlighet blant søkeresultater',
    'Tusenvis av potensielle kunder',
    'Profesjonell annonseutforming',
    'Klikkbar annonse med ditt innhold',
    'Månedlig rapportering av klikk',
    'Faktureres månedlig på forhånd',
    'Kan avsluttes med 1 måneds varsel',
  ],
};

export default function AnnonseringPage() {
  return (
    <>
      <Header />
      <div className="bg-white">

      {/* Pricing plan */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 sm:text-5xl">
            Annonser på Stallplass
          </h1>
          <p className="text-lg text-gray-600">
            Klikkbare annonser som vises blant søkeresultatene
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl p-8 bg-gradient-to-b from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {advertisingPlan.name}
              </h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  {advertisingPlan.price}
                </span>
                <span className="text-gray-600"> kr/måned</span>
              </div>
              <p className="text-gray-700">{advertisingPlan.description}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {advertisingPlan.features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Requirements section */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Krav til annonse-materiell
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  📸 Bildeformat
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Aspect ratio: 4:3 (f.eks. 800x600, 1200x900)</li>
                  <li>• Minimum størrelse: 800x600 piksler</li>
                  <li>• Format: JPG eller PNG</li>
                  <li>• Maksimal filstørrelse: 5 MB</li>
                  <li>• God kvalitet og skarpt bilde</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  ✏️ Tekst og innhold
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Overskrift (maks 50 tegn)</li>
                  <li>• Kort beskrivelse (maks 150 tegn)</li>
                  <li>• Nettside/lenke annonsen skal peke til</li>
                  <li>• Kontaktinformasjon for faktura</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                Vi forbeholder oss retten til å avslå annonser som ikke passer våre retningslinjer.
              </p>
            </div>
          </div>
        </div>

        {/* Contact section */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-lg text-gray-700 mb-4">
              Har du spørsmål eller vil du komme i gang? Send oss en e-post med ditt annonse-materiell.
            </p>
            
            <p className="text-xl text-gray-900">
              <a 
                href="mailto:hei@stallplass.no?subject=Annonsering på Stallplass - Forespørsel"
                className="text-green-600 hover:text-green-700 underline"
              >
                hei@stallplass.no
              </a>
            </p>
          </div>
        </div>


      </div>
      </div>
      <Footer />
    </>
  );
}