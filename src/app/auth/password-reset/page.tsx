"use client";

import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";

function PasswordResetContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleAuthFlow = async () => {
      console.log('🔍 Starting auth flow...');
      
      // First, always check if user is already authenticated
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📋 Initial session check:', { hasSession: !!session });
      
      if (session) {
        console.log('✅ User is already authenticated! Password reset worked.');
        setSessionReady(true);
        return;
      }
      
      // Check if we have a code parameter (from password reset link)
      const code = searchParams.get('code');
      const type = searchParams.get('type');
      const tokenHash = searchParams.get('token_hash');
      
      console.log('📝 URL Parameters:', { 
        code: code ? `${code.substring(0, 10)}...` : null, 
        type, 
        tokenHash: tokenHash ? `${tokenHash.substring(0, 10)}...` : null,
        allParams: Object.fromEntries(searchParams.entries())
      });
      
      if (code) {
        console.log('🔑 Found code, but lets wait a moment for session to be set...');
        
        // Wait a bit for the session to be set automatically
        setTimeout(async () => {
          const { data: { session: delayedSession } } = await supabase.auth.getSession();
          console.log('📋 Delayed session check:', { hasSession: !!delayedSession });
          
          if (delayedSession) {
            console.log('✅ Session found after delay!');
            setSessionReady(true);
          } else {
            console.log('❌ Still no session - trying manual exchange...');
            try {
              // Exchange code for session
              const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              
              console.log('📊 Exchange result:', { 
                hasSession: !!data.session, 
                hasUser: !!data.user, 
                error: exchangeError?.message 
              });
              
              if (exchangeError) {
                console.error('❌ Exchange error:', exchangeError);
                setError('Tilbakestillingslenken er ugyldig eller har utløpt.');
                return;
              }
              
              if (data.session) {
                console.log('✅ Session established successfully!');
                setSessionReady(true);
              } else {
                console.warn('⚠️ No session returned from exchange');
                setError('Kunne ikke opprette session.');
              }
            } catch (err) {
              console.error('💥 Exception during auth flow:', err);
              setError('Det oppstod en feil ved behandling av lenken.');
            }
          }
        }, 1000); // Wait 1 second
        
      } else {
        console.log('❌ No session and no code - invalid link');
        setError('Ugyldig tilbakestillingslenke. Vennligst be om en ny lenke.');
      }
    };

    handleAuthFlow();
  }, [searchParams, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!password || !confirmPassword) {
      setError("Alle felt er påkrevd");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passordene matcher ikke");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Passordet må være minst 6 tegn");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        // Success! Redirect to login
        router.push('/logg-inn?message=' + encodeURIComponent('Passordet ditt har blitt oppdatert. Du kan nå logge inn med det nye passordet.'));
      }
    } catch (err) {
      setError('Det oppstod en feil ved oppdatering av passordet.');
    }

    setLoading(false);
  };

  if (!sessionReady && !error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Behandler tilbakestillingslenke...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !sessionReady) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 160px)' }}>
          <div className="w-full max-w-md space-y-6 sm:space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Ugyldig lenke</h2>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
              <Link
                href="/glemt-passord"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
              >
                Be om ny lenke
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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

          <form onSubmit={handleSubmit} className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 sm:py-2 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-base sm:text-sm"
                placeholder="Skriv inn passordet på nytt"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5B4B8A] hover:bg-[#47396A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B39DDB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Oppdaterer...' : 'Oppdater passord'}
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

export default function PasswordResetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Laster...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <PasswordResetContent />
    </Suspense>
  );
}
