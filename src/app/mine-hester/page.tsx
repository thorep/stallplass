"use client";

import { useState, useEffect } from "react";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";
import { getMinhestFlag } from "@/app/actions/flags";
import { useUserHorses } from "@/hooks/useHorses";
import { HorseCard } from "@/components/horses/HorseCard";
import { HorseModal } from "@/components/horses/HorseModal";
import { Button } from "@/components/ui/button";
import { HorseWithOwner } from "@/types/horse";
import { Plus } from "lucide-react";

export default function MineHesterPage() {
  const [showMineHester, setShowMineHester] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHorse, setEditingHorse] = useState<HorseWithOwner | undefined>();

  const { data: horses, isLoading: horsesLoading, error: horsesError } = useUserHorses();

  useEffect(() => {
    const fetchFlag = async () => {
      try {
        const enabled = await getMinhestFlag();
        setShowMineHester(enabled);
      } catch (error) {
        console.error('Error fetching minhest flag:', error);
        setShowMineHester(false);
      } finally {
        setLoading(false);
      }
    };

    fetchFlag();
  }, []);

  const handleAddHorse = () => {
    setEditingHorse(undefined);
    setIsModalOpen(true);
  };


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHorse(undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-body">Laster...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!showMineHester) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-h1 mb-4">Siden er ikke tilgjengelig</h1>
            <p className="text-body">Denne siden er for øyeblikket deaktivert.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-h1 mb-2">Mine Hester</h1>
              <p className="text-body text-gray-600">
                Administrer informasjon om hestene dine
              </p>
            </div>
            <Button onClick={handleAddHorse} className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Legg til hest
            </Button>
          </div>

          {/* Development Info Box */}
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-body font-semibold text-yellow-800 mb-2">
                  Under utvikling - Kan testes
                </h3>
                <p className="text-body-sm text-yellow-700 mb-3">
                  Mine Hester er fortsatt under utvikling og ikke helt klar, men du kan gjerne teste funksjonen.
                </p>
                <div className="text-body-sm text-yellow-700">
                  <p className="mb-2">
                    <strong>Formålet med Mine Hester:</strong> Registrer informasjon om hesten din og få en personlig lenke du kan dele med andre.
                  </p>
                  <p>
                    Dette er nyttig når noen skal passe hesten din - de får tilgang til viktig informasjon om stell, fôring og medisinsk historie.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {horsesLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-body text-gray-600">Laster hester...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {horsesError && !horsesLoading && (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <div className="text-4xl mb-4">🐴</div>
                <h3 className="text-h3 mb-2">Kunne ikke laste hester</h3>
                <p className="text-body">
                  Det oppstod en feil ved lasting av hestene dine. Prøv igjen senere.
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!horsesLoading && !horsesError && horses && horses.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-6">
                <div className="text-6xl mb-4">🐴</div>
                <h3 className="text-h3 mb-2 text-gray-600">Ingen hester lagt til ennå</h3>
                <p className="text-body text-gray-500 mb-6 max-w-md mx-auto">
                  Start med å legge til din første hest for å holde oversikt over viktig informasjon
                  om stell, fôring og medisinsk historie.
                </p>
                <Button onClick={handleAddHorse} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Legg til din første hest
                </Button>
              </div>
            </div>
          )}

          {/* Horses Grid */}
          {!horsesLoading && !horsesError && horses && horses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {horses.map((horse: HorseWithOwner) => (
                <HorseCard
                  key={horse.id}
                  horse={horse}
                />
              ))}
            </div>
          )}

          {/* Stats Section - Show when horses exist */}
          {!horsesLoading && horses && horses.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-h2 text-blue-600 mb-1">{horses.length}</div>
                  <div className="text-body-sm text-gray-600">
                    {horses.length === 1 ? 'Hest' : 'Hester'}
                  </div>
                </div>
                <div>
                  <div className="text-h2 text-purple-600 mb-1">
                    {horses.filter((h: HorseWithOwner) => h.breed).length}
                  </div>
                  <div className="text-body-sm text-gray-600">Med rase</div>
                </div>
                <div>
                  <div className="text-h2 text-orange-600 mb-1">
                    {horses.filter((h: HorseWithOwner) => h.age).length}
                  </div>
                  <div className="text-body-sm text-gray-600">Med alder</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Horse Modal */}
      <HorseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        horse={editingHorse}
      />

      <Footer />
    </div>
  );
}