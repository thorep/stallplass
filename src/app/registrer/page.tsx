'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase-auth-context';
import Button from '@/components/atoms/Button';
import Header from '@/components/organisms/Header';
import { SparklesIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function SignupPage() {
  const { signUp, user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: ''
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passordene må være like');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Passordet må være minst 6 tegn');
      setIsLoading(false);
      return;
    }

    try {
      await signUp(formData.email, formData.password, formData.nickname);
      router.push('/dashboard');
    } catch (err: unknown) {
      let errorMessage = 'Feil ved registrering. Prøv igjen.';
      
      if (err && typeof err === 'object' && 'message' in err) {
        const supabaseErr = err as { message: string };
        const message = supabaseErr.message.toLowerCase();
        
        if (message.includes('already registered') || message.includes('already exists')) {
          errorMessage = 'E-postadressen er allerede i bruk.';
        } else if (message.includes('password') && message.includes('weak')) {
          errorMessage = 'Passordet er for svakt.';
        } else if (message.includes('invalid email')) {
          errorMessage = 'Ugyldig e-postadresse.';
        } else if (message.includes('password should be at least')) {
          errorMessage = 'Passordet må være minst 6 tegn.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <Header />
      
      <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-h1 sm:text-h1 font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Bli en del av Stallplass
            </h2>
            <p className="mt-2 text-slate-600">
              Eller{' '}
              <Link href="/logg-inn" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                logg inn hvis du allerede har en konto
              </Link>
            </p>
          </div>
          
          {/* Form */}
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="nickname" className="block text-sm font-semibold text-slate-900 mb-2">
                    Kallenavn
                  </label>
                  <input
                    id="nickname"
                    name="nickname"
                    type="text"
                    required
                    placeholder="Ditt kallenavn"
                    className="block w-full px-4 py-3 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 placeholder:text-slate-400"
                    value={formData.nickname}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">
                    E-postadresse
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="din@epost.no"
                    className="block w-full px-4 py-3 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 placeholder:text-slate-400"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-900 mb-2">
                    Passord
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Minimum 6 tegn"
                    className="block w-full px-4 py-3 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 placeholder:text-slate-400"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-900 mb-2">
                    Bekreft passord
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="Skriv passordet på nytt"
                    className="block w-full px-4 py-3 text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 placeholder:text-slate-400"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-red-700 text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Oppretter konto...' : 'Opprett konto'}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Ved å opprette en konto godtar du våre{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-500">vilkår</a>{' '}
            og{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-500">personvern</a>
          </p>
        </div>
      </div>
    </div>
  );
}