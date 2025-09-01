"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Plus, FolderOpen } from "lucide-react";
import { useHorse } from "@/hooks/useHorses";
import { useCustomCategories } from "@/hooks/useHorseLogs";
import { CustomLogList } from "@/components/horses/CustomLogList";
import { LogSettingsModal } from "@/components/horses/LogSettingsModal";
import { CategoryManagementModal } from "@/components/horses/CategoryManagementModal";
import { LogModal } from "@/components/horses/LogModal";

export default function HorseLogsPage() {
  const params = useParams();
  const horseId = params.id as string;
  const { data: horse, isLoading: horseLoading, error } = useHorse(horseId);
  const { data: categories = [], isLoading: categoriesLoading } = useCustomCategories(horseId);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
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
            <>
              <Button size="sm" onClick={() => setIsCategoriesOpen(true)} variant="outline">
                <FolderOpen className="h-4 w-4 mr-2" />
                Administrer kategorier
              </Button>
              <Button size="sm" onClick={() => setIsSettingsOpen(true)} variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Visning
              </Button>
            </>
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
            <div className="text-center py-12">
              <div className="mb-6">
                <FolderOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-h4 text-gray-900 mb-2">Ingen kategorier opprettet ennå</h3>
                <p className="text-body text-gray-600 mb-6 max-w-md mx-auto">
                  Lag dine egne kategorier for å organisere hestens logger på en måte som passer deg best.
                </p>
              </div>
              {canAddLogs() && (
                <div className="space-y-3">
                  <Button onClick={() => setIsCategoriesOpen(true)} className="mr-3">
                    <Plus className="h-4 w-4 mr-2" />
                    Opprett første kategori
                  </Button>
                  <p className="text-body-sm text-gray-500">
                    Eller klikk &quot;Administrer kategorier&quot; øverst på siden
                  </p>
                </div>
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
        <>
          <LogSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            horseId={horse.id}
            currentDisplayMode={horse?.logDisplayMode || "FULL"}
          />
          <CategoryManagementModal
            isOpen={isCategoriesOpen}
            onClose={() => setIsCategoriesOpen(false)}
            horseId={horse.id}
          />
        </>
      )}
    </div>
  );
}

