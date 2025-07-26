import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';

export default function SalgsvilkarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Salgsvilkår</h1>
          
          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Generelle vilkår</h2>
              <p className="text-gray-700 mb-4">
                Disse salgsvilkårene gjelder for alle kjøp av tjenester gjennom Lykkeengler.no Prestbøen sin plattform. 
                Ved å gjennomføre et kjøp aksepterer du disse vilkårene.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Priser og betaling</h2>
              <p className="text-gray-700 mb-4">
                Alle priser er oppgitt i norske kroner (NOK) uten merverdiavgift (MVA). 
                Betaling skjer via Vipps.
              </p>
              <p className="text-gray-700 mb-4">
                Prisene er basert på antall bokser i din stall, ikke antall opptatte bokser. 
                Du betaler for alle bokser du velger å annonsere ut til andre users.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Tjenestebeskrivelse</h2>
              <p className="text-gray-700 mb-4">
                Stallplass tilbyr en plattform for markedsføring av boxes og tjenester. Tjenesten inkluderer:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Opprettelse og vedlikehold av stallprofil eller tjenesteprofil</li>
                <li>Visning av tilgjengelige bokser eller tjenester</li>
                <li>Kommunikasjon med potensielle leietakere eller kunder</li>
                <li>Melding- og kontaktfunksjonalitet</li>
              </ul>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      VIKTIG: Hva vi IKKE tilbyr
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p className="mb-2">
                        <strong>Stallplass er kun en markedsføringsplattform.</strong> Vi administrerer IKKE avtaler mellom utleiere og leietakere, eller mellom tjenesteleverandører og kunder.
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Vi håndterer IKKE pengeoverføringer mellom parter</li>
                        <li>Vi tar IKKE betalt på vegne av stalleierer eller tjenesteleverandører</li>
                        <li>Vi administrerer IKKE leiekontrakter eller serviceavtaler</li>
                        <li>Vi er IKKE ansvarlige for utveksling av penger mellom brukere</li>
                      </ul>
                      <p className="mt-2">
                        <strong>Det eneste stalleierne og tjenesteleverandørene betaler for er synlighet på vår plattform.</strong> 
                        Alle avtaler, betalinger og ansvar mellom brukere håndteres direkte mellom partene selv.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Angrerett</h2>
              <p className="text-gray-700 mb-4">
                I henhold til angrerettloven har du 14 dagers angrerett fra kjøpsdato. 
                Angrerett gjelder ikke for tjenester som allerede er tatt i bruk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Leveranse</h2>
              <p className="text-gray-700 mb-4">
                Tjenesten aktiveres umiddelbart etter bekreftet betaling. 
                Du vil motta en bekreftelse på e-post når tjenesten er aktivert.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Reklamasjon</h2>
              <p className="text-gray-700 mb-4">
                Hvis du opplever problemer med tjenesten, kan du kontakte vår kundeservice. 
                Reklamasjon må meldes uten ugrunnet opphold etter at feilen er oppdaget.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Personvern</h2>
              <p className="text-gray-700 mb-4">
                Vi behandler dine personopplysninger i henhold til gjeldende personvernlovgivning. 
                Se vår personvernerklæring for mer informasjon.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Kontaktinformasjon</h2>
              <div className="text-gray-700">
                <p className="mb-2"><strong>Lykkeengler.no Prestbøen</strong></p>
                <p className="mb-2">E-post: hei@stallplass.no</p>
                <p className="mb-2">Adresse: Albatrossveien 28C, 3212 Sandefjord</p>
                <p className="mb-2">Org.nr: 926077597</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Lovvalg og verneting</h2>
              <p className="text-gray-700 mb-4">
                Norsk lov gjelder for alle kjøp. Eventuelle tvister løses ved norske domstoler.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Endringer</h2>
              <p className="text-gray-700 mb-4">
                Vi forbeholder oss retten til å endre disse vilkårene. Endringer varsles på vår nettside 
                og trer i kraft 30 dager etter publisering.
              </p>
            </section>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Sist oppdatert: {new Date().toLocaleDateString('nb-NO')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}