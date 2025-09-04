import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { EntityType } from "@/generated/prisma";
import { useFavoriteCount } from "@/hooks";
import type { FavoriteStats } from "@/hooks/useFavoriteStats";

type FavoriteEntityType =
  | 'STABLE'
  | 'BOX'
  | 'SERVICE'
  | 'PART_LOAN_HORSE'
  | 'HORSE_SALE'
  | 'HORSE_BUY';

interface FavoriteCountProps {
  entityType: FavoriteEntityType;
  entityId: string;
  className?: string;
  showIcon?: boolean;
  showZero?: boolean;
}

// Map EntityType to FavoriteStats keys
const entityTypeToStatsKey: Record<FavoriteEntityType, keyof FavoriteStats> = {
  STABLE: 'stables',
  BOX: 'boxes',
  SERVICE: 'services',
  PART_LOAN_HORSE: 'partLoanHorses',
  HORSE_SALE: 'horseSales',
  HORSE_BUY: 'horseBuys',
};

/**
 * Component to display favorite count for a listing
 */
export default function FavoriteCount({
  entityType,
  entityId,
  className = "",
  showIcon = true,
  showZero = false
}: FavoriteCountProps) {
  const statsKey = entityTypeToStatsKey[entityType];
  const count = useFavoriteCount(statsKey, entityId);

  // Don't show anything if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-1 text-sm text-slate-600 ${className}`}>
      {showIcon && (
        count > 0 ? (
          <HeartIconSolid className="h-4 w-4 text-red-500" />
        ) : (
          <HeartIcon className="h-4 w-4 text-slate-400" />
        )
      )}
      <span className={count > 0 ? "font-medium text-slate-700" : ""}>
        {count}
      </span>
    </div>
  );
}
