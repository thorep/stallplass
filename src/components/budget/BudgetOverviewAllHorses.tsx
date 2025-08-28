"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

function ymNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function toYM(y: number, m: number) {
  return `${y}-${String(m).padStart(2, "0")}`;
}
function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("nb-NO", { month: "long", year: "numeric" });
}
function shortMonth(ym: string) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  return new Date(y, m - 1, 1).toLocaleDateString("nb-NO", { month: "short" });
}
function addMonths(ym: string, delta: number) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}
function formatNOK(n: number) {
  return new Intl.NumberFormat("nb-NO").format(n);
}

export default function BudgetOverviewAllHorses() {
  const [active, setActive] = useState(ymNow());
  const from = useMemo(() => addMonths(active, -5), [active]);
  const to = useMemo(() => addMonths(active, 6), [active]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["budget-overview", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/budget/overview?from=${from}&to=${to}`, { credentials: "include" });
      if (!res.ok) throw new Error("Kunne ikke hente");
      return (await res.json()) as { months: { month: string; total: number }[] };
    },
    staleTime: 60_000,
  });

  const months = data?.months || [];
  const totalForActive = months.find((m) => m.month === active)?.total || 0;

  return (
    <div className="rounded-2xl border p-3">
      <div className="flex items-baseline justify-between px-1">
        <div className="text-sm font-semibold">Budsjett (alle hester)</div>
        <div className="text-xs text-muted-foreground">{monthLabel(active)}</div>
      </div>
      <div className="overflow-x-auto no-scrollbar mt-2 px-1">
        <div className="flex w-max gap-2">
          {months.map((m) => (
            <button
              key={m.month}
              onClick={() => setActive(m.month)}
              className={`px-3 py-1 rounded-full text-sm border whitespace-nowrap ${
                m.month === active ? "bg-secondary" : "hover:bg-muted"
              }`}
              aria-pressed={m.month === active}
            >
              {shortMonth(m.month)}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 px-1">
        {isLoading ? (
          <div className="h-10 rounded-md bg-muted/50 animate-pulse" />
        ) : error ? (
          <div className="text-sm text-red-600">Kunne ikke hente budsjett</div>
        ) : (
          <div className="text-2xl font-semibold tabular-nums">{formatNOK(totalForActive)} kr</div>
        )}
      </div>
      <div className="mt-2 px-1 text-xs text-muted-foreground">
        Summen viser totale kostnader for alle hester i valgt måned.
      </div>
      
    </div>
  );
}
