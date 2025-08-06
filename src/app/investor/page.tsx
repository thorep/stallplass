import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';

export default function InvestorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Investor</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Stallplass.no har som mål å bli Norges ledende markedsplass for stallplasser og hestebaserte tjenester. Vi bygger en robust plattform som kobler sammen hesteiere og stalleiere i hele Norge.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Forretningsmodell</h2>
            <p className="text-gray-600 mb-6">
              Vår inntektsmodell baserer seg på abonnement og annonseringsavgifter fra stalleiere og tjenesteleverandører. Vi tilbyr skalerbare løsninger som vokser med kundenes behov, fra enkle annonser til omfattende markedsføringspakker.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Markedsmulighet</h2>
            <p className="text-gray-600 mb-6">
              Hestemarkedet i Norge er stort og voksende, med over 100 000 hester og tusenvis av staller over hele landet. Vi ser en økende digitalisering av denne bransjen, og Stallplass.no er posisjonert for å lede denne utviklingen.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Vekststrategi</h2>
            <p className="text-gray-600 mb-6">
              Vi fokuserer på organisk vekst gjennom forbedret brukeropplevelse, utvidet tjenestetilbud og strategiske partnerskap. Målet er å bli den foretrukne plattformen for alle hestebaserte transaksjoner i Norge.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Selskapsinfo</h2>
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <p className="text-gray-700 mb-2"><strong>Selskap:</strong> Stallplass AS</p>
              <p className="text-gray-700 mb-2"><strong>Organisasjonsnummer:</strong> 926 077 597</p>
              <p className="text-gray-700 mb-2"><strong>Adresse:</strong> Albatrossveien 28C, 3212 Sandefjord</p>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Kontakt for investorer</h2>
            <p className="text-gray-600">
              Ønsker du å investere i Stallplass.no? Send en e-post til{' '}
              <a href="mailto:hei@stallplass.no" className="text-primary hover:underline">
                hei@stallplass.no
              </a>{' '}
              for mer informasjon om investeringsmuligheter.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}