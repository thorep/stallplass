import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import { FeedbackLink } from '@/components/ui/feedback-link';

export default function OmOssPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Om oss</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Hei! Jeg heter Thor, og jeg er personen bak Stallplass.no. Jeg driver og utvikler hele denne plattformen på egenhånd – fra koding til design, drift og kundeservice.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Målet mitt</h2>
            <p className="text-gray-600 mb-6">
              Visjonen min er enkel: å samle alle hesterelaterte ting på én plass. Jeg ønsker at Stallplass.no skal bli det stedet du går til, enten du leter etter stallplass, trenger veterinærtjenester, skal kjøpe utstyr, eller bare vil diskutere hest med andre. Alt skal være tilgjengelig her.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Jeg jobber alene</h2>
            <p className="text-gray-600 mb-6">
              Som enedriver av dette prosjektet står jeg for all utvikling, vedlikehold og forbedringer selv. Det betyr at jeg er helt avhengig av tilbakemeldinger fra dere brukere for å vite hva som fungerer bra og hva som kan bli bedre. Alle innspill er uvurderlige for meg!
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dine tilbakemeldinger betyr alt</h2>
            <p className="text-gray-600 mb-6">
              Siden jeg jobber alene, er jeg helt avhengig av å høre fra dere. Har du ideer til nye funksjoner? Oppdaget en feil? Savner du noe? Hopp gjerne inn på forumet og del tankene dine – det er der jeg får de beste ideene til hvordan plattformen kan utvikles videre.
            </p>
            
            <div className="bg-blue-50 p-6 rounded-lg mb-6">
              <p className="text-blue-800 mb-4 font-medium">
                💬 Gi meg tilbakemelding i forumet!
              </p>
              <p className="text-blue-700 mb-4">
                Det beste stedet å dele ideer, feil og ønsker er i vårt forum. Der kan vi diskutere sammen og andre brukere kan også komme med innspill.
              </p>
              <div className="text-center">
                <FeedbackLink className="text-blue-600 font-medium" />
              </div>
            </div>
            
            <div className="bg-yellow-50 p-6 rounded-lg mb-6">
              <p className="text-yellow-800 mb-4 font-medium">
                ☕ Liker du det jeg gjør?
              </p>
              <p className="text-yellow-700 mb-4">
                Siden jeg utvikler og driver Stallplass.no på egenhånd i fritiden, setter jeg stor pris på all støtte! Hvis du vil støtte prosjektet og kanskje kjøpe meg en kaffe, kan du gjøre det her:
              </p>
              <div className="text-center">
                <a 
                  href="https://www.buymeacoffee.com/thorp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block transition-transform hover:scale-105"
                >
                  <img 
                    src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
                    alt="Støtt Stallplass med en kaffe" 
                    className="h-12 w-auto"
                  />
                </a>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Kontakt</h2>
            <p className="text-gray-600">
              Du kan også sende meg en direkte e-post på{' '}
              <a href="mailto:hei@stallplass.no" className="text-primary hover:underline">
                hei@stallplass.no
              </a>{' '}
              hvis du har spørsmål eller tilbakemeldinger som ikke passer i forumet.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}