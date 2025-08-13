"use client";

import { HorseCard } from "@/components/horses/HorseCard";
import { HorseModal } from "@/components/horses/HorseModal";
import { useUserHorses } from "@/hooks/useHorses";
import { HorseWithOwner } from "@/types/horse";
import { Button } from "@mui/material";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";


export default function MineHesterClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHorse, setEditingHorse] = useState<HorseWithOwner | undefined>();

  const { data: horses, isLoading: horsesLoading, error: horsesError } = useUserHorses();

  const handleAddHorse = () => {
    setEditingHorse(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHorse(undefined);
  };

  return (
    <>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-h1 mb-2">Mine Hester</h1>
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
            <div className="text-center py-20">
              <div className="max-w-4xl mx-auto px-4">
                <div className="mb-6">
                  <Image
                    src="/minehester.png"
                    alt="Hester i felt"
                    width={300}
                    height={225}
                    className="mx-auto rounded-lg shadow-lg"
                    sizes="300px"
                    quality={75}
                    priority
                  />
                </div>
                <h3 className="text-h3 mb-4 text-gray-800">Bygg et fellesskap rundt hesten din</h3>
                <div className="max-w-lg mx-auto">
                  <p className="text-body text-gray-600 mb-10 leading-relaxed">
                    Registrer hesten din og inviter <strong>forryttere</strong> eller{" "}
                    <strong>hestepasser</strong> til å hjelpe. De kan loggføre aktiviteter og legge
                    inn bilder av hestens utvikling.
                  </p>
                  <p className="text-body text-green-700 font-medium mb-10">
                    Tjenesten er HELT gratis for deg som eier og de du inviterer.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddHorse}
                    size="large"
                    startIcon={<Plus className="h-5 w-5" />}
                    sx={{
                      borderRadius: "0.75rem",
                      textTransform: "none",
                      py: 2,
                      px: 4,
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    Registrer din første hest
                  </Button>
                </div>
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
