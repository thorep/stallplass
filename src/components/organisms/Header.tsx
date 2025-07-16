'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import Button from '@/components/atoms/Button';

export default function Header() {
  const { data: session } = useSession();

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
            {session && (
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
            )}
            <Link href="/om-oss" className="text-gray-700 hover:text-blue-600">
              Om oss
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <span className="text-sm text-gray-700">
                  Hei, {session.user.name}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Logg ut
                </Button>
              </>
            ) : (
              <>
                <Link href="/logg-inn">
                  <Button variant="outline" size="sm">
                    Logg inn
                  </Button>
                </Link>
                <Link href="/registrer">
                  <Button variant="primary" size="sm">
                    Registrer deg
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}