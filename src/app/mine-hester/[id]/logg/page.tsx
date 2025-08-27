"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Plus } from "lucide-react";
import { useHorse } from "@/hooks/useHorses";
import { useCustomCategories } from "@/hooks/useHorseLogs";
import { CustomLogList } from "@/components/horses/CustomLogList";
import { LogSettingsModal } from "@/components/horses/LogSettingsModal";
import { LogModal } from "@/components/horses/LogModal";

export default function HorseLogsPage() {
  const params = useParams();
  const horseId = params.id as string;
  const { data: horse, isLoading: horseLoading, error } = useHorse(horseId);
  const { data: categories = [], isLoading: categoriesLoading } = useCustomCategories(horseId);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const canAddLogs = () => horse?.isOwner === true || horse?.permissions?.includes("ADD_LOGS") === true;

  const handleAddLog = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setIsLogModalOpen(true);
  };

  const closeLogModal = () => {
    setIsLogModalOpen(false);
    setSelectedCategoryId(null);
  };

  if (horseLoading) {
    return (
      <div className="min-h-40 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !horse) {
    return <div className="text-center text-red-600">Kunne ikke laste hest</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h2">Logg</h1>
        <div className="flex gap-2">
          {canAddLogs() && (
            <Button size="sm" onClick={() => setIsSettingsOpen(true)} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Visning
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kategorier</CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-body text-gray-600 mb-4">Ingen kategorier opprettet ennå.</p>
              {canAddLogs() && (
                <p className="text-body-sm text-gray-500">Opprett en kategori i innstillinger.</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => (
                <CustomLogList
                  key={category.id}
                  category={category}
                  displayMode={horse.logDisplayMode}
                  canAddLogs={canAddLogs()}
                  onAddLog={handleAddLog}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {horse && selectedCategoryId && (
        <LogModal
          isOpen={isLogModalOpen}
          onClose={closeLogModal}
          horseId={horse.id}
          horseName={horse.name}
          logType={"custom"}
          customCategoryId={selectedCategoryId}
        />
      )}

      {horse && (
        <LogSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          horseId={horse.id}
          currentDisplayMode={horse?.logDisplayMode || "FULL"}
        />
      )}
    </div>
  );
}

