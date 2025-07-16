import Link from 'next/link';
import Button from '@/components/atoms/Button';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Stallplass
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              Hjem
            </Link>
            <Link href="/staller" className="text-gray-700 hover:text-blue-600">
              Finn stall
            </Link>
            <Link href="/om-oss" className="text-gray-700 hover:text-blue-600">
              Om oss
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              Logg inn
            </Button>
            <Button variant="primary" size="sm">
              Legg ut stall
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}