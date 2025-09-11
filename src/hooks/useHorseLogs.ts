"use client";

import { useEffect, useState } from "react";
import { getCustomLogsByCategoryIdAction } from "@/app/actions/logs";

export interface HorseCustomCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  _count?: { logs: number };
}

export interface HorseLog {
  id: string;
  description: string;
  createdAt: Date | string;
  images?: string[];
  imageDescriptions?: string[];
  profile?: { nickname: string };
  category?: {
    id: string;
    name: string;
    color: string;
  };
}

export function useCustomLogs(categoryId: string) {
  const [data, setData] = useState<HorseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const logs = await getCustomLogsByCategoryIdAction(categoryId);
        // Transform the data to match HorseLog interface
        const transformedLogs = logs.map(log => ({
          ...log,
          category: log.category ? {
            id: log.category.id,
            name: log.category.name,
            color: log.category.color,
          } : undefined,
        }));
        setData(transformedLogs);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch logs");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (categoryId) {
      fetchLogs();
    }
  }, [categoryId]);

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      if (categoryId) {
        const fetchLogs = async () => {
          try {
            setIsLoading(true);
            const logs = await getCustomLogsByCategoryIdAction(categoryId);
            // Transform the data to match HorseLog interface
            const transformedLogs = logs.map(log => ({
              ...log,
              category: log.category ? {
                id: log.category.id,
                name: log.category.name,
                color: log.category.color,
              } : undefined,
            }));
            setData(transformedLogs);
            setError(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch logs");
          } finally {
            setIsLoading(false);
          }
        };
        fetchLogs();
      }
    }
  };
}