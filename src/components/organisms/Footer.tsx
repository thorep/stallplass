import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Stallplass</h3>
            <p className="text-gray-400 text-sm">
              Norges største plattform for boxes. Vi hjelper hesteiere 
              og stalleiere med å finne hverandre.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4">For hesteiere</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/stables" className="hover:text-white">Søk etter stall</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4">For stalleiere</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/legg-ut" className="hover:text-white">Legg ut stall</Link></li>
              <li><Link href="/priser" className="hover:text-white">Priser</Link></li>
              <li><Link href="/support" className="hover:text-white">Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/om-oss" className="hover:text-white">Om oss</Link></li>
              <li><Link href="/kontakt" className="hover:text-white">Kontakt</Link></li>
              <li><Link href="/personvern" className="hover:text-white">Personvern</Link></li>
              <li><Link href="/salgsvilkar" className="hover:text-white">Salgsvilkår</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>&copy; 2024 Stallplass. Alle rettigheter reservert.</p>
        </div>
      </div>
    </footer>
  );
}