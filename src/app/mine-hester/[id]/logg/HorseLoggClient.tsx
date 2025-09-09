"use client";

import { getCustomLogsByCategoryIdAction } from "@/app/actions/logs";

import { CustomCategoriesManager } from "@/components/horses/CustomCategoriesManager";
import { LogModal } from "@/components/horses/LogModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Settings } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  _count?: { logs: number };
}

interface HorseLoggClientProps {
  horse: { id: string; name: string; ownerId: string };
  categories: Category[];
}

export default function HorseLoggClient({
  horse,
  categories: initialCategories,
}: HorseLoggClientProps) {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedFilterCategories, setSelectedFilterCategories] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState(
    initialCategories.map((cat) => ({
      ...cat,
      description: cat.description || undefined,
    }))
  );

  // Memoize categories to prevent unnecessary re-renders
  const memoizedCategories = useMemo(() => categories, [categories]);
  const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    color: "text-indigo-600",
  });

  const [recentLogs, setRecentLogs] = useState<LogWithCategory[] | null>(null);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const loadingRef = useRef(false);

  // Define proper types for logs
  type LogWithCategory = {
    id: string;
    description: string;
    createdAt: Date | string;
    images?: string[];
    profile?: { nickname: string };
    __cat: {
      id: string;
      name: string;
      color: string;
    };
  };

  const canAddLogs = () => {
    // For now, assume user can add logs if they can see the page
    return true;
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/horses/${horse.id}/categories`);
      if (response.ok) {
        const data = await response.json();
        // Transform categories to match the expected type
        const transformedCategories = data.categories.map((cat: Category) => ({
          ...cat,
          description: cat.description || undefined,
        }));
        setCategories(transformedCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryFormData.name.trim()) {
      toast.error("Kategorinavn er påkrevd");
      return;
    }

    setIsSubmittingCategory(true);
    try {
      const response = await fetch(`/api/horses/${horse.id}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryFormData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kunne ikke opprette kategori");
      }

      toast.success("Kategori opprettet");
      setIsCreateCategoryDialogOpen(false);
      setCategoryFormData({
        name: "",
        description: "",
        color: "text-indigo-600",
      });
      fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error(error instanceof Error ? error.message : "Kunne ikke opprette kategori");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const availableColors = [
    "text-indigo-600",
    "text-blue-600",
    "text-green-600",
    "text-red-600",
    "text-yellow-600",
    "text-purple-600",
    "text-pink-600",
    "text-gray-600",
  ];

  const handleAddLog = async () => {
    try {
      setIsLogModalOpen(true);
    } catch {
      toast.error("Kunne ikke åpne logg modal");
    }
  };

  const closeLogModal = () => {
    setIsLogModalOpen(false);
  };

  const toggleCategoryFilter = (categoryId: string) => {
    if (selectedFilterCategories.has(categoryId) && selectedFilterCategories.size === 1) {
      // If clicking the only selected category, clear all filters (show all)

      setSelectedFilterCategories(new Set());
    } else {
      // Select only this category
      setSelectedFilterCategories(new Set([categoryId]));
    }
  };

  const loadRecentLogs = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoadingRecent(true);
    try {
      const allResults: LogWithCategory[] = [];

      // Fetch all logs from each category
      for (const cat of memoizedCategories) {
        try {
          const logs = await getCustomLogsByCategoryIdAction(cat.id);
          if (Array.isArray(logs) && logs.length) {
            // Add category info to each log
            const logsWithCategory = logs.map((log) => ({ ...log, __cat: cat }));
            allResults.push(...logsWithCategory);
          }
        } catch (error) {
          console.error(`Error fetching logs for category ${cat.id}:`, error);
          // ignore individual failures
        }
      }

      // Sort by createdAt desc
      allResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply category filter
      let filteredResults = allResults;
      if (selectedFilterCategories.size > 0) {
        filteredResults = allResults.filter((log) => selectedFilterCategories.has(log.__cat.id));
      }

      setRecentLogs(filteredResults);
    } catch (error) {
      console.error("Error in loadRecentLogs:", error);
    } finally {
      loadingRef.current = false;
      setLoadingRecent(false);
    }
  }, [selectedFilterCategories, memoizedCategories]);

  const handleLogCreated = useCallback(async () => {
    // Refresh categories to update counts
    await fetchCategories();
    // Refresh recent logs to show the new log
    await loadRecentLogs();
  }, [fetchCategories, loadRecentLogs]);

  // Load recent logs when categories or filter changes
  useEffect(() => {
    if (!loadingRef.current) {
      loadRecentLogs();
    }
  }, [loadRecentLogs, memoizedCategories, selectedFilterCategories]);

  return (
    <div className="space-y-6">
      <Card className="py-2 sm:py-6 px-2 sm:px-6">
        <CardContent className="p-0">
          {/* Category filters and actions */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Filter chips */}
               <Button
                 size="sm"
                 variant={selectedFilterCategories.size === 0 ? "default" : "outline"}
                 className="rounded-full px-3"
                 onClick={() => setSelectedFilterCategories(new Set())}
               >
                 Alle
               </Button>
              {categories.map((c) => (
                 <Button
                   key={c.id}
                   size="sm"
                   variant={selectedFilterCategories.has(c.id) ? "default" : "outline"}
                   className="rounded-full px-3"
                   onClick={() => toggleCategoryFilter(c.id)}
                 >
                  {c.name}
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                    {c._count?.logs || 0}
                  </Badge>
                </Button>
              ))}

              {/* Admin + Add buttons */}
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                onClick={() => setIsManageCategoriesModalOpen(true)}
                data-cy="manage-categories"
              >
                <Settings className="h-4 w-4 mr-1" />
                Administrer kategorier
              </Button>
              {canAddLogs() && categories.length > 0 && (
                <Button
                  size="sm"
                  className="text-white hover:bg-purple-700"
                   onClick={() => handleAddLog()}
                  data-cy="add-log-button"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Legg til logg
                </Button>
              )}
            </div>
          </div>

          {/* No categories message */}
          {canAddLogs() && categories.length === 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Du må opprette minst én kategori før du kan legge til logger. Klikk på "Administrer
                kategorier" for å komme i gang.
              </p>
            </div>
          )}

          {/* Recent feed */}
          {loadingRecent && <p className="text-sm text-muted-foreground">Laster siste logger…</p>}
          {!loadingRecent && (recentLogs?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">
              Ingen logger enda. Trykk på "Legg til logg" for å komme i gang.
            </p>
          )}
          <div className="space-y-2 sm:space-y-3">
            {recentLogs?.map((log) => (
              <div
                key={log.id}
                className="px-2 py-3 sm:p-2 border-b sm:border-b-0 border-gray-200 sm:bg-gray-50 rounded-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-start gap-2">
                      <p className="text-sm break-words flex-1">{log.description}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-1">
                      <span>{log.profile?.nickname}</span>
                      <span>• {new Date(log.createdAt).toLocaleDateString("no-NO")}</span>
                      <span
                        className="text-[10px] px-2 py-1 rounded-full text-white font-medium"
                        style={{ backgroundColor: log.__cat?.color || "#6b7280" }}
                      >
                        {log.__cat?.name}
                      </span>
                    </p>
                  </div>
                </div>
                {log.images && log.images.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-2 flex-wrap">
                      {log.images.map((image: string, idx: number) => (
                        <Image
                          key={idx}
                          src={image}
                          alt={`Bilde ${idx + 1}`}
                          width={400}
                          height={300}
                          className="w-full max-w-md h-auto object-cover rounded border border-gray-200"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* <Card className="py-2 sm:py-6 px-2 sm:px-6">
        <CustomCategoriesManager
          horseId={horse.id}
          categories={categories}
          onCategoryCreated={fetchCategories}
          onCategoryUpdated={fetchCategories}
          onCategoryDeleted={fetchCategories}
          showHeader={false}
        />
      </Card> */}

      {isLogModalOpen && (
        <LogModal
          isOpen={isLogModalOpen}
          onClose={closeLogModal}
          horseId={horse.id}
          horseName={horse.name || "Hest"}
          logType="custom"
          categories={categories}
          onLogCreated={handleLogCreated}
        />
      )}

      {/* Manage Categories Modal */}
      <Dialog open={isManageCategoriesModalOpen} onOpenChange={setIsManageCategoriesModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Administrer kategorier</DialogTitle>
          </DialogHeader>
          <CustomCategoriesManager
            horseId={horse.id}
            categories={categories}
            onCategoryCreated={fetchCategories}
            onCategoryUpdated={fetchCategories}
            onCategoryDeleted={fetchCategories}
            showHeader={true}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Opprett ny kategori</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Navn *</Label>
              <Input
                id="category-name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="f.eks. Fôring, Trening, Helse"
                data-cy="categoryName"
              />
              <p className="text-sm text-gray-500 mt-1">Du kan bruke emoji i navnet</p>
            </div>

            <div>
              <Label htmlFor="category-description">Beskrivelse</Label>
              <Textarea
                id="category-description"
                value={categoryFormData.description}
                onChange={(e) =>
                  setCategoryFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Valgfri beskrivelse av kategorien"
                rows={3}
                data-cy="categoryDescription"
              />
            </div>

            <div>
              <Label>Farge</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCategoryFormData((prev) => ({ ...prev, color }))}
                    className={`p-3 border rounded ${
                      categoryFormData.color === color ? "border-blue-500" : "border-gray-200"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded ${color.replace("text-", "bg-")}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreateCategory}
                disabled={isSubmittingCategory}
                className="flex-1"
                data-cy="opprett-kategori-knapp"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isSubmittingCategory ? "Oppretter..." : "Opprett"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateCategoryDialogOpen(false);
                  setCategoryFormData({
                    name: "",
                    description: "",
                    color: "text-indigo-600",
                  });
                }}
                className="flex-1"
              >
                Avbryt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
