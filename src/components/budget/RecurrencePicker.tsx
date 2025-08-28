"use client";

import { Button } from "@/components/ui/button";

type Recurrence = "none" | "monthly" | "weekly";

type Props = {
  value: Recurrence;
  onChange: (v: Recurrence) => void;
  // Monthly
  anchorDay?: string;
  onAnchorDayChange?: (day: string) => void;
  days?: string[]; // allowed days for month
  // Weekly
  intervalWeeks?: number;
  onIntervalWeeksChange?: (n: number) => void;
  weekday?: number; // 1=Mon .. 7=Sun
  onWeekdayChange?: (d: number) => void;
};

export default function RecurrencePicker({ value, onChange, anchorDay, onAnchorDayChange, days, intervalWeeks = 1, onIntervalWeeksChange, weekday = 1, onWeekdayChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="inline-flex rounded-full border p-0.5">
        {(
          [
            { k: "none", l: "Ingen" },
            { k: "weekly", l: "Ukentlig" },
            { k: "monthly", l: "Månedlig" },
          ] as const
        ).map((o) => (
          <Button
            key={o.k}
            type="button"
            variant={value === o.k ? "secondary" : "ghost"}
            className="h-8 rounded-full px-3 text-sm"
            onClick={() => onChange(o.k)}
            aria-pressed={value === o.k}
          >
            {o.l}
          </Button>
        ))}
      </div>
      {value === "monthly" && onAnchorDayChange && days && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Dag:</span>
          <select
            className="h-9 rounded-md border bg-background px-2"
            value={anchorDay || ""}
            onChange={(e) => onAnchorDayChange(e.target.value)}
          >
            <option value="">Velg</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}
      {value === "weekly" && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Hver</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={12}
              className="h-9 w-16 rounded-md border bg-background px-2"
              value={intervalWeeks}
              onChange={(e) => onIntervalWeeksChange?.(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
            />
            <span className="text-muted-foreground">uke</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Ukedag:</span>
            <select
              className="h-9 rounded-md border bg-background px-2"
              value={weekday}
              onChange={(e) => onWeekdayChange?.(Number(e.target.value))}
            >
              {[
                { v: 1, l: "Man" },
                { v: 2, l: "Tir" },
                { v: 3, l: "Ons" },
                { v: 4, l: "Tor" },
                { v: 5, l: "Fre" },
                { v: 6, l: "Lør" },
                { v: 7, l: "Søn" },
              ].map((o) => (
                <option key={o.v} value={o.v}>
                  {o.l}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
