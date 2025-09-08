"use client";

import { getCustomLogsByCategoryIdAction } from "@/app/actions/logs";

import { LogModal } from "@/components/horses/LogModal";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface HorseLoggClientProps {
  horse: { id: string; name: string; ownerId: string };
  categories: {
    id: string;
    name: string;
    description?: string | null;
    icon: string;
    color: string;
    isActive: boolean;
    sortOrder: number;
    _count?: { logs: number };
  }[];
}

export default function HorseLoggClient({ horse, categories }: HorseLoggClientProps) {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedFilterCategories, setSelectedFilterCategories] = useState<Set<string>>(new Set());

  const [recentLogs, setRecentLogs] = useState<LogWithCategory[] | null>(null);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [recentLogsPage, setRecentLogsPage] = useState(1);
  const [hasMoreRecentLogs, setHasMoreRecentLogs] = useState(true);
  const [allRecentLogs, setAllRecentLogs] = useState<LogWithCategory[]>([]);
  const LOGS_PER_PAGE = 10;
  const recentInitializedRef = useRef(false);

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

  const handleAddLog = async (categoryId: string) => {
    try {
      setSelectedCategoryId(categoryId);
      setIsLogModalOpen(true);
      toast.success("Logg modal åpnet");
    } catch {
      toast.error("Kunne ikke åpne logg modal");
    }
  };

  const closeLogModal = () => {
    setIsLogModalOpen(false);
    setSelectedCategoryId(null);
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

  const loadRecentLogs = useCallback(
    async (loadMore = false) => {
      if (loadingRecent) return;

      setLoadingRecent(true);
      try {
        let allResults: LogWithCategory[] = [];

        // Always fetch fresh data on initial load
        if (!loadMore || allRecentLogs.length === 0) {
          // Fetch all logs from each category
          for (const cat of categories) {
            try {
              const logs = await getCustomLogsByCategoryIdAction(cat.id);
              if (Array.isArray(logs) && logs.length) {
                // Add category info to each log
                const logsWithCategory = logs.map((log) => ({ ...log, __cat: cat }));
                allResults.push(...logsWithCategory);
              }
            } catch {
              // ignore individual failures
            }
          }
          // sort by createdAt desc
          allResults.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setAllRecentLogs(allResults);
          setRecentLogsPage(1);
        } else {
          // Use existing all results for load more
          allResults = allRecentLogs;
        }

        // Apply category filter
        let filteredResults = allResults;
        if (selectedFilterCategories.size > 0) {
          filteredResults = allResults.filter((log) => selectedFilterCategories.has(log.__cat.id));
        }

        // Apply pagination
        const nextPage = loadMore ? recentLogsPage + 1 : 1;
        const paginatedResults = filteredResults.slice(0, nextPage * LOGS_PER_PAGE);

        setRecentLogs(paginatedResults);
        setHasMoreRecentLogs(filteredResults.length > paginatedResults.length);
        setRecentLogsPage(nextPage);
      } finally {
        setLoadingRecent(false);
      }
    },
    [categories, loadingRecent, allRecentLogs, recentLogsPage, LOGS_PER_PAGE, selectedFilterCategories]
  );

  // Load recent logs on component mount
  useEffect(() => {
    if (!recentInitializedRef.current) {
      recentInitializedRef.current = true;
      setRecentLogsPage(1);
      setHasMoreRecentLogs(true);
      setRecentLogs(null);
      setAllRecentLogs([]);
      loadRecentLogs();
    }
  }, [loadRecentLogs]);

  // Reload logs when filter changes
  useEffect(() => {
    if (recentInitializedRef.current) {
      setRecentLogsPage(1);
      setHasMoreRecentLogs(true);
      setRecentLogs(null);
      setAllRecentLogs([]);
      loadRecentLogs();
    }
  }, [selectedFilterCategories]);

  const loadMoreRecentLogs = () => {
    loadRecentLogs(true);
  };

  return (
    <div className="space-y-6">
      <Card className="py-2 sm:py-6 px-2 sm:px-6">
        <CardHeader className="p-0 pt-2">
          <CardTitle>Hurtiglogg & siste</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Category filters */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedFilterCategories.size === 0 ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setSelectedFilterCategories(new Set())}
              >
                Alle
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant={selectedFilterCategories.has(c.id) ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => toggleCategoryFilter(c.id)}
                >
                  {c.name}
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                    {c._count?.logs || 0}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Add log button */}
          {canAddLogs() && (
            <div className="mb-4">
              <Button
                size="sm"
                onClick={() => handleAddLog("")}
                className="rounded-full"
                data-cy="add-log-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Legg til logg
              </Button>
            </div>
          )}

          {/* Load more button */}
          {hasMoreRecentLogs && recentLogs && recentLogs.length > 0 && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={loadMoreRecentLogs}
                disabled={loadingRecent}
                variant="outline"
                size="sm"
              >
                {loadingRecent ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Laster...
                  </>
                ) : (
                  "Last flere logger"
                )}
              </Button>
            </div>
          )}

          {/* Recent feed */}
          {loadingRecent && <p className="text-sm text-muted-foreground">Laster siste logger…</p>}
          {!loadingRecent && (recentLogs?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">
              Ingen logger enda. Trykk på &quot;Legg til logg&quot; for å komme i gang.
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
      {selectedCategoryId && (
        <LogModal
          isOpen={isLogModalOpen}
          onClose={closeLogModal}
          horseId={horse.id}
          horseName={horse.name || "Hest"}
          logType="custom"
          customCategoryId={selectedCategoryId}
        />
      )}
    </div>
  );
}
