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
                Stallplass tilbyr en plattform for markedsføring av boxes. Tjenesten inkluderer:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Opprettelse og vedlikehold av stallprofil</li>
                <li>Visning av tilgjengelige bokser</li>
                <li>Kommunikasjon med potensielle leietakere</li>
                <li>Administrasjon av leieforhold</li>
              </ul>
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