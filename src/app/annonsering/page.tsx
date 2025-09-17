import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bedriftsreklame i søkeresultater – Stallplass",
  description:
    "Bedrifter kan kjøpe synlighet direkte i søkeresultatene på Stallplass. Opprettelse av vanlige annonser (stall, boks, tjenester, hest) er gratis.",
  openGraph: {
    title: "Bedriftsreklame i søkeresultater – Stallplass",
    description:
      "Bedrifter kan kjøpe synlighet direkte i søkeresultatene på Stallplass. Opprettelse av vanlige annonser (stall, boks, tjenester, hest) er gratis.",
  },
};

const advertisingPlan = {
  name: "Bedriftsreklame i søkeresultater",
  price: "2 499",
  description:
    "Reklamen din vises på tvers av søkeresultatene på Stallplass – designet for høy synlighet – slik at du når relevante hestekjøpere og stallinteresserte hver måned.",
  features: [
    "Synlighet direkte i søkeresultater",
    "Relevant trafikk uten avhengighet av klikkmålinger",
    "Målrettet merkevarebygging mot hesteeiere",
    "Faktureres for 6 måneder av gangen",
    "1 måneds oppsigelsestid før ny periode",
  ],
};

export default function AnnonseringPage() {
  return (
    <>
      <Header />
      <div className="bg-white">
        {/* Pricing plan */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 sm:text-5xl">
              Bedriftsreklame i søkeresultater – nå hesteeiere direkte
            </h1>
            <div className="mt-3 max-w-3xl mx-auto">
              <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                <p className="font-medium">Viktig avklaring</p>
                <p>
                  Å opprette vanlige annonser på Stallplass (stall, boks, tjenester, hest til salgs/ønskes kjøpt) er gratis. Denne siden gjelder kun betalt bedriftsreklame som vises tydelig i søkeresultatene.
                </p>
              </div>
            </div>
            <p className="mt-6 text-lg text-gray-600">
              Stallplass er Norges største markedsplass for stallplasser og hestetjenester. Med fast månedspris får din bedrift synlighet direkte i søkeresultatene – uten å være avhengig av klikk.
            </p>
            <div className="mt-4">
              <span className="inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-800 border border-violet-200">
                100–400 daglige besøkende
              </span>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl p-8 bg-gradient-to-b from-violet-50 to-purple-50 border-2 border-violet-200 shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{advertisingPlan.name}</h3>
                <div className="mb-4 flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-violet-700">{advertisingPlan.price}</span>
                  <span className="text-violet-700">kr/måned</span>
                </div>
                <p className="text-gray-700">{advertisingPlan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {advertisingPlan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="text-center">
                <a
                  href="mailto:hei@stallplass.no?subject=Bedriftsreklame%20i%20s%C3%B8keresultater%20%E2%80%93%20Foresp%C3%B8rsel"
                  className="inline-flex items-center justify-center rounded-md bg-violet-600 px-5 py-3 text-white font-medium shadow hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  Kontakt oss for bedriftsreklame
                </a>
                <p className="mt-2 text-xs text-gray-600">Bestilling gjøres via e-post</p>
                <p className="mt-1 text-xs text-gray-600">Gjelder bedriftsreklame – ikke ordinære annonser (de er gratis å opprette)</p>
                <div className="mt-4 text-left mx-auto max-w-md rounded-lg border border-violet-200 bg-violet-50 p-3">
                  <p className="text-sm font-medium text-gray-900">Fakturering og oppsigelse</p>
                  <p className="text-sm text-gray-700">
                    Faktureres for 6 måneder av gangen. Oppsigelse må skje senest 1 måned før ny
                    6-måneders periode begynner.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gratis annonsering avklaring + snarveier */}
          <div className="mt-12">
            <div className="max-w-3xl mx-auto bg-green-50 rounded-2xl p-6 border border-green-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gratis å opprette ordinære annonser</h3>
              <p className="text-gray-700 mb-4">
                Det er gratis å opprette vanlige annonser på Stallplass – for stall, bokser, tjenester og hester (til salgs eller ønskes kjøpt). Bedriftsreklamen på denne siden er et tillegg for dem som ønsker ekstra synlighet i søkeresultatene.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href="/dashboard" className="text-green-800 underline hover:text-green-900">Opprett stall/stallplass</a>
                <a href="/dashboard" className="text-green-800 underline hover:text-green-900">Legg ut boks</a>
                <a href="/dashboard" className="text-green-800 underline hover:text-green-900">Registrer tjeneste</a>
                <a href="/hest" className="text-green-800 underline hover:text-green-900">Hest til salgs/ønskes kjøpt</a>
              </div>
            </div>
          </div>

          {/* Additional advertising options */}
          <div className="mt-12 text-center">
            <div className="max-w-2xl mx-auto bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Ytterligere annonseringsmuligheter
              </h3>
              <p className="text-gray-700 mb-4">
                Vi kan også tilby reklame som banner på siden og i forum.
              </p>
              <p className="text-gray-600">
                <a
                  href="mailto:hei@stallplass.no?subject=Forespørsel om banner-annonsering"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Ta kontakt for pris
                </a>
              </p>
            </div>
          </div>

          {/* Requirements section */}
          <div className="mt-16 bg-gray-50 rounded-2xl p-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Krav til annonse-materiell
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📸 Bildeformat</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Aspect ratio: 4:3 (f.eks. 800x600, 1200x900)</li>
                    <li>• Minimum størrelse: 800x600 piksler</li>
                    <li>• Format: JPG eller PNG</li>
                    <li>• Maksimal filstørrelse: 5 MB</li>
                    <li>• God kvalitet og skarpt bilde</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">✏️ Tekst og innhold</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Overskrift (maks 50 tegn)</li>
                    <li>• Kort beskrivelse (maks 150 tegn)</li>
                    <li>• Nettside/lenke annonsen skal peke til</li>
                    <li>• Kontaktinformasjon for faktura</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 text-center text-sm text-gray-600">
                <p>
                  Vi forbeholder oss retten til å avslå annonser som ikke passer våre
                  retningslinjer.
                </p>
              </div>
            </div>
          </div>

          {/* Contact section */}
          <div className="mt-16 text-center">
            <div className="max-w-2xl mx-auto">
              <p className="text-lg text-gray-700 mb-4">
                Har du spørsmål eller vil du komme i gang? Send oss en e-post med ditt
                annonse-materiell.
              </p>

              <p className="text-xl text-gray-900">
                <a
                  href="mailto:hei@stallplass.no?subject=Annonsering på Stallplass - Forespørsel"
                  className="text-violet-700 hover:text-violet-800 underline"
                >
                  hei@stallplass.no
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
