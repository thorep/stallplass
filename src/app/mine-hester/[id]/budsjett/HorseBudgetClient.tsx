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
import { FeedbackLink } from "@/components/ui/feedback-link";
import {
  createBudgetItemAction,
  updateBudgetItemAction,
  deleteBudgetItemAction,
  upsertBudgetOverrideAction,
  deleteBudgetOverrideAction
} from "@/app/actions/budget";
import { usePostHogEvents } from "@/hooks/usePostHogEvents";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";


interface BudgetItem {
  budgetItemId: string;
  title: string;
  amount: number;
  baseAmount: number;
  category: string;
  day: number;
  month: string;
  emoji?: string | null;
  isRecurring: boolean;
  hasOverride: boolean;
}

interface BudgetMonth {
  month: string;
  total: number;
  items: BudgetItem[];
}

interface HorseBudgetClientProps {
  horseId: string;
  budgetData: { months: BudgetMonth[] };
  currentMonth: string;
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
  if (CATEGORY_META[name]) return CATEGORY_META[name];
  const key = Object.keys(CATEGORY_META).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? CATEGORY_META[key] : CATEGORY_META["Annet"];
}

function getYear(ym: string) {
  return parseInt(ym.split("-")[0]!, 10);
}

function toYM(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

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

export default function HorseBudgetClient({
  horseId,
  budgetData,
  currentMonth: initialCurrentMonth
}: HorseBudgetClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentMonth, setCurrentMonth] = useState(initialCurrentMonth);
  const [isPending, startTransition] = useTransition();
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

  // Update currentMonth when search params change
  useEffect(() => {
    const m = searchParams?.get("m");
    if (m && /^\d{4}-\d{2}$/.test(m)) {
      setCurrentMonth(m);
    }
  }, [searchParams]);

  const months = budgetData?.months || [];
  const thisMonth = months.find((m) => m.month === currentMonth);

  const openEditDialog = async (itemId: string) => {
    try {
      // For now, we'll use a simple approach - in a full migration we'd fetch item details
      // For simplicity, we'll just open the edit dialog with basic info
      const occs = thisMonth?.items.filter((x) => x.budgetItemId === itemId) || [];
      const occurrenceCount = occs.length;
      const hasOverride = occs.some((x) => x.hasOverride);

      setSheet({
        open: true,
        mode: "edit",
        itemId,
        initial: {
          title: occs[0]?.title ?? "",
          amount: occs[0]?.baseAmount ?? 0,
          category: occs[0]?.category ?? "Annet",
          date: String(occs[0]?.day ?? ""),
          emoji: occs[0]?.emoji ?? null,
          recurrence: occs[0]?.isRecurring
            ? { type: "monthly", day: String(occs[0]?.day ?? "") }
            : { type: "none" },
        },
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

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('title', payload.title);
        formData.append('category', payload.category || "Annet");
        formData.append('amount', String(payload.amount));
        formData.append('startMonth', currentMonth);

        if (payload.isRecurring || payload.recurrenceType !== "none") {
          formData.append('isRecurring', 'true');
          if (payload.recurrenceType === "weekly") {
            formData.append('intervalWeeks', String(payload.intervalWeeks || 1));
            formData.append('weekday', String(payload.weekday || 1));
          } else {
            formData.append('intervalMonths', '1');
          }
        }

        if (payload.day) {
          formData.append('anchorDay', payload.day);
        }

        if (payload.emoji) {
          formData.append('emoji', payload.emoji);
        }

        if (sheet.mode === "create") {
          await createBudgetItemAction(horseId, formData);
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
          await updateBudgetItemAction(horseId, sheet.itemId, formData);
          ph.custom("budget_item_updated", { horse_id: horseId, budget_item_id: sheet.itemId });
          toast.success("Lagret");
        }
        setSheet({ open: false, mode: "create" });
        // Refresh the page to get updated data
        router.refresh();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Noe gikk galt";
        toast.error(msg);
      }
    });
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

        {thisMonth && (
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
                      <Button
                        onClick={() => setSheet({ open: true, mode: "create" })}
                        data-cy="add-expense-button"
                      >
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
                          onDelete={() => setDeleteDialog({ open: true, itemId: it.budgetItemId, title: it.title })}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-4 border-t pt-3">
                    <Button
                      className="w-full"
                      onClick={() => setSheet({ open: true, mode: "create" })}
                      data-cy="add-expense-button"
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
              await upsertBudgetOverrideAction(horseId, sheet.itemId, month, overrideAmount, skip);
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
              router.refresh();
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : "Kunne ikke lagre overstyring";
              toast.error(msg);
            }
          }}
          onOverrideDelete={async () => {
            if (!sheet.itemId) return;
            try {
              await deleteBudgetOverrideAction(horseId, sheet.itemId, currentMonth);
              ph.custom("budget_override_delete", {
                horse_id: horseId,
                budget_item_id: sheet.itemId,
                month: currentMonth,
              });
              toast.success("Overstyring fjernet");
              router.refresh();
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : "Kunne ikke fjerne overstyring";
              toast.error(msg);
            }
          }}
          onUpdateAll={async (amount) => {
            if (!sheet.itemId) return;
            try {
              const formData = new FormData();
              formData.append('amount', String(amount));
              await updateBudgetItemAction(horseId, sheet.itemId, formData);
              ph.custom("budget_amount_changed_all", {
                horse_id: horseId,
                budget_item_id: sheet.itemId,
                old_amount: sheet.initial?.amount,
                new_amount: amount,
              });
              toast.success("Oppdatert for alle måneder");
              router.refresh();
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
              disabled={isPending}
              onClick={async () => {
                const id = deleteDialog.itemId;
                if (!id) return;
                startTransition(async () => {
                  try {
                    await deleteBudgetItemAction(horseId, id);
                    ph.custom("budget_item_deleted", { horse_id: horseId, budget_item_id: id });
                    setDeleteDialog({ open: false });
                    toast.success("Utgift slettet.");
                    router.refresh();
                  } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : "Kunne ikke slette";
                    toast.error(msg);
                  }
                });
              }}
            >
              {isPending ? "Sletter..." : "Slett"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}