import SearchBar from '@/components/molecules/SearchBar';

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Finn den perfekte
            <span className="block text-blue-200">stallplassen</span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-xl text-blue-100">
            Norges største plattform for boxes. Søk blant hundrevis av 
            stables og finn det beste stedet for hesten din.
          </p>
          
          <div className="mt-10 flex justify-center">
            <SearchBar onSearch={onSearch} />
          </div>
          
          <div className="mt-8 flex justify-center space-x-6 text-sm text-blue-100">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Over 500 stables
            </div>
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Trygg betaling
            </div>
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Gratis å bruke
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}