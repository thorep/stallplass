"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, FolderOpen, ChevronDown, ChevronUp } from "lucide-react";
import { LogSettingsModal } from "@/components/horses/LogSettingsModal";
import { LogModal } from "@/components/horses/LogModal";
import { CategoryManagementModal } from "@/components/horses/CategoryManagementModal";
import { getCustomLogsByCategoryIdAction } from "@/app/actions/logs";

interface HorseLoggClientProps {
  horseId: string;
  horse: { id: string; name: string; ownerId: string; logDisplayMode?: string };
  categories: {
    id: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    isActive: boolean;
    sortOrder: number;
    _count?: { logs: number };
  }[];
}

export default function HorseLoggClient({
  horseId,
  horse,
  categories
}: HorseLoggClientProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [currentCategories, setCurrentCategories] = useState(categories);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryLogs, setCategoryLogs] = useState<Record<string, any[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<Set<string>>(new Set());

  const canAddLogs = () => {
    // For now, assume user can add logs if they can see the page
    return true;
  };

  const handleAddLog = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setIsLogModalOpen(true);
  };

  const closeLogModal = () => {
    setIsLogModalOpen(false);
    setSelectedCategoryId(null);
  };

  const handleCategoryChange = async () => {
    // Refresh categories from server
    try {
      const response = await fetch(`/api/horses/${horseId}/categories`);
      if (response.ok) {
        const data = await response.json();
        setCurrentCategories(data.categories);
        // Refresh logs for all expanded categories
        for (const categoryId of expandedCategories) {
          await loadCategoryLogs(categoryId);
        }
      }
    } catch (error) {
      console.error('Error refreshing categories:', error);
    }
  };

  const toggleCategoryExpansion = async (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
      // Load logs if not already loaded
      if (!categoryLogs[categoryId]) {
        await loadCategoryLogs(categoryId);
      }
    }
    setExpandedCategories(newExpanded);
  };

  const loadCategoryLogs = async (categoryId: string) => {
    if (loadingLogs.has(categoryId)) return;

    setLoadingLogs(prev => new Set(prev).add(categoryId));
    try {
      const logs = await getCustomLogsByCategoryIdAction(categoryId);
      setCategoryLogs(prev => ({ ...prev, [categoryId]: logs }));
    } catch (error) {
      console.error('Error loading category logs:', error);
    } finally {
      setLoadingLogs(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h2">Logg</h1>
        <div className="flex gap-2">
          {canAddLogs() && (
            <>
              <Button size="sm" onClick={() => setIsCategoryModalOpen(true)} variant="outline">
                <FolderOpen className="h-4 w-4 mr-2" />
                Kategorier
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
          {currentCategories.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <h3 className="text-h4 text-gray-900 mb-2">Ingen kategorier opprettet ennå</h3>
                <p className="text-body text-gray-600 mb-6 max-w-md mx-auto">
                  Lag dine egne kategorier for å organisere hestens logger på en måte som passer deg best.
                </p>
              </div>
              {canAddLogs() && (
                <Button
                  size="sm"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="mt-4"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Opprett første kategori
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {currentCategories.map((category) => (
                <div key={category.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${category.color.replace("text-", "bg-")} bg-opacity-10`}>
                        <span className={`text-lg ${category.color}`}>{category.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category._count?.logs || 0} logger</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canAddLogs() && (
                        <Button
                          size="sm"
                          onClick={() => handleAddLog(category.id)}
                        >
                          Legg til logg
                        </Button>
                      )}
                      {(category._count?.logs || 0) > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleCategoryExpansion(category.id)}
                        >
                          {expandedCategories.has(category.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {expandedCategories.has(category.id) && (
                    <div className="mt-4 space-y-3">
                      {loadingLogs.has(category.id) ? (
                        <p className="text-sm text-gray-500">Laster logger...</p>
                      ) : (
                        categoryLogs[category.id]?.map((log) => (
                          <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm">{log.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {log.profile?.nickname} • {new Date(log.createdAt).toLocaleDateString('no-NO')}
                                </p>
                              </div>
                            </div>
                            {log.images && log.images.length > 0 && (
                              <div className="mt-2 flex gap-2">
                                {log.images.map((image: string, index: number) => (
                                  <img
                                    key={index}
                                    src={image}
                                    alt={log.imageDescriptions?.[index] || `Bilde ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCategoryId && (
        <LogModal
          isOpen={isLogModalOpen}
          onClose={closeLogModal}
          horseId={horse.id}
          horseName={horse.name || "Hest"}
          logType="custom"
          customCategoryId={selectedCategoryId}
          onLogCreated={handleCategoryChange}
        />
      )}

      <LogSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        horseId={horse.id}
        currentDisplayMode={horse?.logDisplayMode || "FULL"}
      />

      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        horseId={horseId}
        categories={currentCategories}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  );
}