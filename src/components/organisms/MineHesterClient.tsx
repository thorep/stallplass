"use client";
import { HorsesWithOwner } from "@/app/mine-hester/page";
import BudgetOverviewAllHorses from "@/components/budget/BudgetOverviewAllHorses";
import { HorseCard } from "@/components/horses/HorseCard";
import { HorseModal } from "@/components/horses/HorseModal";
import { HorseWithOwner } from "@/types/horse";
import { Button } from "@mui/material";
import { User } from "@supabase/supabase-js";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function MineHesterClient({
  user,
  horses,
  budgetOverview,
  activeMonth,
}: Readonly<{
  user: User;
  horses: HorsesWithOwner[];
  budgetOverview?: { months: { month: string; total: number }[] };
  activeMonth?: string;
}>) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHorse, setEditingHorse] = useState<HorseWithOwner | undefined>();

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
              data-cy="add-horse-button"
            >
              Legg til hest
            </Button>
          </div>

          {/* Budget overview for all horses (no edit) */}
          {horses && horses.length > 0 && (
            <div className="mb-8">
              <BudgetOverviewAllHorses initialData={budgetOverview} activeMonth={activeMonth} />
            </div>
          )}

          {/* Empty State */}
          {horses && horses.length === 0 && (
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
                    data-cy="add-horse-button"
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
          {horses && horses.length > 0 && (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-cy="horses-grid"
            >
              {horses.map((horse) => (
                <HorseCard key={horse.id} horse={horse} user={user} />
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
