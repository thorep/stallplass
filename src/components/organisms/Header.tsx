'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';

export default function Header() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-gray-0 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-primary">
              Stallplass
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary transition-colors">
              Hjem
            </Link>
            <Link href="/staller" className="text-gray-700 hover:text-primary transition-colors">
              Finn stall
            </Link>
            {session && (
              <Link href="/dashboard" className="text-gray-700 hover:text-primary transition-colors">
                Dashboard
              </Link>
            )}
            <Link href="/om-oss" className="text-gray-700 hover:text-primary transition-colors">
              Om oss
            </Link>
          </nav>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
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

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-0 border-t border-gray-300">
              <Link
                href="/"
                className="block px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Hjem
              </Link>
              <Link
                href="/staller"
                className="block px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Finn stall
              </Link>
              {session && (
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/om-oss"
                className="block px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Om oss
              </Link>
              
              {/* Mobile Auth Section */}
              <div className="pt-4 pb-3 border-t border-gray-300">
                {session ? (
                  <>
                    <div className="px-3 py-2 text-sm text-gray-700">
                      Hei, {session.user.name}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mx-3 mt-2 w-full"
                      onClick={() => {
                        signOut({ callbackUrl: '/' });
                        setMobileMenuOpen(false);
                      }}
                    >
                      Logg ut
                    </Button>
                  </>
                ) : (
                  <div className="px-3 space-y-2">
                    <Link href="/logg-inn" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        Logg inn
                      </Button>
                    </Link>
                    <Link href="/registrer" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="primary" size="sm" className="w-full">
                        Registrer deg
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}