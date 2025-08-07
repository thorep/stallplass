import { HomeIcon, ScaleIcon } from "@heroicons/react/24/outline";

export default function SizeHelpPage() {
  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Størrelsesguide for stallbokser og hester
      </h1>
      
      <p className="text-lg text-slate-600 mb-8">
        Her finner du forklaringer på de forskjellige størrelseskategoriene vi bruker på Stallplass.
      </p>

      {/* Box sizes section */}
      <section id="boks-storrelse" className="mb-12">
        <div className="flex items-center mb-6">
          <HomeIcon className="h-8 w-8 text-indigo-600 mr-3" />
          <h2 className="text-2xl font-bold text-slate-900 m-0">Boksstørrelser</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {/* Small box */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-emerald-600 mb-3">Liten boks</h3>
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                ~9 m²
              </span>
            </div>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• Typisk størrelse: 3m × 3m</li>
              <li>• Passer best for mindre hester</li>
              <li>• Ponnier og unge hester</li>
              <li>• God grunnplass for bevegelse</li>
            </ul>
          </div>

          {/* Medium box */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-blue-600 mb-3">Middels boks</h3>
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                ~12 m²
              </span>
            </div>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• Typisk størrelse: 3,5m × 3,5m</li>
              <li>• Standard størrelse for de fleste hester</li>
              <li>• Passer de fleste ridesport-hester</li>
              <li>• God balanse mellom plass og kostnader</li>
            </ul>
          </div>

          {/* Large box */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-purple-600 mb-3">Stor boks</h3>
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                ~16 m²
              </span>
            </div>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• Typisk størrelse: 4m × 4m eller større</li>
              <li>• Ideell for store hester</li>
              <li>• Kaldblod og travhester</li>
              <li>• Ekstra plass for bevegelse og komfort</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 m-0">
            <strong>Tips:</strong> Størrelsen på boksen påvirker både hestens trivsel og prisen. 
            Velg størrelse basert på din hests behov og ditt budsjett.
          </p>
        </div>
      </section>

      {/* Horse sizes section */}
      <section id="heste-storrelse" className="mb-12">
        <div className="flex items-center mb-6">
          <ScaleIcon className="h-8 w-8 text-indigo-600 mr-3" />
          <h2 className="text-2xl font-bold text-slate-900 m-0">Hestestørrelser</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {/* Small horse */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-emerald-600 mb-3">Liten hest</h3>
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                Under 145 cm
              </span>
            </div>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• Ponnier og små hester</li>
              <li>• Shetlandsponnni, Welsh pony</li>
              <li>• Fjording (de mindre)</li>
              <li>• Ofte brukt til barn og ungdom</li>
            </ul>
          </div>

          {/* Medium horse */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-blue-600 mb-3">Middels hest</h3>
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                145-165 cm
              </span>
            </div>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• De fleste ridesport-hester</li>
              <li>• Norsk sportspony, Haflinger</li>
              <li>• De fleste varmblod (mindre typer)</li>
              <li>• Standard størrelse for riding</li>
            </ul>
          </div>

          {/* Large horse */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-purple-600 mb-3">Stor hest</h3>
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                Over 165 cm
              </span>
            </div>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>• Store varmblod og kaldblod</li>
              <li>• Clydesdale, Shire, Noriker</li>
              <li>• Travhester og store ridesport-hester</li>
              <li>• Krever mer plass og ressurser</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800 m-0">
            <strong>Viktig:</strong> Når du oppgir &ldquo;Hestestørrelse&rdquo; på en stallboks, angir du den maksimale 
            størrelsen på hester som kan passe komfortabelt i boksen. Dette hjelper hesteeiere å finne 
            passende bokser for sine hester.
          </p>
        </div>
      </section>

      {/* Matching section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Hvordan matche boks og hest?</h2>
        
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Anbefalte kombinasjoner:</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• <strong>Liten hest</strong> → Liten eller middels boks</li>
                <li>• <strong>Middels hest</strong> → Middels eller stor boks</li>
                <li>• <strong>Stor hest</strong> → Stor boks (anbefalt)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Viktige faktorer:</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Hestens temperament og aktivitetsnivå</li>
                <li>• Hvor mye tid hesten tilbringer i boksen</li>
                <li>• Ditt budsjett for stallplass</li>
                <li>• Tilgang til utgang/paddock</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact section */}
      <section className="bg-slate-100 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-3">Trenger du mer hjelp?</h2>
        <p className="text-slate-600 mb-4">
          Hvis du har spørsmål om størrelser eller andre ting på Stallplass, kan du alltid kontakte oss.
        </p>
        <a
          href="/kontakt"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Kontakt oss
        </a>
      </section>
    </div>
  );
}