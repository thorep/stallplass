"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
 
import {
  useBudgetRange,
  useCreateBudgetItem,
  useDeleteBudgetItem,
  useUpdateBudgetItem,
  type BudgetMonth,
} from "@/hooks/useHorseBudget";
import { usePostHogEvents } from "@/hooks/usePostHogEvents";
import { Loader2 } from "lucide-react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import MonthHeader from "@/components/budget/MonthHeader";
import BudgetDayGroup from "@/components/budget/BudgetDayGroup";
import AddExpenseSheet from "@/components/budget/AddExpenseSheet";

function ymNow(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function addMonths(ym: string, delta: number) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("nb-NO", { month: "long", year: "numeric" });
}

function formatNOK(n: number) {
  return new Intl.NumberFormat("nb-NO").format(n);
}

function daysInMonth(ym: string) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  return new Date(y, m, 0).getDate();
}

const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  Stallleie: { emoji: "🏠", color: "bg-violet-100 text-violet-700" },
  Fôr: { emoji: "🥣", color: "bg-amber-100 text-amber-700" },
  Høy: { emoji: "🌾", color: "bg-lime-100 text-lime-700" },
  Hovslager: { emoji: "🧰", color: "bg-slate-100 text-slate-700" },
  Vet: { emoji: "🩺", color: "bg-rose-100 text-rose-700" },
  Forsikring: { emoji: "🛡️", color: "bg-sky-100 text-sky-700" },
  Utstyr: { emoji: "🎒", color: "bg-indigo-100 text-indigo-700" },
  Transport: { emoji: "🚚", color: "bg-teal-100 text-teal-700" },
  Trening: { emoji: "🏋️", color: "bg-emerald-100 text-emerald-700" },
  Konkurranse: { emoji: "🏆", color: "bg-yellow-100 text-yellow-700" },
  Annet: { emoji: "🐴", color: "bg-gray-100 text-gray-700" },
};

function getCategoryMeta(name?: string) {
  if (!name) return CATEGORY_META["Annet"];
  // Try exact, else case-insensitive match by keys, else default
  if (CATEGORY_META[name]) return CATEGORY_META[name];
  const key = Object.keys(CATEGORY_META).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? CATEGORY_META[key] : CATEGORY_META["Annet"];
}

function getYear(ym: string) {
  return parseInt(ym.split("-")[0]!, 10);
}
function getMonth(ym: string) {
  return parseInt(ym.split("-")[1]!, 10);
}

function toYM(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// prevMonth/nextMonth helpers removed; month navigation via chips

// Month chips helper
function monthChipsForYear(ym: string) {
  const y = getYear(ym);
  return Array.from({ length: 12 }, (_, i) => {
    const key = toYM(y, i + 1);
    const date = new Date(y, i, 1);
    const label = date.toLocaleDateString("nb-NO", { month: "short" });
    return { key, label };
  });
}

export default function HorseBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const horseId = params.id as string;
  const [currentMonth, setCurrentMonth] = useState(ymNow());

  // Initialize from query param ?m=YYYY-MM if present
  useEffect(() => {
    const m = searchParams?.get("m");
    if (m && /^\d{4}-\d{2}$/.test(m)) {
      setCurrentMonth(m);
    }
  }, [searchParams]);

  const from = currentMonth; // load ahead 11 months for snappy nav
  const to = addMonths(currentMonth, 11);
  const budgetQuery = useBudgetRange(horseId, from, to);
  const { data, isLoading, error, refetch } = budgetQuery;

  const createItem = useCreateBudgetItem();
  const updateItem = useUpdateBudgetItem();
  const deleteItem = useDeleteBudgetItem();
  const ph = usePostHogEvents();

  const [sort, setSort] = useState<"date" | "amount" | "category">("date");
  const [sheet, setSheet] = useState<{
    open: boolean;
    mode: "create" | "edit";
    itemId?: string;
    initial?: {
      title: string;
      amount: number;
      category: string;
      date?: string;
      emoji?: string | null;
      recurrence?: { type: "none" | "monthly"; day?: string };
    };
  }>({ open: false, mode: "create" });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    itemId?: string;
    title?: string;
  }>({ open: false });

  const months = data?.months || [];

  const thisMonth: BudgetMonth | undefined = months.find((m) => m.month === currentMonth);
  // Optionally compare with previous month if needed later

  // Inline override editing removed from UI

  const openEditDialog = async (itemId: string) => {
    try {
      // Lightweight fetch of item details
      const res = await fetch(`/api/horses/${horseId}/budget/items/${itemId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Kunne ikke hente");
      const item = await res.json();
      setSheet({
        open: true,
        mode: "edit",
        itemId,
        initial: {
          title: item.title ?? "",
          amount: item.amount ?? 0,
          category: item.category ?? "Annet",
          date: item.anchorDay ? String(item.anchorDay) : "",
          emoji: item.emoji ?? null,
          recurrence: item.isRecurring ? { type: "monthly", day: item.anchorDay ? String(item.anchorDay) : undefined } : { type: "none" },
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Kunne ikke åpne redigering";
      toast.error(msg);
      setSheet({ open: false, mode: "create" });
    }
  };
  
  const onSubmitSheet = async (payload: {
    title: string;
    amount: number;
    category: string;
    day?: string;
    isRecurring?: boolean;
    intervalMonths?: number | null;
    emoji?: string | null;
  }) => {
    if (!payload.title || (payload.amount || 0) <= 0) {
      toast.error("Fyll inn tittel og beløp");
      return;
    }
    try {
      if (sheet.mode === "create") {
        await createItem.mutateAsync({
          horseId,
          data: {
            title: payload.title,
            category: payload.category || "Annet",
            amount: payload.amount,
            isRecurring: payload.isRecurring,
            startMonth: currentMonth,
            intervalMonths: payload.isRecurring ? 1 : null,
            emoji: payload.emoji || undefined,
            anchorDay: payload.day ? Number(payload.day) : undefined,
          },
        });
        ph.custom("budget_item_created", {
          horse_id: horseId,
          type: payload.isRecurring ? "recurring" : "oneoff",
          category: payload.category,
          amount: payload.amount,
          start_month: currentMonth,
          interval: payload.isRecurring ? 1 : undefined,
          emoji: payload.emoji || undefined,
          day: payload.day || undefined,
        });
        toast.success("Lagt til i budsjett");
      } else if (sheet.mode === "edit" && sheet.itemId) {
        await updateItem.mutateAsync({
          horseId,
          itemId: sheet.itemId,
          data: {
            title: payload.title,
            category: payload.category,
            amount: payload.amount,
            anchorDay: payload.day ? Number(payload.day) : undefined,
            emoji: payload.emoji || null,
            isRecurring: !!payload.isRecurring,
            intervalMonths: payload.isRecurring ? 1 : null,
          },
        });
        ph.custom("budget_item_updated", { horse_id: horseId, budget_item_id: sheet.itemId });
        toast.success("Lagret");
      }
      setSheet({ open: false, mode: "create" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Noe gikk galt";
      toast.error(msg);
    }
  };

  return (
    <>
      <div className="space-y-4 pb-[env(safe-area-inset-bottom)]">
        <MonthHeader
          monthLabel={monthLabel(currentMonth)}
          totalLabel={`Totalt ${monthLabel(currentMonth)}`}
          totalAmount={`${formatNOK(thisMonth?.total || 0)} kr`}
          months={monthChipsForYear(currentMonth)}
          activeMonthKey={currentMonth}
          onMonthChange={(v) => {
            if (v === currentMonth) return;
            ph.custom("budget_month_changed", { horse_id: horseId, from_month: currentMonth, to_month: v });
            setCurrentMonth(v);
            const sp = new URLSearchParams(Array.from(searchParams?.entries() || []));
            sp.set("m", v);
            router.replace(`${pathname}?${sp.toString()}`);
          }}
          sort={sort}
          onSortChange={(v) => setSort(v)}
        />

        {isLoading && (
          <div className="px-2 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-2xl border animate-pulse bg-muted/40" />
            ))}
          </div>
        )}

        {error && (
          <div className="py-8 text-center">
            <div className="text-2xl">⚠️</div>
            <div className="mt-1 font-medium text-red-700">Kunne ikke laste utgifter</div>
            <div className="text-sm text-gray-600 mt-1">Noe gikk galt. Sjekk internettforbindelsen eller prøv igjen.</div>
            <div className="mt-3">
              <Button onClick={() => refetch?.()}>Prøv igjen</Button>
            </div>
          </div>
        )}

        {!isLoading && thisMonth && (
          <div className="px-2">
            {(() => {
              const sorted = [...thisMonth.items].sort((a, b) => {
                if (sort === "amount") return b.amount - a.amount;
                if (sort === "category") return a.category.localeCompare(b.category);
                return a.day - b.day;
              });
              const groups: Record<number, typeof sorted> = {} as any;
              for (const it of sorted) {
                groups[it.day] = groups[it.day] || [];
                groups[it.day].push(it);
              }
              const days = Object.keys(groups)
                .map((d) => parseInt(d, 10))
                .sort((a, b) => a - b);
              if (days.length === 0) {
                return (
                  <div className="p-6 text-center text-muted-foreground">
                    <div className="text-2xl">📭</div>
                    <div className="mt-1 font-medium">Ingen utgifter i {monthLabel(currentMonth)} ennå</div>
                    <div className="mt-3">
                      <Button onClick={() => setSheet({ open: true, mode: "create" })}>Legg til utgift</Button>
                    </div>
                  </div>
                );
              }
              const groupsJsx = days.map((day) => {
                const list = groups[day]!;
                const subtotal = list.filter((x) => !x.skipped).reduce((s, x) => s + x.amount, 0);
                const dayStr = String(day).padStart(2, "0");
                const monthStr = currentMonth.split("-")[1];
                return (
                  <BudgetDayGroup
                    key={day}
                    dateLabel={`${dayStr}.${monthStr}`}
                    subtotal={`${formatNOK(subtotal)} kr`}
                    showSubtotal={days.length > 1}
                    onPress={(id) => openEditDialog(id)}
                    onDelete={(id) => setDeleteDialog({ open: true, itemId: id })}
                    items={list.map((it) => ({
                      id: it.budgetItemId,
                      title: it.title,
                      dateLabel: `${dayStr}.${monthStr}`,
                      category: it.category,
                      amountLabel: `${formatNOK(it.amount)} kr`,
                      icon: (it.emoji ?? getCategoryMeta(it.category).emoji) as any,
                    }))}
                  />
                );
              });
              return (
                <>
                  {groupsJsx}
                  <div className="mt-4 border-t pt-3 px-1">
                    <Button className="w-full" onClick={() => setSheet({ open: true, mode: "create" })}>
                      Legg til utgift
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Add/Edit Sheet */}
        <AddExpenseSheet
          open={sheet.open}
          onOpenChange={(v) => setSheet((s) => ({ ...s, open: v }))}
          mode={sheet.mode}
          initialValue={sheet.initial as any}
          onSubmit={onSubmitSheet}
          daysInMonth={daysInMonth(currentMonth)}
        />
      </div>

      {/* Delete confirm dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((s) => ({ ...s, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slette utgift?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">Dette kan ikke angres.</div>
          <DialogFooter className="justify-between">
            <DialogClose asChild>
              <Button variant="ghost">Avbryt</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={async () => {
                const id = deleteDialog.itemId;
                if (!id) return;
                try {
                  const res = await fetch(`/api/horses/${horseId}/budget/items/${id}`, { credentials: "include" });
                  const snapshot = res.ok ? await res.json() : null;
                  await deleteItem.mutateAsync({ horseId, itemId: id });
                  setDeleteDialog({ open: false });
                  toast.success(
                    "Utgift slettet.",
                    snapshot
                      ? {
                          action: {
                            label: "Angre",
                            onClick: async () => {
                              try {
                                await createItem.mutateAsync({ horseId, data: snapshot });
                              } catch {}
                            },
                          },
                          duration: 6000,
                        }
                      : { duration: 4000 }
                  );
                } catch (e: unknown) {
                  const msg = e instanceof Error ? e.message : "Kunne ikke slette";
                  toast.error(msg);
                }
              }}
            >
              Slett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
