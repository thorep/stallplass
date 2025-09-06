"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function ymNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("nb-NO", { month: "long", year: "numeric" });
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

interface BudgetOverviewAllHorsesProps {
  initialData?: { months: { month: string; total: number }[] };
  activeMonth?: string;
}

export default function BudgetOverviewAllHorses({ initialData, activeMonth }: BudgetOverviewAllHorsesProps) {
  const router = useRouter();
  const [active, setActive] = useState(activeMonth || ymNow());

  // Use server-side loaded data directly
  const months = initialData?.months || [];
  const totalForActive = months.find((m) => m.month === active)?.total || 0;

  return (
    <div className="rounded-2xl border p-3">
      <div className="flex items-baseline justify-between px-1">
        <div className="text-sm font-semibold">Budsjett (alle hester)</div>
        <div className="text-xs text-muted-foreground">{monthLabel(active)}</div>
      </div>
      <div className="mt-2 px-1">
        {/* Mobile: Pill layout */}
        <div className="md:hidden flex items-center justify-center bg-muted rounded-full px-4 py-2">
          <button
            onClick={() => {
              const prevMonth = addMonths(active, -1);
              if (months.some(m => m.month === prevMonth)) {
                setActive(prevMonth);
                router.push(`/mine-hester?month=${prevMonth}`);
              }
            }}
            className="p-1 rounded-md hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!months.some(m => m.month === addMonths(active, -1))}
            aria-label="Forrige måned"
          >
            ←
          </button>
          <span className="mx-4 text-sm font-medium">{monthLabel(active)}</span>
          <button
            onClick={() => {
              const nextMonth = addMonths(active, 1);
              if (months.some(m => m.month === nextMonth)) {
                setActive(nextMonth);
                router.push(`/mine-hester?month=${nextMonth}`);
              }
            }}
            className="p-1 rounded-md hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!months.some(m => m.month === addMonths(active, 1))}
            aria-label="Neste måned"
          >
            →
          </button>
        </div>

        {/* Desktop: Select with arrows */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => {
              const prevMonth = addMonths(active, -1);
              if (months.some(m => m.month === prevMonth)) {
                setActive(prevMonth);
                router.push(`/mine-hester?month=${prevMonth}`);
              }
            }}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!months.some(m => m.month === addMonths(active, -1))}
            aria-label="Forrige måned"
          >
            ←
          </button>

          <select
            value={active}
            onChange={(e) => {
              const newMonth = e.target.value;
              setActive(newMonth);
              router.push(`/mine-hester?month=${newMonth}`);
            }}
            className="flex-1 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none cursor-pointer"
          >
            {months.map((m) => (
              <option key={m.month} value={m.month}>
                {monthLabel(m.month)}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              const nextMonth = addMonths(active, 1);
              if (months.some(m => m.month === nextMonth)) {
                setActive(nextMonth);
                router.push(`/mine-hester?month=${nextMonth}`);
              }
            }}
            className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!months.some(m => m.month === addMonths(active, 1))}
            aria-label="Neste måned"
          >
            →
          </button>
        </div>
      </div>
      <div className="mt-3 px-1">
        <div className="text-2xl font-semibold tabular-nums">{formatNOK(totalForActive)} kr</div>
      </div>
      <div className="mt-2 px-1 text-xs text-muted-foreground">
        Summen viser totale kostnader for alle hester i valgt måned.
      </div>

    </div>
  );
}
