"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export type MonthChip = { key: string; label: string };

type Props = {
  monthLabel: string;
  totalLabel: string;
  totalAmount: string;
  months: MonthChip[];
  activeMonthKey: string;
  onMonthChange: (key: string) => void;
  sort: "date" | "amount" | "category";
  onSortChange: (v: "date" | "amount" | "category") => void;
  onAdd?: () => void;
  addLabel?: string;
};

export default function MonthHeader({
  monthLabel,
  totalLabel,
  totalAmount,
  months,
  activeMonthKey,
  onMonthChange,
  sort,
  onSortChange,
  onAdd,
  addLabel = "Legg til",
}: Props) {
  const sortOptions = useMemo(
    () => [
      { key: "date" as const, label: "Dato" },
      { key: "amount" as const, label: "Beløp" },
      { key: "category" as const, label: "Kategori" },
    ],
    []
  );

  return (
    <div className="sticky top-[var(--safe-top,0px)] z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-baseline justify-between">
          <div className="text-base font-semibold leading-none capitalize">{monthLabel}</div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">{totalLabel}</div>
              <div className="font-semibold tabular-nums">{totalAmount}</div>
            </div>
            {onAdd && (
              <Button size="sm" onClick={onAdd} aria-label={addLabel} className="rounded-full">
                {addLabel}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-2 inline-flex rounded-full border p-0.5">
          {sortOptions.map((opt) => (
            <Button
              key={opt.key}
              variant={sort === opt.key ? "secondary" : "ghost"}
              className={cn(
                "h-8 rounded-full px-3 text-sm",
                sort === opt.key ? "bg-secondary" : ""
              )}
              onClick={() => onSortChange(opt.key)}
              aria-pressed={sort === opt.key}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar px-2 pb-2">
        <div className="flex w-max gap-2">
          {months.map((m) => (
            <button
              key={m.key}
              onClick={() => onMonthChange(m.key)}
              className={cn(
                "px-3 py-1 rounded-full text-sm whitespace-nowrap border",
                m.key === activeMonthKey
                  ? "bg-secondary text-foreground border-border"
                  : "bg-background text-foreground hover:bg-muted border-border"
              )}
              aria-pressed={m.key === activeMonthKey}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
