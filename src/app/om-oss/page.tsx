import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';

export default function OmOssPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Om oss</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Stallplass.no er Norges nye markedsplass for stallplasser, tjenester og produkter til hest. Vi kobler sammen hesteiere som leter etter stallplass med stalleiere som har ledige plasser – enkelt, effektivt og trygt.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Vår historie</h2>
            <p className="text-gray-600 mb-6">
              Stallplass.no ble startet med én visjon: å gjøre det enklere å finne og tilby stallplasser i hele Norge. Vi vet at det kan være tidkrevende for hesteiere å finne riktig stallplass – og like utfordrende for stalleiere å nå ut til potensielle kunder. Derfor har vi laget en plattform som samler alt på ett sted.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Vårt oppdrag</h2>
            <p className="text-gray-600 mb-6">
              Vi ønsker å gjøre det så enkelt som mulig å finne akkurat det du trenger. Med smart søk og filtrering kan du raskt finne stallplasser og tjenester i ditt område – tilpasset dine behov. Vi jobber for å skape en brukervennlig og trygg markedsplass der hesteiere og stalleiere enkelt kan møtes og komme i kontakt direkte.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Kontakt oss</h2>
            <p className="text-gray-600">
              Har du spørsmål eller innspill? Send oss gjerne en e-post på{' '}
              <a href="mailto:hei@stallplass.no" className="text-primary hover:underline">
                hei@stallplass.no
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}