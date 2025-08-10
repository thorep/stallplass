'use client';

import { trackUserAuth } from "@/lib/analytics";
import { login } from "@/app/logg-inn/actions";

interface LoginFormProps {
  error?: string;
  returnUrl?: string;
}

export default function LoginForm({ error, returnUrl = "/dashboard" }: LoginFormProps) {
  const handleSubmit = async (formData: FormData) => {
    // Track login attempt
    trackUserAuth('login', 'email');
    // Call the server action
    return login(formData);
  };

  return (
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

      {error && <div className="text-red-600 text-sm text-center">{error}</div>}

      <div>
        <button
          formAction={handleSubmit}
          type="submit"
          data-cy="login-button"
          className="w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Logg inn
        </button>
      </div>

      <div className="text-center">
        <a
          href="#"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Glemt passordet?
        </a>
      </div>
    </form>
  );
}