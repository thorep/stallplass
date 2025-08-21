"use client";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function BekreftelseEpostPage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/logg-inn");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-h1 font-bold text-slate-900">
              Takk for at du bekreftet e-posten din!
            </h1>
            <p className="mt-2 text-body text-slate-600">
              Din konto er nå aktivert og klar til bruk
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-8">
            <div className="space-y-6 text-center">
              {/* Success message */}
              <div className="space-y-3">
                <p className="text-body text-slate-700">
                  🎉 Gratulerer! E-postadressen din er nå bekreftet.
                </p>
                <p className="text-body text-slate-600">
                  Du kan nå logge inn og få full tilgang til alle funksjonene på Stallplass.
                </p>
              </div>

              {/* Login button */}
              <div className="pt-4">
                <Button
                  onClick={handleLogin}
                  className="w-full bg-[#5B4B8A] hover:bg-[#47396A] text-white"
                >
                  Logg inn nå
                </Button>
              </div>

              {/* What you can do */}
              <div className="pt-6 border-t border-slate-200">
                <p className="text-body-sm font-medium text-slate-700 mb-3">Hva kan du gjøre nå?</p>
                <ul className="text-body-sm text-slate-600 space-y-2 text-left">
                  <li className="flex items-start">
                    <span className="text-violet-700 mr-2">✓</span>
                    Legge ut stallbokser til utleie
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-700 mr-2">✓</span>
                    Søke etter ledige stallplasser
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-700 mr-2">✓</span>
                    Administrere dine staller og tjenester
                  </li>
                  <li className="flex items-start">
                    <span className="text-violet-700 mr-2">✓</span>
                    Få tilgang til vårt meldingssystem
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Help text */}
          <p className="text-center text-caption text-slate-500 mt-6">
            Trenger du hjelp med å komme i gang? Kontakt oss på{" "}
            <a href="mailto:hei@stallplass.no" className="text-violet-700 hover:text-violet-800">
              hei@stallplass.no
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
