import Link from "next/link";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";
import LoginForm from "@/components/molecules/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnUrl?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const returnUrl = params.returnUrl || "/dashboard";
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 160px)' }}>
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div>
            <h2 className="mt-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Logg inn
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Logg inn på din konto for å administrere dine staller og tjenester eller for å finne
              stallplass.
            </p>
            <p className="mt-2 text-center text-sm text-gray-500">
              Har du ikke en konto?{" "}
              <Link
                href="/registrer"
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Registrer deg her
              </Link>
            </p>
          </div>

          <LoginForm error={error} returnUrl={returnUrl} />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
