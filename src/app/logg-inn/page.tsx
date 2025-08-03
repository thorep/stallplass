import Link from 'next/link'
import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnUrl?: string }>
}) {
  const params = await searchParams
  const error = params.error
  const returnUrl = params.returnUrl || '/dashboard'
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600">
                Stallplass
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex min-h-screen items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div>
            <h2 className="mt-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Logg inn
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Logg inn på din konto for å administrere stables eller finne boxes
            </p>
            <p className="mt-2 text-center text-sm text-gray-500">
              Har du ikke en konto?{' '}
              <Link href="/registrer" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Registrer deg her
              </Link>
            </p>
          </div>
          
          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
            <input type="hidden" name="returnUrl" value={returnUrl} />
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-postadresse
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  data-cy="email-input"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-base sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Passord
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  data-cy="password-input"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-base sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <button
                formAction={login}
                type="submit"
                data-cy="login-button"
                className="w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Logg inn
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}