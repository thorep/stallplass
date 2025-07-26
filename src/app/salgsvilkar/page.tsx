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
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Virkeområde</h2>
              <p className="text-gray-700 mb-3">
                Disse salgsvilkårene gjelder for kjøp av annonseringstjenester på Stallplass.no. 
                Vilkårene gjelder i tillegg til bestemmelser i forbrukerkjøpsloven.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Selger</h2>
              <div className="text-gray-700">
                <p>LYKKEENGLER.NO PRESTBØEN</p>
                <p>Organisasjonsnummer: 926 077 597</p>
                <p>Albatrossveien 28C</p>
                <p>3212 SANDEFJORD</p>
                <p>E-post: hei@stallplass.no</p>
              </div>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Priser</h2>
              <p className="text-gray-700 mb-3">
                Priser er oppgitt i norske kroner inkludert merverdiavgift. Totalpris fremkommer ved bestilling.
              </p>
              <p className="text-gray-700 mb-3">
                Prisen beregnes etter antall stallplasser som skal annonseres, uavhengig av om de er utleid eller ledige.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Avtaleinngåelse</h2>
              <p className="text-gray-700 mb-3">
                Avtale inngås når kjøper har fullført bestilling via Vipps og mottatt bekreftelse.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Betaling</h2>
              <p className="text-gray-700 mb-3">
                Betaling skjer via Vipps. Tjenesten aktiveres umiddelbart etter bekreftet betaling.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Leveranse</h2>
              <p className="text-gray-700 mb-3">
                Annonseringstjenesten leveres digitalt og aktiveres innen 24 timer etter bekreftet betaling.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Tjenestens innhold</h2>
              <p className="text-gray-700 mb-3">
                Stallplass.no tilbyr en digital plattform for annonsering av stallplasser og hestrelaterte tjenester. 
                Tjenesten omfatter:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-3 ml-4">
                <li>Visning av annonser på plattformen</li>
                <li>Kontaktformidling mellom parter</li>
                <li>Administrasjonsverktøy for annonser</li>
              </ul>
              <p className="text-gray-700 mb-3">
                Stallplass.no er utelukkende en annonse- og formidlingsplattform. Selger er ikke part i, 
                og har intet ansvar for, avtaler som inngås mellom brukere av plattformen.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Ansvarsfraskrivelse</h2>
              <p className="text-gray-700 mb-3">
                Stallplass.no er ikke ansvarlig for tjenester eller stallplasser som annonseres gjennom plattformen. 
                Selger formidler kun kontakt mellom parter og tar ikke betaling på vegne av tjenesteleverandører 
                eller stalleierer.
              </p>
              <p className="text-gray-700 mb-3">
                Alle avtaler, betalinger og forhold mellom brukere håndteres direkte mellom partene. 
                Stallplass.no vil aldri be om betaling til tjenesteleverandører.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Angrerett</h2>
              <p className="text-gray-700 mb-3">
                Du har 14 dagers angrerett fra avtale inngås, jf. angrerettloven. Angreretten gjelder ikke for 
                tjenester som er fullført eller tatt i bruk.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Personopplysninger</h2>
              <p className="text-gray-700 mb-3">
                Behandling av personopplysninger skjer i henhold til personvernloven og GDPR. 
                Se separat personvernerklæring for detaljer.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Reklamasjon og tvister</h2>
              <p className="text-gray-700 mb-3">
                Reklamasjon skal rettes til selger uten ugrunnet opphold. Forbrukere kan klage til 
                Forbrukertilsynet eller bruke Forbrukerrådet for megling.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Lovvalg</h2>
              <p className="text-gray-700 mb-3">
                Avtalen er underlagt norsk rett.
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