"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

type Props = {
  title: string;
  date: string; // 31.08
  category: string;
  amount: string; // includes currency suffix
  icon?: React.ReactNode;
  onPress: () => void;
  onDelete?: () => void;
  hasOverride?: boolean;
  isRecurring?: boolean;
};

export default function BudgetListItem({ title, date, category, amount, icon, onPress, onDelete, hasOverride, isRecurring }: Props) {
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const swiped = useRef(false);

  const handleStart = (x: number) => {
    startX.current = x;
    swiped.current = false;
  };
  const handleMove = (x: number) => {
    if (startX.current == null) return;
    const dx = x - startX.current;
    // only allow left swipe
    if (dx < 0) {
      setOffset(Math.max(dx, -96));
    }
  };
  const handleEnd = () => {
    if (startX.current == null) return;
    const shouldOpen = offset <= -64;
    setOffset(shouldOpen ? -96 : 0);
    swiped.current = shouldOpen;
    startX.current = null;
  };

  return (
    <div className="relative select-none">
      {onDelete && (
        <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center">
          <button
            className="rounded-md bg-destructive/90 text-destructive-foreground px-3 py-2 text-sm shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Slett utgift ${title}`}
          >
            Slett
          </button>
        </div>
      )}
      <div
        role="button"
        aria-label={`Rediger utgift ${title}`}
        tabIndex={0}
        onClick={() => {
          if (!swiped.current) onPress();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPress();
          }
        }}
        onTouchStart={(e) => handleStart(e.touches[0]?.clientX || 0)}
        onTouchMove={(e) => handleMove(e.touches[0]?.clientX || 0)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => {
          if (startX.current != null) handleMove(e.clientX);
        }}
        onMouseUp={handleEnd}
        className={cn(
          "flex items-center gap-3 py-3 min-h-[56px] rounded-xl bg-background",
          "transition-transform will-change-transform",
        )}
        style={{ transform: `translate3d(${offset}px,0,0)` }}
      >
        <div className="h-9 w-9 flex items-center justify-center rounded-full border text-base" aria-hidden>
          {icon ?? "🐴"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-semibold truncate">{title}</div>
            <div className="font-semibold tabular-nums whitespace-nowrap">{amount}</div>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <span className="shrink-0">{date}</span>
            <span aria-hidden>·</span>
            <Badge variant="secondary" className="rounded-full truncate max-w-[12rem]">
              {category}
            </Badge>
            {isRecurring && (
              <Badge variant="secondary" className="rounded-full" aria-label="Gjentakende">
                🔁 Gjentakende
              </Badge>
            )}
            {hasOverride && (
              <Badge variant="secondary" className="rounded-full" aria-label="Denne måneden er overstyrt">
                Overstyrt
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
