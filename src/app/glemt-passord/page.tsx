import Link from "next/link";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";
import { requestPasswordReset } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const success = params.success;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 160px)' }}>
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div>
            <h2 className="mt-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Glemt passordet?
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Skriv inn e-postadressen din, så sender vi deg en lenke for å tilbakestille passordet ditt.
            </p>
          </div>

          {success ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    E-post sendt!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Vi har sendt deg en e-post med instruksjoner for å tilbakestille passordet ditt. 
                      Sjekk innboksen din og følg lenken i e-posten.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-postadresse
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-base sm:text-sm"
                  placeholder="din@epost.no"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <button
                  formAction={requestPasswordReset}
                  type="submit"
                  className="w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5B4B8A] hover:bg-[#47396A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B39DDB] transition-colors"
                >
                  Send tilbakestillings-e-post
                </button>
              </div>
            </form>
          )}

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
