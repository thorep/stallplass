"use client";

import { getMinhestFlag } from "@/app/actions/flags";
import { HorseCard } from "@/components/horses/HorseCard";
import { HorseModal } from "@/components/horses/HorseModal";
import { Button } from "@mui/material";
import { useUserHorses } from "@/hooks/useHorses";
import { HorseWithOwner } from "@/types/horse";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

interface MineHesterClientProps {
  user: User;
}

export default function MineHesterClient({ user }: MineHesterClientProps) {
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
        console.error("Error fetching minhest flag:", error);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-body">Laster...</p>
        </div>
      </div>
    );
  }

  if (!showMineHester) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-h1 mb-4">Siden er ikke tilgjengelig</h1>
          <p className="text-body">Denne siden er for øyeblikket deaktivert.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-h1 mb-2">Mine Hester</h1>
              <p className="text-body text-gray-600">Administrer informasjon om hestene dine</p>
            </div>
            <Button 
              variant="contained"
              color="primary"
              onClick={handleAddHorse} 
              className="whitespace-nowrap"
              startIcon={<Plus className="h-4 w-4" />}
            >
              Legg til hest
            </Button>
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
                <Button 
                  variant="contained"
                  color="primary"
                  onClick={handleAddHorse} 
                  size="large"
                  startIcon={<Plus className="h-5 w-5" />}
                >
                  Legg til din første hest
                </Button>
              </div>
            </div>
          )}

          {/* Horses Grid */}
          {!horsesLoading && !horsesError && horses && horses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {horses.map((horse: HorseWithOwner) => (
                <HorseCard key={horse.id} horse={horse} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Horse Modal */}
      <HorseModal isOpen={isModalOpen} onClose={handleCloseModal} horse={editingHorse} />
    </>
  );
}