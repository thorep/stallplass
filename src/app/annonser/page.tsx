import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import {
  ArrowTrendingUpIcon,
  CheckIcon,
  MapPinIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import styles from "./annonser.module.css";

export default function AnnonsePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className={styles.heroGradient}>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className={`text-h1 font-bold ${styles.heroText} sm:text-5xl lg:text-6xl`}>
              Har du ledig stallplass eller tilbyr tjenester til hesteeiere?
            </h1>
            <p className={`mx-auto mt-6 max-w-2xl text-xl ${styles.heroSubtext}`}>
              Vi hjelper hesteeiere med å finne det de søker etter. Legg inn din stallplass eller tjeneste så finner de deg.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/dashboard"
                className={styles.primaryButton}
              >
                Legg inn stallplass eller tjeneste
              </a>
              <a
                href="#benefits"
                className={styles.outlineButton}
              >
                Les mer
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div id="benefits" className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-h2 font-bold text-gray-900">Hvorfor bruke Stallplass?</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Vi hjelper hesteeiere med å finne stallplasser og tjenester de trenger
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="text-center">
              <div className="flex justify-center">
                <ArrowTrendingUpIcon className={styles.iconContainer} />
              </div>
              <h3 className="mt-4 text-h3 font-semibold text-gray-900">Hesteeiere finner deg</h3>
              <p className="mt-2 text-body text-gray-600">
                Når noen søker etter stallplass eller tjenester i ditt område, dukker du opp
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="text-center">
              <div className="flex justify-center">
                <UsersIcon className={styles.iconContainer} />
              </div>
              <h3 className="mt-4 text-h3 font-semibold text-gray-900">Folk som faktisk trenger det du har</h3>
              <p className="mt-2 text-body text-gray-600">
                Du får henvendelser fra hesteeiere som faktisk søker det du tilbyr
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="text-center">
              <div className="flex justify-center">
                <MapPinIcon className={styles.iconContainer} />
              </div>
              <h3 className="mt-4 text-h3 font-semibold text-gray-900">Lokalt søk</h3>
              <p className="mt-2 text-body text-gray-600">
                Hesteeiere kan søke etter stall og tjenester i sitt område
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="text-center">
              <div className="flex justify-center">
                <ShieldCheckIcon className={styles.iconContainer} />
              </div>
              <h3 className="mt-4 text-h3 font-semibold text-gray-900">Ryddig og oversiktlig</h3>
              <p className="mt-2 text-body text-gray-600">
                Vi holder plattformen ryddig så det er lett å finne frem
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="text-center">
              <div className="flex justify-center">
                <StarIcon className={styles.iconContainer} />
              </div>
              <h3 className="mt-4 text-h3 font-semibold text-gray-900">Enkelt å bruke</h3>
              <p className="mt-2 text-body text-gray-600">
                Legg inn informasjon om stallplassen eller tjenesten din på få minutter
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="text-center">
              <div className="flex justify-center">
                <CheckIcon className={styles.iconContainer} />
              </div>
              <h3 className="mt-4 text-h3 font-semibold text-gray-900">Enkelt oppsett</h3>
              <p className="mt-2 text-body text-gray-600">
                Bare registrer en stall og en stallplass, så er du i gang
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-h2 font-bold text-gray-900">Slik kommer du i gang</h2>
            <p className="mt-4 text-xl text-gray-600">Tre enkle steg</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className={styles.stepNumber}>
                1
              </div>
              <h3 className="mt-4 text-h3 font-semibold text-gray-900">Lag bruker</h3>
              <p className="mt-2 text-body text-gray-600">
                Registrer deg og legg inn litt informasjon om deg og stallet ditt
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className={styles.stepNumber}>
                2
              </div>
              <h3 className="mt-4 text-h3 font-semibold text-gray-900">Legg inn stallplass eller tjeneste</h3>
              <p className="mt-2 text-body text-gray-600">
                Beskriv hva du tilbyr, legg til bilder og sett pris
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className={styles.stepNumber}>
                3
              </div>
              <h3 className="mt-4 text-h3 font-semibold text-gray-900">Ferdig!</h3>
              <p className="mt-2 text-body text-gray-600">
                Nå vises stallplassen eller tjenesten din når folk søker i området
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* CTA Section */}
      <div className={styles.ctaGradient}>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className={`text-h2 font-bold ${styles.heroText}`}>Har du ledig stallplass eller tilbyr tjenester?</h2>
            <p className={`mt-4 text-xl ${styles.heroSubtext} max-w-2xl mx-auto`}>
              Få stallplassen din eller tjenesten din ut til flere hesteeiere
            </p>
            <div className="mt-8">
              <a
                href="/dashboard"
                className={styles.ctaButton}
              >
                Kom i gang
              </a>
            </div>
            <p className={`mt-4 text-body-sm ${styles.heroSubtext}`}>
              Gratis å registrere seg • Enkelt oppsett
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
