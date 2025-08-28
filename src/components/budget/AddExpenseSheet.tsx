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
  recurrence?: { type: "none" | "monthly"; day?: string };
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
    day?: string;
    isRecurring?: boolean;
    intervalMonths?: number | null;
    emoji?: string | null;
  }) => Promise<void> | void;
  daysInMonth?: number;
};

export default function AddExpenseSheet({ open, onOpenChange, mode, initialValue, onSubmit, daysInMonth = 31 }: Props) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Annet");
  const [emoji, setEmoji] = useState<string | undefined>(undefined);
  const [recurrence, setRecurrence] = useState<"none" | "monthly" | "weekly">("none");
  const [day, setDay] = useState<string>("");
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
    } else {
      setTitle("");
      setAmount("");
      setCategory("Annet");
      setEmoji(undefined);
      setRecurrence("none");
      setDay("");
    }
  }, [open, initialValue]);

  const submit = async () => {
    const numericAmount = Math.round(Number(amount || 0));
    await onSubmit({
      title,
      amount: numericAmount,
      category,
      day: day || undefined,
      isRecurring: recurrence === "monthly" ? true : undefined,
      intervalMonths: recurrence === "monthly" ? 1 : null,
      emoji,
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
          />
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

