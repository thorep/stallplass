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
};

export default function AddExpenseSheet({ open, onOpenChange, mode, initialValue, onSubmit, daysInMonth = 31, contextMonth, occurrenceCount = 0, hasOverride = false, onOverrideSave, onOverrideDelete }: Props) {
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
  const [overrideMode, setOverrideMode] = useState<"per_occ" | "monthly_sum">("per_occ");
  const [overrideValue, setOverrideValue] = useState("");
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
      setOverrideMode("per_occ");
      setOverrideValue("");
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
      setOverrideMode("per_occ");
      setOverrideValue("");
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
          <Input
            placeholder="Beløp"
            inputMode="numeric"
            pattern="[0-9]*"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
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
              <div className="inline-flex rounded-full border p-0.5 mb-2" role="tablist" aria-label="Overstyringsmodus">
                {[
                  { k: "per_occ" as const, l: "Per forekomst" },
                  { k: "monthly_sum" as const, l: "Månedssum" },
                ].map((o) => (
                  <button
                    key={o.k}
                    type="button"
                    role="tab"
                    aria-selected={overrideMode === o.k}
                    className={`h-8 px-3 text-sm rounded-full ${overrideMode === o.k ? "bg-secondary" : "hover:bg-muted"}`}
                    onClick={() => setOverrideMode(o.k)}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Beløp</span>
                <input
                  className="h-9 rounded-md border bg-background px-2 flex-1"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  placeholder={overrideMode === "per_occ" ? "per forekomst" : "sum for måneden"}
                  disabled={overrideMode === "monthly_sum" && occurrenceCount <= 0}
                />
              </div>
              {overrideMode === "monthly_sum" && (
                <div className="text-xs text-muted-foreground mt-1">
                  {occurrenceCount > 0
                    ? (() => {
                        const n = Math.max(1, occurrenceCount);
                        const total = Math.max(0, Math.round(Number(overrideValue || 0)));
                        const per = n > 0 ? Math.round(total / n) : 0;
                        return `Fordelt på ${n} forekomster ≈ ${per} kr per forekomst (avrundet)`;
                      })()
                    : "Ingen forekomster denne måneden"}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  onClick={async () => {
                    if (!onOverrideSave || !contextMonth) return;
                    if (skipMonth) {
                      await onOverrideSave({ month: contextMonth, skip: true, overrideAmount: null });
                      return;
                    }
                    const raw = Math.round(Number(overrideValue || 0));
                    const per = overrideMode === "monthly_sum"
                      ? (occurrenceCount > 0 ? Math.round(raw / Math.max(1, occurrenceCount)) : raw)
                      : raw;
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
