'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase-auth-context';
import Button from '@/components/atoms/Button';
import Header from '@/components/organisms/Header';

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(formData.email, formData.password);
      router.push('/dashboard');
    } catch (err: unknown) {
      let errorMessage = 'Feil ved innlogging. Prøv igjen.';
      
      if (err && typeof err === 'object' && 'message' in err) {
        const supabaseErr = err as { message: string };
        const message = supabaseErr.message.toLowerCase();
        
        if (message.includes('email not confirmed')) {
          errorMessage = 'E-postadressen er ikke bekreftet. Sjekk innboksen din.';
        } else if (message.includes('invalid credentials') || message.includes('invalid login')) {
          errorMessage = 'Ugyldig e-postadresse eller passord.';
        } else if (message.includes('too many requests')) {
          errorMessage = 'For mange forsøk. Prøv igjen senere.';
        } else if (message.includes('invalid email')) {
          errorMessage = 'Ugyldig e-postadresse.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-500">Laster...</div>
        </div>
      </div>
    );
  }

  // Don't render form if user is already authenticated (prevents flash)
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-500">Omdirigerer...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex min-h-screen items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div>
            <h2 className="mt-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Logg inn
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Logg inn på din konto for å administrere staller eller finne stallplasser
            </p>
            <p className="mt-2 text-center text-sm text-gray-500">
              Har du ikke en konto?{' '}
              <Link href="/registrer" className="font-medium text-primary hover:text-primary-hover transition-colors">
                Registrer deg her
              </Link>
            </p>
          </div>
          
          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-postadresse
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 placeholder-gray-500 shadow-sm focus:border-primary focus:outline-none focus:ring-primary text-base sm:text-sm"
                  value={formData.email}
                  onChange={handleChange}
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
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 placeholder-gray-500 shadow-sm focus:border-primary focus:outline-none focus:ring-primary text-base sm:text-sm"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && (
              <div className="text-error text-sm text-center">{error}</div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full py-3 sm:py-2"
                disabled={isLoading}
              >
                {isLoading ? 'Logger inn...' : 'Logg inn'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}