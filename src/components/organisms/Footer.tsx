import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Stallplass</h3>
            <p className="text-gray-400 text-sm">
              Norges største plattform for stallplasser. Vi hjelper hesteiere og stalleiere med å
              finne hverandre.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">For hesteiere</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/sok" className="hover:text-white">
                  Søk etter stall
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">For stalleiere</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/legg-ut" className="hover:text-white">
                  Legg ut stall
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/om-oss" className="hover:text-white">
                  Om oss
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="hover:text-white">
                  Kontakt
                </Link>
              </li>
              <li>
                <Link href="/personvern" className="hover:text-white">
                  Personvern
                </Link>
              </li>
              <li>
                <Link href="/salgsvilkar" className="hover:text-white">
                  Salgsvilkår
                </Link>
              </li>
              <li>
                <Link href="/investor" className="hover:text-white">
                  Investor
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          <div className="mb-4">
            <p>Organisasjonsnummer: 926 077 597</p>
            <p>Forretningsadresse: Albatrossveien 28C, 3212 SANDEFJORD</p>
          </div>
          
          {/* Buy Me A Coffee Support */}
          <div className="mb-6 flex justify-center">
            <a 
              href="https://www.buymeacoffee.com/thorp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-105"
            >
              <img 
                src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
                alt="Støtt Stallplass med en kaffe" 
                className="h-12 w-auto"
              />
            </a>
          </div>
          
          <p>
            &copy; 2025 Stallplass. Alle rettigheter reservert.
            {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA && (
              <span className="ml-2 opacity-60">
                • v{process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)}
              </span>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
