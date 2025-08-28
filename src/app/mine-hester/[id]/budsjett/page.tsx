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

import AddExpenseSheet from "@/components/budget/AddExpenseSheet";
import BudgetListItem from "@/components/budget/BudgetListItem";
import MonthHeader from "@/components/budget/MonthHeader";
import {
  useBudgetRange,
  useCreateBudgetItem,
  useDeleteBudgetItem,
  useDeleteOverride,
  useUpdateBudgetItem,
  useUpsertOverride,
  type BudgetMonth,
} from "@/hooks/useHorseBudget";
import { usePostHogEvents } from "@/hooks/usePostHogEvents";
import { FeedbackLink } from "@/components/ui/feedback-link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function ymNow(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

// addMonths helper is unused here (range handled elsewhere)

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

// (weekly helper functions no longer needed client-side)

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
// getMonth helper unused

function toYM(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// prevMonth/nextMonth helpers removed; month navigation via chips

// Month chips helper
function monthChipsAcrossFiveYears(ym: string) {
  const y = getYear(ym);
  const list: { key: string; label: string }[] = [];
  for (let yr = y; yr < y + 5; yr++) {
    for (let i = 1; i <= 12; i++) {
      const key = toYM(yr, i);
      list.push({
        key,
        label: new Date(yr, i - 1, 1).toLocaleDateString("nb-NO", { month: "short" }),
      });
    }
  }
  return list;
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

  const curYear = getYear(currentMonth);
  const from = `${curYear}-01`; // start of current year
  const to = `${curYear + 4}-12`; // through end of +4y (5-year window)
  const budgetQuery = useBudgetRange(horseId, from, to);
  const { data, isLoading, error, refetch } = budgetQuery;

  const createItem = useCreateBudgetItem();
  const updateItem = useUpdateBudgetItem();
  const deleteItem = useDeleteBudgetItem();
  const upsertOverride = useUpsertOverride();
  const deleteOverride = useDeleteOverride();
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
      recurrence?:
        | { type: "none" }
        | { type: "monthly"; day?: string }
        | { type: "weekly"; intervalWeeks?: number; weekday?: number };
    };
    occurrenceCount?: number;
    hasOverride?: boolean;
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
      const occs = thisMonth?.items.filter((x) => x.budgetItemId === itemId) || [];
      const occurrenceCount = occs.length;
      const hasOverride = occs.some((x) => x.hasOverride);
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
          recurrence: item.isRecurring
            ? item.intervalWeeks && item.weekday
              ? { type: "weekly", intervalWeeks: item.intervalWeeks, weekday: item.weekday }
              : { type: "monthly", day: item.anchorDay ? String(item.anchorDay) : undefined }
            : { type: "none" },
        },
        // store some extra context on the sheet state via type cast
        // we'll pass as props to AddExpenseSheet below
        occurrenceCount,
        hasOverride,
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
    recurrenceType?: "none" | "monthly" | "weekly";
    intervalWeeks?: number;
    weekday?: number;
  }) => {
    if (!payload.title || (payload.amount || 0) <= 0) {
      toast.error("Fyll inn tittel og beløp");
      return;
    }
    try {
      if (sheet.mode === "create") {
        const isWeekly = payload.recurrenceType === "weekly" && (payload.intervalWeeks || 1) >= 1;
        await createItem.mutateAsync({
          horseId,
          data: {
            title: payload.title,
            category: payload.category || "Annet",
            amount: payload.amount,
            isRecurring: payload.isRecurring || isWeekly,
            startMonth: currentMonth,
            intervalMonths: payload.isRecurring && !isWeekly ? 1 : null,
            intervalWeeks: isWeekly ? payload.intervalWeeks || 1 : null,
            weekday: isWeekly ? payload.weekday || 1 : null,
            emoji: payload.emoji || undefined,
            anchorDay: payload.day ? Number(payload.day) : undefined,
          },
        });
        ph.custom("budget_item_created", {
          horse_id: horseId,
          type: payload.recurrenceType || (payload.isRecurring ? "recurring" : "oneoff"),
          category: payload.category,
          amount: payload.amount,
          start_month: currentMonth,
          interval:
            payload.recurrenceType === "weekly"
              ? payload.intervalWeeks
              : payload.isRecurring
              ? 1
              : undefined,
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
            isRecurring: payload.recurrenceType !== "none" || !!payload.isRecurring,
            intervalMonths: payload.recurrenceType === "monthly" ? 1 : null,
            intervalWeeks: payload.recurrenceType === "weekly" ? payload.intervalWeeks || 1 : null,
            weekday: payload.recurrenceType === "weekly" ? payload.weekday || 1 : null,
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
          months={monthChipsAcrossFiveYears(currentMonth)}
          activeMonthKey={currentMonth}
          onMonthChange={(v) => {
            if (v === currentMonth) return;
            ph.custom("budget_month_changed", {
              horse_id: horseId,
              from_month: currentMonth,
              to_month: v,
            });
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
            <div className="text-sm text-gray-600 mt-1">
              Noe gikk galt. Sjekk internettforbindelsen eller prøv igjen.
            </div>
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
              if (sorted.length === 0) {
                return (
                  <div className="p-6 text-center text-muted-foreground">
                    <div className="text-2xl">📭</div>
                    <div className="mt-1 font-medium">
                      Ingen utgifter i {monthLabel(currentMonth)} ennå
                    </div>
                    <div className="mt-3">
                      <Button onClick={() => setSheet({ open: true, mode: "create" })}>
                        Legg til utgift
                      </Button>
                    </div>
                  </div>
                );
              }
              const monthStr = currentMonth.split("-")[1];
              return (
                <>
                  <div className="space-y-1">
                    {sorted.map((it) => {
                      const dayStr = String(it.day).padStart(2, "0");
                      return (
                        <BudgetListItem
                          key={`${it.budgetItemId}-${it.month}-${it.day}`}
                          title={it.title}
                          date={`${dayStr}.${monthStr}`}
                          category={it.category}
                          amount={`${formatNOK(it.amount)} kr`}
                          icon={it.emoji ?? getCategoryMeta(it.category).emoji}
                          hasOverride={it.hasOverride}
                          isRecurring={it.isRecurring}
                          onPress={() => openEditDialog(it.budgetItemId)}
                          onDelete={() => setDeleteDialog({ open: true, itemId: it.budgetItemId })}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-4 border-t pt-3">
                    <Button
                      className="w-full"
                      onClick={() => setSheet({ open: true, mode: "create" })}
                    >
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
          initialValue={sheet.initial}
          onSubmit={onSubmitSheet}
          daysInMonth={daysInMonth(currentMonth)}
          contextMonth={currentMonth}
          occurrenceCount={sheet.occurrenceCount ?? 0}
          hasOverride={sheet.hasOverride ?? false}
          onOverrideSave={async ({ month, overrideAmount, skip }) => {
            if (!sheet.itemId) return;
            try {
              await upsertOverride.mutateAsync({
                horseId,
                data: { budgetItemId: sheet.itemId, month, overrideAmount, skip },
              });
              if (skip) {
                ph.custom("budget_item_skipped_month", {
                  horse_id: horseId,
                  budget_item_id: sheet.itemId,
                  month,
                });
              } else {
                ph.custom("budget_override_upsert", {
                  horse_id: horseId,
                  budget_item_id: sheet.itemId,
                  month,
                  override_amount_per_occ: overrideAmount ?? undefined,
                  occurrences: sheet.occurrenceCount ?? undefined,
                  override_amount_total:
                    overrideAmount != null && (sheet.occurrenceCount ?? 0) > 0
                      ? (overrideAmount as number) * (sheet.occurrenceCount as number)
                      : undefined,
                });
              }
              toast.success("Månedsoverstyring lagret");
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : "Kunne ikke lagre overstyring";
              toast.error(msg);
            }
          }}
          onOverrideDelete={async () => {
            if (!sheet.itemId) return;
            try {
              await deleteOverride.mutateAsync({
                horseId,
                data: { budgetItemId: sheet.itemId, month: currentMonth },
              });
              ph.custom("budget_override_delete", {
                horse_id: horseId,
                budget_item_id: sheet.itemId,
                month: currentMonth,
              });
              toast.success("Overstyring fjernet");
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : "Kunne ikke fjerne overstyring";
              toast.error(msg);
            }
          }}
          onUpdateAll={async (amount) => {
            if (!sheet.itemId) return;
            try {
              await updateItem.mutateAsync({ horseId, itemId: sheet.itemId, data: { amount } });
              ph.custom("budget_amount_changed_all", {
                horse_id: horseId,
                budget_item_id: sheet.itemId,
                old_amount: sheet.initial?.amount,
                new_amount: amount,
              });
              toast.success("Oppdatert for alle måneder");
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : "Kunne ikke oppdatere";
              toast.error(msg);
            }
          }}
        />

        {/* Feedback */}
        <div className="pt-2 text-center">
          <FeedbackLink />
        </div>
      </div>

      {/* Delete confirm dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((s) => ({ ...s, open }))}
      >
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
                  const res = await fetch(`/api/horses/${horseId}/budget/items/${id}`, {
                    credentials: "include",
                  });
                  const snapshot = res.ok ? await res.json() : null;
                  await deleteItem.mutateAsync({ horseId, itemId: id });
                  ph.custom("budget_item_deleted", { horse_id: horseId, budget_item_id: id });
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
