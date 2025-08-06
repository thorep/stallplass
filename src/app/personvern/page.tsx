import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";

export default function PersonvernPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Personvernpolitikk</h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">Sist oppdatert: 5. august 2025</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Innledning</h2>
            <p className="text-gray-600 mb-6">
              Hos Stallplass.no tar vi personvernet ditt på alvor. Denne personvernpolitikken
              forklarer hvilke opplysninger vi samler inn, hvorfor vi gjør det, og hvordan vi
              beskytter dine data. Vi samler kun inn det vi trenger for å levere tjenesten til deg
              på en trygg og god måte.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Hvilke opplysninger samler vi inn?
            </h2>
            <p className="text-gray-600 mb-6">
              Vi samler inn personopplysninger du selv oppgir når du bruker tjenesten, for eksempel:
            </p>
            <ul className="text-gray-600 mb-6 space-y-2">
              <li>• Navn, e-postadresse og telefonnummer</li>
              <li>• Informasjon om staller, stallplasser og tjenester du legger inn</li>
              <li>• Faktureringsinformasjon ved kjøp eller annonsering</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Hvordan bruker vi opplysningene dine?
            </h2>
            <p className="text-gray-600 mb-6">Dine opplysninger brukes kun til formål som:</p>
            <ul className="text-gray-600 mb-6 space-y-2">
              <li>• Å levere og forbedre tjenesten</li>
              <li>• Å legge til rette for kontakt mellom brukere</li>
              <li>• Å håndtere betaling og fakturering</li>
              <li>
                • Å sende deg viktig informasjon om tjenesten (for eksempel ved oppdateringer)
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Deling av opplysninger</h2>
            <p className="text-gray-600 mb-6">
              Vi deler ikke dine personopplysninger med tredjeparter, med mindre det er nødvendig
              for å levere tjenesten (f.eks. betalingstjenester) eller vi er pålagt å gjøre det i
              henhold til gjeldende lovgivning.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dine rettigheter</h2>
            <p className="text-gray-600 mb-6">Du har rett til å:</p>
            <ul className="text-gray-600 mb-6 space-y-2">
              <li>• Få innsyn i hvilke opplysninger vi har lagret om deg</li>
              <li>• Få rettet feil eller ufullstendige opplysninger</li>
              <li>• Be om sletting av dine opplysninger</li>
              <li>• Be om at behandlingen begrenses, der det er aktuelt</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Kontakt</h2>
            <p className="text-gray-600">
              Har du spørsmål om personvern eller ønsker å benytte dine rettigheter? Kontakt oss
              gjerne på{" "}
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
