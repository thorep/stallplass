import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Support</h1>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ofte stilte spørsmål</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Hvordan registrerer jeg min stall?
                  </h3>
                  <p className="text-gray-600">
                    Gå til &quot;Legg til ny stall&quot; i hovedmenyen og fyll ut skjemaet med
                    informasjon om din stall. Du trenger å være registrert bruker for å legge ut
                    stables.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Koster det noe å bruke Stallplass?
                  </h3>
                  <p className="text-gray-600">
                    Se vår{" "}
                    <a href="/priser" className="text-primary hover:underline">
                      prisside
                    </a>{" "}
                    for oppdatert informasjon om kostnader.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Hvordan kontakter jeg en stallier?
                  </h3>
                  <p className="text-gray-600">
                    Du kan bruke meldingsfunksjonen på stallsiden for å sende en melding direkte til
                    stallieren. Du kan også ringe eller sende e-post hvis denne informasjonen er
                    tilgjengelig.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Hvordan sletter jeg min bruker?
                  </h3>
                  <p className="text-gray-600">
                    Kontakt oss på support@stallplass.no så hjelper vi deg med å slette din
                    brukerkonto og alle tilknyttede data.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Trenger du mer hjelp?</h2>
              <p className="text-gray-600 mb-4">
                Fant du ikke answer på spørsmålet ditt? Send oss en e-post så hjelper vi deg.
              </p>
              <a
                href="mailto:hei@stallplass.no?subject=Support - Stallplass.no"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Send e-post til support
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
