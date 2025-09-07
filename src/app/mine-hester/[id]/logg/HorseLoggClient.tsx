"use client";

import { getCustomLogsByCategoryIdAction } from "@/app/actions/logs";
import { CategoryManagementModal } from "@/components/horses/CategoryManagementModal";
import { LogModal } from "@/components/horses/LogModal";
import { LogSettingsModal } from "@/components/horses/LogSettingsModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, FolderOpen, Loader2, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

export default function HorseLoggClient({ horseId, horse, categories }: HorseLoggClientProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [currentCategories, setCurrentCategories] = useState(categories);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryLogs, setCategoryLogs] = useState<Record<string, any[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<Set<string>>(new Set());
  const [addingLog, setAddingLog] = useState<string | null>(null);

  type ViewMode = "RECENT" | "CATEGORIES";
  const [viewMode, setViewMode] = useState<ViewMode>("RECENT");
  const [recentLogs, setRecentLogs] = useState<any[] | null>(null);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const canAddLogs = () => {
    // For now, assume user can add logs if they can see the page
    return true;
  };

  const handleAddLog = async (categoryId: string) => {
    setAddingLog(categoryId);
    try {
      setSelectedCategoryId(categoryId);
      setIsLogModalOpen(true);
      toast.success("Logg modal åpnet");
    } catch (error) {
      toast.error("Kunne ikke åpne logg modal");
    } finally {
      setAddingLog(null);
    }
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
      console.error("Error refreshing categories:", error);
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

    setLoadingLogs((prev) => new Set(prev).add(categoryId));
    try {
      const logs = await getCustomLogsByCategoryIdAction(categoryId);
      setCategoryLogs((prev) => ({ ...prev, [categoryId]: logs }));
    } catch (error) {
      console.error("Error loading category logs:", error);
    } finally {
      setLoadingLogs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });
    }
  };

  const loadRecentLogs = async () => {
    if (loadingRecent || recentLogs) return;
    setLoadingRecent(true);
    try {
      const results: any[] = [];
      // Fetch each category once (first page) and collect logs
      for (const cat of currentCategories) {
        try {
          const logs = await getCustomLogsByCategoryIdAction(cat.id);
          // take the last 2 from each to keep it light
          if (Array.isArray(logs) && logs.length) {
            const pick = logs.slice(-2);
            for (const l of pick) results.push({ ...l, __cat: cat });
          }
        } catch (e) {
          // ignore individual failures
        }
      }
      // sort by createdAt desc
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentLogs(results);
    } finally {
      setLoadingRecent(false);
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

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={viewMode === "RECENT" ? "default" : "outline"}
          className="rounded-full"
          onClick={() => {
            setViewMode("RECENT");
            loadRecentLogs();
          }}
        >
          Siste
        </Button>
        <Button
          size="sm"
          variant={viewMode === "CATEGORIES" ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setViewMode("CATEGORIES")}
        >
          Kategorier
        </Button>
      </div>

      {viewMode === "RECENT" ? (
        <Card>
          <CardHeader>
            <CardTitle>Hurtiglogg &amp; siste</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Quick-add category chips */}
            {canAddLogs() && (
              <div className="mb-4 overflow-x-auto snap-x">
                <div className="flex gap-2 min-w-full snap-mandatory">
                  {currentCategories.map((c) => (
                    <Button
                      key={c.id}
                      size="sm"
                      variant="outline"
                      className="rounded-full whitespace-nowrap snap-start"
                      onClick={() => handleAddLog(c.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {c.name}
                      <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                        {c._count?.logs || 0}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent feed */}
            {loadingRecent && <p className="text-sm text-muted-foreground">Laster siste logger…</p>}
            {!loadingRecent && (recentLogs?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">
                Ingen logger enda. Trykk på en kategori for å legge til.
              </p>
            )}
            <div className="space-y-3">
              {recentLogs?.map((log) => (
                <div key={log.id} className="p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm break-words line-clamp-3">{log.description}</p>
                      <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-1">
                        <span>{log.profile?.nickname}</span>
                        <span>• {new Date(log.createdAt).toLocaleDateString("no-NO")}</span>
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 leading-4">
                          {log.__cat?.name}
                        </Badge>
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleAddLog(log.__cat?.id)}
                      aria-label="Legg til logg"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {log.images && log.images.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {log.images.slice(0, 3).map((image: string, idx: number) => (
                        <img
                          key={idx}
                          src={image}
                          alt=""
                          className="w-16 h-16 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
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
                    Lag dine egne kategorier for å organisere hestens logger på en måte som passer
                    deg best.
                  </p>
                </div>
                {canAddLogs() && (
                  <Button size="sm" onClick={() => setIsCategoryModalOpen(true)} className="mt-4">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Opprett første kategori
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {currentCategories.map((category) => (
                  <div
                    key={category.id}
                    className="py-2 px-3 rounded-lg hover:bg-muted/40 active:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className="min-w-0 flex-1"
                        role="button"
                        onClick={() => toggleCategoryExpansion(category.id)}
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold truncate">{category.name}</h3>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-2 py-0.5 leading-4 shrink-0"
                          >
                            {category._count?.logs || 0}
                          </Badge>
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {canAddLogs() && (
                          <Button
                            size="sm"
                            className="min-h-[40px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddLog(category.id);
                            }}
                            disabled={addingLog === category.id}
                          >
                            {addingLog === category.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            <span>Logg</span>
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategoryExpansion(category.id);
                          }}
                          aria-label={
                            expandedCategories.has(category.id) ? "Skjul logger" : "Vis logger"
                          }
                        >
                          {expandedCategories.has(category.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {expandedCategories.has(category.id) && (
                      <div className="mt-4 space-y-3">
                        {loadingLogs.has(category.id) ? (
                          <p className="text-sm text-gray-500">Laster logger...</p>
                        ) : (
                          categoryLogs[category.id]?.map((log) => (
                            <div key={log.id} className="p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm">{log.description}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {log.profile?.nickname} •{" "}
                                    {new Date(log.createdAt).toLocaleDateString("no-NO")}
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
      )}

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
