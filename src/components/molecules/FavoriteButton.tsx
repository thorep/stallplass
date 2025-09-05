"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { EntityType } from "@/generated/prisma";
import { useIsFavorited } from "@/hooks/useFavorites";
import { useToggleFavorite } from "@/hooks/useToggleFavorite";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  entityType: EntityType;
  entityId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Button component for toggling favorite status
 *
 * Features:
 * - Truly instant visual feedback with optimistic updates
 * - No loading states - API calls happen in background
 * - Automatic state management via TanStack Query
 * - Accessible with proper ARIA labels
 * - Seamless user experience with immediate color changes
 */
export default function FavoriteButton({
  entityType,
  entityId,
  className,
  size = "md"
}: FavoriteButtonProps) {
  const isFavorited = useIsFavorited(entityType, entityId);
  const toggleFavorite = useToggleFavorite();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // shouldAdd should be true if it's NOT currently favorited
    const shouldAdd = !isFavorited;
    toggleFavorite.mutate({ entityType, entityId, shouldAdd });
  };

  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full p-2 transition-colors",
        "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        className
      )}
      aria-label={isFavorited ? "Fjern fra favoritter" : "Legg til i favoritter"}
      data-cy="favorite-button"
    >
      {isFavorited ? (
        <HeartIconSolid
          className={cn(
            "text-red-500 transition-colors",
            sizeClasses[size]
          )}
        />
      ) : (
        <HeartIcon
          className={cn(
            "text-gray-400 hover:text-red-400 transition-colors",
            sizeClasses[size]
          )}
        />
      )}
    </button>
  );
}