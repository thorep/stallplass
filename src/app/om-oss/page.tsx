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
              Stallplass er Norges ledende plattform for boxes. Vi kobler sammen
              hesteiere som søker stallplass med stalleiere som har ledige plasser.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Vår historie</h2>
            <p className="text-gray-600 mb-6">
              Stallplass ble grunnlagt med visjon om å forenkle prosessen med å finne
              og tilby boxes i Norge. Vi forstår at det kan være utfordrende
              for hesteiere å finne den rette stallplassen, og for stalleiere å nå
              ut til potensielle kunder.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Vårt oppdrag</h2>
            <p className="text-gray-600 mb-6">
              Vi jobber for å skape en trygg og effektiv markedsplass hvor hesteiere
              og stalleiere kan møtes. Vår plattform gjør det enkelt å søke, sammenligne
              og kontakte stalleiere direkte.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Kontakt oss</h2>
            <p className="text-gray-600">
              Har du spørsmål eller tilbakemeldinger? Send oss en e-post på{' '}
              <a href="mailto:kontakt@stallplass.no" className="text-primary hover:underline">
                kontakt@stallplass.no
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}