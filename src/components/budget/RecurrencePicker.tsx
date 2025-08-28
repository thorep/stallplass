"use client";

import { Button } from "@/components/ui/button";

type Recurrence = "none" | "monthly" | "weekly";

type Props = {
  value: Recurrence;
  onChange: (v: Recurrence) => void;
  anchorDay?: string;
  onAnchorDayChange?: (day: string) => void;
  days?: string[]; // allowed days for month
};

export default function RecurrencePicker({ value, onChange, anchorDay, onAnchorDayChange, days }: Props) {
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
            disabled={o.k === "weekly"}
            title={o.k === "weekly" ? "Ikke støttet ennå" : undefined}
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
    </div>
  );
}

