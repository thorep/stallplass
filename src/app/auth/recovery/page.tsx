"use client";

import Link from "next/link";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";
import { resetPassword } from "./actions";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PasswordRecoveryContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 160px)' }}>
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div>
            <h2 className="mt-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Tilbakestill passord
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Skriv inn ditt nye passord nedenfor.
            </p>
          </div>

          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nytt passord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-base sm:text-sm"
                placeholder="Minst 6 tegn"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Bekreft nytt passord
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-base sm:text-sm"
                placeholder="Skriv inn passordet på nytt"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {decodeURIComponent(error)}
              </div>
            )}

            <div>
              <button
                formAction={resetPassword}
                type="submit"
                className="w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5B4B8A] hover:bg-[#47396A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B39DDB] transition-colors"
              >
                Oppdater passord
              </button>
            </div>
          </form>

          <div className="text-center">
            <Link
              href="/logg-inn"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Tilbake til innlogging
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default function PasswordRecoveryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PasswordRecoveryContent />
    </Suspense>
  );
}
