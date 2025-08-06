'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { InfoIcon } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

function VerifyEmailContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const emailParam = searchParams.get('email');

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User has session - check if verified
        if (user.email_confirmed_at) {
          // Email already verified, redirect to dashboard
          router.push('/dashboard');
          return;
        }
        
        setUser(user);
        setUserEmail(user.email || '');
      } else if (emailParam) {
        // No session but we have email from URL (from registration/login)
        setUserEmail(emailParam);
        setUser(null);
      } else {
        // No session and no email - redirect to login
        router.push('/logg-inn');
        return;
      }

      setLoading(false);
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user?.email_confirmed_at) {
            // Email has been verified!
            toast.success('E-posten din er bekreftet! Videresender deg...');
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
          }
        } else if (event === 'SIGNED_OUT') {
          router.push('/logg-inn');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, searchParams]);

  const handleResendVerification = async () => {
    const emailToResend = user?.email || userEmail;
    if (!emailToResend) return;

    setResending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToResend,
      });

      if (error) throw error;

      toast.success('Bekreftelseslenke sendt! Sjekk e-posten din.');
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('Kunne ikke sende bekreftelseslenke. Prøv igjen senere.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    try {
      const supabase = createClient();
      
      // Try to get session (user might have verified and can now login)
      const { data: { user: refreshedUser }, error } = await supabase.auth.getUser();
      
      if (error) throw error;

      if (refreshedUser?.email_confirmed_at) {
        toast.success('E-posten din er bekreftet! Videresender deg...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else if (!refreshedUser && userEmail) {
        // No session but we have email - try to log them in to check status
        toast.info('E-posten din er fortsatt ikke bekreftet. Sjekk innboksen din og klikk på lenken.');
      } else {
        toast.info('E-posten din er fortsatt ikke bekreftet. Sjekk innboksen din.');
      }
    } catch (error) {
      console.error('Check verification error:', error);
      toast.error('Kunne ikke sjekke bekreftelsesstatus.');
    } finally {
      setCheckingVerification(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-500">Laster...</div>
        </div>
      </div>
    );
  }

  if (!user && !userEmail) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <Header />
      
      <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Image */}
          <div className="mb-8 relative h-64 w-full">
            <Image
              src="/horse-waiting-for-email.jpeg"
              alt="Hest som venter på e-post"
              fill
              className="object-contain rounded-lg"
              priority
            />
          </div>
          
          {/* Icon */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4">
              <EnvelopeIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-h1 font-bold text-slate-900">
              Bekreft e-postadressen din
            </h1>
            <p className="mt-2 text-body text-slate-600">
              Vi har sendt en bekreftelseslenke til
            </p>
            <p className="mt-1 text-body font-semibold text-slate-900">
              {user?.email || userEmail}
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-8">
            <div className="space-y-6">
              {/* Instructions */}
              <Alert className="border-blue-200 bg-blue-50">
                <InfoIcon className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-body-sm text-blue-900">
                  <strong>Neste steg:</strong>
                  <ol className="mt-2 list-decimal list-inside space-y-1">
                    <li>Åpne e-posten din</li>
                    <li>Se etter en e-post fra <strong>hei@stallplass.no</strong></li>
                    <li>Klikk på bekreftelseslenken i e-posten</li>
                    <li>Du blir automatisk videresendt når e-posten er bekreftet</li>
                  </ol>
                </AlertDescription>
              </Alert>

              {/* Spam folder reminder */}
              <Alert>
                <AlertDescription className="text-body-sm text-slate-700">
                  <strong>Kan du ikke finne e-posten?</strong><br />
                  Sjekk spam/søppelpost-mappen din. E-poster fra nye avsendere havner 
                  noen ganger der.
                </AlertDescription>
              </Alert>

              {/* Action buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleResendVerification}
                  disabled={resending}
                  variant="outline"
                  className="w-full"
                >
                  {resending ? 'Sender...' : 'Send bekreftelseslenke på nytt'}
                </Button>

                <Button
                  onClick={handleCheckVerification}
                  disabled={checkingVerification}
                  className="w-full"
                >
                  {checkingVerification ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Sjekker...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Jeg har bekreftet e-posten min
                    </>
                  )}
                </Button>
              </div>

              {/* Alternative actions */}
              <div className="text-center pt-4 border-t border-slate-200">
                {!user ? (
                  <p className="text-body-sm text-slate-600">
                    Feil e-postadresse?{' '}
                    <button
                      onClick={() => router.push('/registrer')}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Registrer deg på nytt
                    </button>
                    {' '}eller{' '}
                    <button
                      onClick={() => router.push('/logg-inn')}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      prøv å logge inn
                    </button>
                  </p>
                ) : (
                  <p className="text-body-sm text-slate-600">
                    Feil e-postadresse?{' '}
                    <button
                      onClick={async () => {
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        router.push('/registrer');
                      }}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Registrer deg på nytt
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Help text */}
          <p className="text-center text-caption text-slate-500 mt-6">
            Trenger du hjelp? Kontakt oss på{' '}
            <a href="mailto:hei@stallplass.no" className="text-indigo-600 hover:text-indigo-500">
              hei@stallplass.no
            </a>
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-500">Laster...</div>
        </div>
        <Footer />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}