import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import { CheckIcon } from '@heroicons/react/24/outline';
import { SparklesIcon, BuildingOfficeIcon, StarIcon } from '@heroicons/react/24/solid';
import Button from '@/components/atoms/Button';
import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    {
      name: 'Liten stall',
      price: 49,
      boxRange: '1-10',
      description: 'Perfekt for mindre staller',
      features: [
        'Ubegrenset visninger',
        'Kontaktinformasjon til interesserte',
        'E-post og telefonstøtte',
        'Mobiloptimalisert',
        'Avansert statistikk',
        'Tilpasset profil',
        'Dashboard for administrasjon'
      ],
      popular: false,
      icon: BuildingOfficeIcon,
      color: 'emerald'
    },
    {
      name: 'Medium stall',
      price: 199,
      boxRange: '11-20',
      description: 'For medium store staller',
      features: [
        'Ubegrenset visninger',
        'Kontaktinformasjon til interesserte',
        'E-post og telefonstøtte',
        'Mobiloptimalisert',
        'Avansert statistikk',
        'Tilpasset profil',
        'Dashboard for administrasjon'
      ],
      popular: true,
      icon: SparklesIcon,
      color: 'indigo'
    },
    {
      name: 'Stor stall',
      price: 299,
      boxRange: '21-30',
      description: 'For store staller',
      features: [
        'Ubegrenset visninger',
        'Kontaktinformasjon til interesserte',
        'E-post og telefonstøtte',
        'Mobiloptimalisert',
        'Avansert statistikk',
        'Tilpasset profil',
        'Dashboard for administrasjon'
      ],
      popular: false,
      icon: BuildingOfficeIcon,
      color: 'amber'
    },
    {
      name: 'Giga stall',
      price: 349,
      boxRange: '30+',
      description: 'For største staller',
      features: [
        'Ubegrenset visninger',
        'Kontaktinformasjon til interesserte',
        'E-post og telefonstøtte',
        'Mobiloptimalisert',
        'Avansert statistikk',
        'Tilpasset profil',
        'Dashboard for administrasjon'
      ],
      popular: false,
      icon: StarIcon,
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-20">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Enkle og forutsigbare priser
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Velg den planen som passer din stalls størrelse. 
              Prisen er basert på totalt antall bokser i din stall.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4 mb-12 sm:mb-20">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl bg-white p-6 sm:p-8 shadow-sm border ${
                    plan.popular 
                      ? 'border-indigo-200 ring-2 ring-indigo-500' 
                      : 'border-gray-200'
                  } hover:shadow-md transition-shadow`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-500 text-white">
                        Mest populær
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center mb-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center mr-4 ${
                      plan.color === 'emerald' ? 'bg-emerald-100' :
                      plan.color === 'indigo' ? 'bg-indigo-100' :
                      plan.color === 'amber' ? 'bg-amber-100' :
                      plan.color === 'purple' ? 'bg-purple-100' :
                      'bg-gray-100'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        plan.color === 'emerald' ? 'text-emerald-600' :
                        plan.color === 'indigo' ? 'text-indigo-600' :
                        plan.color === 'amber' ? 'text-amber-600' :
                        plan.color === 'purple' ? 'text-purple-600' :
                        'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.boxRange} bokser</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                        {plan.price}
                      </span>
                      <span className="text-gray-500 ml-1">kr/mnd</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/registrer" className="block">
                    <Button
                      variant={plan.popular ? 'primary' : 'outline'}
                      className="w-full"
                    >
                      Kom i gang
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12">
              Ofte stilte spørsmål
            </h2>
            
            <div className="space-y-6 sm:space-y-8">
              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Hvordan beregnes prisen?
                </h3>
                <p className="text-gray-600">
                  Prisen er basert på det totale antallet bokser i din stall, ikke hvor mange du har leid ut. 
                  Har du 15 bokser totalt, betaler du for Medium stall-planen selv om du kun har 4 bokser leid ut.
                  Alle planer har samme funksjoner - prisen varierer kun basert på stallens størrelse.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Kan jeg endre plan senere?
                </h3>
                <p className="text-gray-600">
                  Ja, du kan oppgradere eller nedgradere planen din når som helst. 
                  Endringer trer i kraft ved neste faktureringsperiode.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Hva skjer hvis jeg får flere bokser?
                </h3>
                <p className="text-gray-600">
                  Når du legger til flere bokser og overstiger din nåværende plans grense, 
                  vil du automatisk bli oppgradert til neste plan ved neste faktureringsperiode.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Hvorfor betaler større staller mer?
                </h3>
                <p className="text-gray-600">
                  Vi ønsker å støtte mindre staller ved å holde prisen lav for dem. 
                  Større staller kan betale mer og bidrar til å subsidiere kostnadene for mindre staller.
                  Alle får samme funksjoner, men prisen er skalert etter stallens størrelse.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Er det noen bindingstid?
                </h3>
                <p className="text-gray-600">
                  Nei, det er ingen bindingstid. Du kan si opp abonnementet ditt når som helst. 
                  Tjenesten fortsetter til slutten av din nåværende faktureringsperiode.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl p-8 sm:p-12 text-center mt-12 sm:mt-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Klar til å komme i gang?
            </h2>
            <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
              Registrer din stall i dag og begynn å nå flere hesteeiere. 
              Få full tilgang til alle funksjoner med din valgte plan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/registrer">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Registrer deg gratis
                </Button>
              </Link>
              <Link href="/staller">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Se eksempler
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}