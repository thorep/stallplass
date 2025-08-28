"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RecurrencePicker from "./RecurrencePicker";
import { useEffect, useMemo, useState } from "react";

type InitialValue = {
  title: string;
  amount: number;
  category: string;
  date?: string; // DD
  emoji?: string | null;
  recurrence?: { type: "none" | "monthly" | "weekly"; day?: string; intervalWeeks?: number; weekday?: number };
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initialValue?: InitialValue;
  onSubmit: (payload: {
    title: string;
    amount: number;
    category: string;
    day?: string; // for monthly
    isRecurring?: boolean;
    intervalMonths?: number | null;
    emoji?: string | null;
    // weekly extras (UI only)
    recurrenceType?: "none" | "monthly" | "weekly";
    intervalWeeks?: number;
    weekday?: number; // 1-7
  }) => Promise<void> | void;
  daysInMonth?: number;
  // Month override (edit-only)
  contextMonth?: string; // YYYY-MM
  occurrenceCount?: number;
  hasOverride?: boolean;
  onOverrideSave?: (data: { month: string; overrideAmount?: number | null; skip?: boolean }) => Promise<void> | void;
  onOverrideDelete?: () => Promise<void> | void;
  // Update all (edit-only): change base amount for the recurring item going forward/backward
  onUpdateAll?: (amount: number) => Promise<void> | void;
};

export default function AddExpenseSheet({ open, onOpenChange, mode, initialValue, onSubmit, daysInMonth = 31, contextMonth, occurrenceCount = 0, hasOverride = false, onOverrideSave, onOverrideDelete, onUpdateAll }: Props) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Annet");
  const [emoji, setEmoji] = useState<string | undefined>(undefined);
  const [recurrence, setRecurrence] = useState<"none" | "monthly" | "weekly">("none");
  const [day, setDay] = useState<string>("");
  const [intervalWeeks, setIntervalWeeks] = useState<number>(1);
  const [weekday, setWeekday] = useState<number>(1);
  // Month override state (edit-only)
  const [skipMonth, setSkipMonth] = useState(false);
  const [overrideValue, setOverrideValue] = useState(""); // sum for the month (we'll distribute if multiple occ)
  // Update-all state (edit-only)
  const [allAmountValue, setAllAmountValue] = useState("");
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => String(i + 1)), [daysInMonth]);

  useEffect(() => {
    if (!open) return;
    if (initialValue) {
      setTitle(initialValue.title ?? "");
      setAmount(initialValue.amount != null ? String(initialValue.amount) : "");
      setCategory(initialValue.category ?? "Annet");
      setEmoji(initialValue.emoji ?? undefined);
      const recType = initialValue.recurrence?.type ?? "none";
      setRecurrence(recType);
      setDay(initialValue.recurrence?.day || initialValue.date || "");
      setIntervalWeeks(initialValue.recurrence?.intervalWeeks || 1);
      setWeekday(initialValue.recurrence?.weekday || 1);
      setSkipMonth(false);
      setOverrideValue("");
      setAllAmountValue(initialValue.amount != null ? String(initialValue.amount) : "");
    } else {
      setTitle("");
      setAmount("");
      setCategory("Annet");
      setEmoji(undefined);
      setRecurrence("none");
      setDay("");
      setIntervalWeeks(1);
      setWeekday(1);
      setSkipMonth(false);
      setOverrideValue("");
      setAllAmountValue("");
    }
  }, [open, initialValue]);

  const submit = async () => {
    const numericAmount = Math.round(Number(amount || 0));
    await onSubmit({
      title,
      amount: numericAmount,
      category,
      day: day || undefined,
      isRecurring: recurrence !== "none" ? true : undefined,
      intervalMonths: recurrence === "monthly" ? 1 : null,
      emoji,
      recurrenceType: recurrence,
      intervalWeeks: recurrence === "weekly" ? intervalWeeks : undefined,
      weekday: recurrence === "weekly" ? weekday : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="fixed left-1/2 bottom-0 top-auto translate-x-[-50%] translate-y-0 w-full max-w-screen-sm rounded-t-2xl border p-0 shadow-lg"
      >
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>{mode === "create" ? "Legg til utgift" : "Rediger utgift"}</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-24 space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Velg emoji"
              className="h-10 w-10 flex items-center justify-center rounded-full border bg-background text-xl"
              onClick={() => {
                const e = prompt("Emoji");
                if (e) setEmoji(e);
              }}
            >
              {emoji ?? "+"}
            </button>
            <Input placeholder="Tittel" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex items-center">
            <div className="relative w-full">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
              <Input
                aria-label="Beløp i kroner"
                placeholder="Beløp"
                inputMode="numeric"
                pattern="[0-9]*"
                className="pl-8"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <Input placeholder="Kategori" value={category} onChange={(e) => setCategory(e.target.value)} />
          <RecurrencePicker
            value={recurrence}
            onChange={setRecurrence}
            anchorDay={day}
            onAnchorDayChange={setDay}
            days={days}
            intervalWeeks={intervalWeeks}
            onIntervalWeeksChange={setIntervalWeeks}
            weekday={weekday}
            onWeekdayChange={setWeekday}
          />

          {mode === "edit" && contextMonth && (
            <div className="mt-2 pt-2 border-t">
              <div className="text-sm font-medium">Denne måneden</div>
              <div className="text-xs text-muted-foreground mb-2">
                Gjelder kun {new Date(parseInt(contextMonth.slice(0, 4)), parseInt(contextMonth.slice(5, 7)) - 1, 1).toLocaleDateString("nb-NO", { month: "long", year: "numeric" })}
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="text-sm">Hopp over denne måneden</div>
                <input
                  aria-label="Hopp over denne måneden"
                  type="checkbox"
                  className="h-5 w-5"
                  checked={skipMonth}
                  onChange={(e) => setSkipMonth(e.target.checked)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Endre summen (denne måneden)</span>
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                  <Input
                    aria-label="Sum denne måneden i kroner"
                    className="pl-8"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    placeholder="sum for måneden"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  onClick={async () => {
                    if (!onOverrideSave || !contextMonth) return;
                    if (skipMonth) {
                      await onOverrideSave({ month: contextMonth, skip: true, overrideAmount: null });
                      return;
                    }
                    const total = Math.round(Number(overrideValue || 0));
                    const per = occurrenceCount > 0 ? Math.round(total / Math.max(1, occurrenceCount)) : total;
                    await onOverrideSave({ month: contextMonth, overrideAmount: isFinite(per) ? per : 0 });
                  }}
                >
                  Lagre månedsoverstyring
                </Button>
                {hasOverride && (
                  <Button variant="destructive" type="button" onClick={() => onOverrideDelete?.()}>
                    Fjern overstyring
                  </Button>
                )}
              </div>
              <div className="mt-6 pt-3 border-t">
                <div className="text-sm font-medium mb-2">Endre alle</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Ny sum (alle måneder)</span>
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                    <Input
                      aria-label="Ny sum i kroner (alle måneder)"
                      className="pl-8"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={allAmountValue}
                      onChange={(e) => setAllAmountValue(e.target.value)}
                      placeholder="sum per forekomst"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      if (!onUpdateAll) return;
                      const n = Math.round(Number(allAmountValue || 0));
                      await onUpdateAll(isFinite(n) ? n : 0);
                    }}
                  >
                    Lagre for alle
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 left-0 right-0 border-t bg-background px-4 py-3 flex justify-end gap-2 rounded-b-2xl">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={submit}>Lagre</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
