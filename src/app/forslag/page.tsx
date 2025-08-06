import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import { Metadata } from "next";
import { Suspense } from "react";
import { ForslagClient } from "./client";

export const metadata: Metadata = {
  title: "Forslag - Stallplass",
  description: "Send inn forslag for å forbedre Stallplass.no",
};

export default async function ForslagPage() {
  // No authentication required - suggestions are submitted to GitHub
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8 sm:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-h1 font-bold text-gray-900 mb-4">Send inn forslag</h1>
            <p className="text-body-lg text-gray-600">
              Hjelp oss å forbedre Stallplass.no! Dine tilbakemeldinger registreres anonymt i vårt
              utviklingssystem og bidrar til å gjøre plattformen bedre for alle.
            </p>
            <p className="text-body-lg text-gray-600">
              Du kan følge med på status på din sak nederst på siden.
            </p>
          </div>

          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>}>
            <ForslagClient />
          </Suspense>

          <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200/50">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Hva kan du foreslå?</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Nye funksjoner som kan gjøre plattformen bedre</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Forbedringer av eksisterende funksjoner</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Rapporter om tekniske problemer eller feil</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Forslag til bedre brukeropplevelse</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Ideer for markedsføring og vekst</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
