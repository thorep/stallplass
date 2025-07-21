import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';

export default function PersonvernPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Personvernpolitikk</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Sist oppdatert: {new Date().toLocaleDateString('nb-NO')}
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Innledning</h2>
            <p className="text-gray-600 mb-6">
              Stallplass tar ditt personvern på alvor. Denne personvernpolitikken
              beskriver hvordan vi samler inn, bruker og beskytter dine personopplysninger
              når du bruker vår tjeneste.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Hvilke opplysninger samler vi inn?</h2>
            <ul className="text-gray-600 mb-6 space-y-2">
              <li>• Kontaktinformasjon (navn, e-post, telefonnummer)</li>
              <li>• Informasjon om stables og boxes</li>
              <li>• Kommunikasjon mellom users</li>
              <li>• Teknisk informasjon (IP-adresse, nettlesertype)</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Hvordan bruker vi opplysningene?</h2>
            <p className="text-gray-600 mb-6">
              Vi bruker dine opplysninger til å:
            </p>
            <ul className="text-gray-600 mb-6 space-y-2">
              <li>• Tilby og forbedre vår tjeneste</li>
              <li>• Legge til rette for kontakt mellom users</li>
              <li>• Sende viktige oppdateringer om tjenesten</li>
              <li>• Overholde lovkrav</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Deling av opplysninger</h2>
            <p className="text-gray-600 mb-6">
              Vi deler ikke dine personopplysninger med tredjeparter, bortsett fra
              når det er nødvendig for å levere tjenesten eller når loven krever det.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dine rettigheter</h2>
            <p className="text-gray-600 mb-6">
              Du har rett til å:
            </p>
            <ul className="text-gray-600 mb-6 space-y-2">
              <li>• Be om innsyn i dine opplysninger</li>
              <li>• Rette feil i dine opplysninger</li>
              <li>• Slette dine opplysninger</li>
              <li>• Begrense behandlingen av dine opplysninger</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Kontakt</h2>
            <p className="text-gray-600">
              Har du spørsmål om personvern? Kontakt oss på{' '}
              <a href="mailto:personvern@stallplass.no" className="text-primary hover:underline">
                personvern@stallplass.no
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}