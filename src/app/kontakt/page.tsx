import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';

export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Kontakt oss</h1>
          
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ta kontakt</h2>
            <p className="text-gray-600 mb-8">
              Vi er her for å hjelpe deg med spørsmål om Stallplass. Send oss en e-post så svarer vi så raskt som mulig.
            </p>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Generelle henvendelser</h3>
                <p className="text-gray-600 mb-4">
                  For spørsmål, tilbakemeldinger eller andre henvendelser.
                </p>
                <a 
                  href="mailto:hei@stallplass.no?subject=Henvendelse fra Stallplass.no"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Send e-post til hei@stallplass.no
                </a>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Teknisk support</h3>
                <p className="text-gray-600 mb-4">
                  Har du tekniske problemer eller trenger hjelp med plattformen?
                </p>
                <a 
                  href="mailto:hei@stallplass.no?subject=Teknisk support - Stallplass.no"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Send support-henvendelse
                </a>
              </div>
              
              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Responstid</h3>
                <p className="text-gray-600">
                  Vi svarer normalt innen 24 timer på hverdager. I travle perioder kan det ta opptil 48 timer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}