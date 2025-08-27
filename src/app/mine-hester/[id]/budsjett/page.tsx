"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useBudgetRange,
  useCreateBudgetItem,
  useDeleteBudgetItem,
  useUpdateBudgetItem,
  type BudgetMonth,
} from "@/hooks/useHorseBudget";
import { usePostHogEvents } from "@/hooks/usePostHogEvents";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, createRef } from "react";
import { toast } from "sonner";

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

function prevMonth(ym: string) {
  const y = getYear(ym);
  const m = getMonth(ym);
  return m === 1 ? toYM(y - 1, 12) : toYM(y, m - 1);
}
function nextMonth(ym: string) {
  const y = getYear(ym);
  const m = getMonth(ym);
  return m === 12 ? toYM(y + 1, 1) : toYM(y, m + 1);
}

function BudgetMonthNav({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const chipsYear = getYear(value);
  const monthsOfYear = useMemo(
    () => Array.from({ length: 12 }, (_, i) => toYM(chipsYear, i + 1)),
    [chipsYear]
  );
  const chipRefs = useMemo(
    () => monthsOfYear.map(() => createRef<HTMLButtonElement>()),
    [monthsOfYear]
  );

  const handleKey = (idx: number, e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (idx + 1) % monthsOfYear.length;
      chipRefs[next].current?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (idx - 1 + monthsOfYear.length) % monthsOfYear.length;
      chipRefs[prev].current?.focus();
    }
  };

  // Year/month Select options: currentYear-2 .. currentYear+2
  const currentYear = chipsYear;
  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => currentYear - 2 + i),
    [currentYear]
  );
  const selectOptions = useMemo(
    () => years.flatMap((y) => Array.from({ length: 12 }, (_, i) => toYM(y, i + 1))),
    [years]
  );

  return (
    <div className="space-y-2">
      {/* Header with icon buttons and center select-trigger */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 w-full">
        <Button
          aria-label="Forrige måned"
          variant="ghost"
          size="icon"
          onClick={() => onChange(prevMonth(value))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex justify-start">
          <Select value={value} onValueChange={(v) => onChange(v)}>
            <SelectTrigger
              aria-label="Velg måned"
              className="w-auto px-3 py-2 rounded-md border bg-white"
            >
              <SelectValue placeholder={monthLabel(value)} />
            </SelectTrigger>
            <SelectContent align="center" className="max-h-80 overflow-auto">
              {years.map((y) => (
                <div key={y} className="py-1">
                  <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-gray-500">
                    {y}
                  </div>
                  {Array.from({ length: 12 }, (_, i) => toYM(y, i + 1)).map((ym) => (
                    <SelectItem key={ym} value={ym}>
                      {monthLabel(ym)}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          aria-label="Neste måned"
          variant="ghost"
          size="icon"
          onClick={() => onChange(nextMonth(value))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Horizontal chip list for the year */}
      <ScrollArea className="w-full -mx-1 px-1">
        <div className="flex gap-2 w-max">
          {monthsOfYear.map((ym, idx) => {
            const active = ym === value;
            return (
              <button
                key={ym}
                ref={chipRefs[idx]}
                onKeyDown={(e) => handleKey(idx, e)}
                aria-label={monthLabel(ym)}
                tabIndex={0}
                className={[
                  "px-3 py-1 rounded-full text-sm whitespace-nowrap border",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#5B4B8A]",
                  active
                    ? "bg-[#5B4B8A] text-white border-[#5B4B8A]"
                    : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50",
                ].join(" ")}
                onClick={() => onChange(ym)}
              >
                {new Date(getYear(ym), getMonth(ym) - 1, 1).toLocaleDateString("nb-NO", {
                  month: "short",
                })}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

type AddFormState = {
  title: string;
  amount: string;
  category: string;
  kind: "oneoff" | "recurring";
  intervalMonths: string; // "1".."12"
  emoji?: string;
  day?: string; // "1".."31"
};

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

  const [form, setForm] = useState<AddFormState>({
    title: "",
    amount: "",
    category: "Annet",
    kind: "oneoff",
    intervalMonths: "1",
    emoji: undefined,
    day: "",
  });
  const [emojiDialogOpen, setEmojiDialogOpen] = useState(false);
  const [customEmoji, setCustomEmoji] = useState("");
  
  const [sort, setSort] = useState<"date" | "amount_asc" | "amount_desc">("date");
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    loading?: boolean;
    itemId?: string;
    form?: { title: string; amount: string; category: string; day?: string; emoji?: string; kind?: 'oneoff' | 'recurring'; intervalMonths?: string };
  }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; itemId?: string; title?: string }>({ open: false });

  const months = data?.months || [];
  
  const thisMonth: BudgetMonth | undefined = months.find((m) => m.month === currentMonth);
  // Optionally compare with previous month if needed later

  // Inline override editing removed from UI

  const openEditDialog = async (itemId: string) => {
    try {
      // Lightweight fetch of item details
      const res = await fetch(`/api/horses/${horseId}/budget/items/${itemId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Kunne ikke hente');
      const item = await res.json();
      setEditDialog({
        open: true,
        loading: false,
        itemId,
        form: {
          title: item.title ?? '',
          amount: String(item.amount ?? ''),
          category: item.category ?? 'Annet',
          day: item.anchorDay ? String(item.anchorDay) : '',
          emoji: item.emoji ?? undefined,
          kind: item.isRecurring ? 'recurring' : 'oneoff',
          intervalMonths: item.intervalMonths ? String(item.intervalMonths) : '1',
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Kunne ikke åpne redigering';
      toast.error(msg);
      setEditDialog({ open: false });
    }
  };

  const saveEditDialog = async () => {
    const f = editDialog.form!;
    try {
      await updateItem.mutateAsync({
        horseId,
        itemId: editDialog.itemId!,
        data: {
          title: f.title,
          category: f.category,
          amount: f.amount ? Number(f.amount) : undefined,
          anchorDay: f.day ? Number(f.day) : undefined,
          emoji: f.emoji || null,
          isRecurring: f.kind === 'recurring' ? true : false,
          intervalMonths: f.kind === 'recurring' ? (f.intervalMonths ? Number(f.intervalMonths) : 1) : null,
        },
      });
      toast.success('Lagret');
      setEditDialog({ open: false });
      ph.custom('budget_item_updated', { horse_id: horseId, budget_item_id: editDialog.itemId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Kunne ikke lagre';
      toast.error(msg);
    }
  };

  const onAdd = async () => {
    const amount = Math.round(Number(form.amount || 0));
    if (!form.title || amount <= 0) {
      toast.error("Fyll inn tittel og beløp");
      return;
    }
    const isRecurring = form.kind === "recurring";
    try {
      await createItem.mutateAsync({
        horseId,
        data: {
          title: form.title,
          category: form.category || "Annet",
          amount,
          isRecurring,
          startMonth: currentMonth,
          intervalMonths: isRecurring ? Number(form.intervalMonths || "1") : null,
          emoji: form.emoji || undefined,
          anchorDay: form.day ? Number(form.day) : undefined,
        },
      });
      ph.custom("budget_item_created", {
        horse_id: horseId,
        type: isRecurring ? "recurring" : "oneoff",
        category: form.category,
        amount,
        start_month: currentMonth,
        interval: isRecurring ? Number(form.intervalMonths || "1") : undefined,
        emoji: form.emoji || undefined,
        day: form.day || undefined,
      });
      setForm({
        title: "",
        amount: "",
        category: form.category,
        kind: form.kind,
        intervalMonths: form.intervalMonths,
        emoji: form.emoji,
        day: form.day,
      });
      toast.success("Lagt til i budsjett");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Kunne ikke legge til';
      toast.error(msg);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* <h1 className="text-h2">Budsjett</h1> */}

        <BudgetMonthNav
          value={currentMonth}
          onChange={(v) => {
            if (v === currentMonth) return;
            ph.custom("budget_month_changed", {
              horse_id: horseId,
              from_month: currentMonth,
              to_month: v,
            });
            setCurrentMonth(v);
            // Update URL ?m=YYYY-MM without reload, preserving other params
            const sp = new URLSearchParams(Array.from(searchParams?.entries() || []));
            sp.set("m", v);
            router.replace(`${pathname}?${sp.toString()}`);
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>{monthLabel(currentMonth)}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="py-8 flex items-center justify-center text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Laster budsjett…
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
              <div className="space-y-4">
                {/* Controls: Filter, Sort, Search */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600" aria-hidden>
                    Sorter
                  </span>
                  <Select value={sort} onValueChange={(v) => setSort(v as 'date' | 'amount_asc' | 'amount_desc')}>
                    <SelectTrigger className="w-[170px]" aria-label="Sorter">
                      <SelectValue placeholder="Velg sortering" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Dato</SelectItem>
                      <SelectItem value="amount_desc">Beløp (høy-lav)</SelectItem>
                      <SelectItem value="amount_asc">Beløp (lav-høy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sticky summary */}
                <div className="sticky top-14 z-10 bg-white/80 backdrop-blur mt-2">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="text-sm text-gray-600">Totalt {monthLabel(currentMonth)}</div>
                    <div className="text-base font-semibold">{formatNOK(thisMonth.total)} kr</div>
                  </div>
                </div>

                {/* Grouped list by day */}
                <div className="divide-y">
                  {(() => {
                    const sorted = [...thisMonth.items].sort((a, b) => {
                      if (sort === "amount_desc") return b.amount - a.amount;
                      if (sort === "amount_asc") return a.amount - b.amount;
                      return a.day - b.day;
                    });
                    const groups: Record<number, typeof sorted> = {} as Record<number, typeof sorted>;
                    for (const it of sorted) {
                      groups[it.day] = groups[it.day] || [];
                      groups[it.day].push(it);
                    }
                    const days = Object.keys(groups)
                      .map((d) => parseInt(d, 10))
                      .sort((a, b) => a - b);
                    if (days.length === 0) {
                      return (
                        <div className="p-6 text-center text-gray-500">
                          <div className="text-2xl">📭</div>
                          <div className="mt-1 font-medium">Ingen utgifter denne måneden</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Du har ikke lagt til noen utgifter ennå. Trykk på knappen under for å
                            komme i gang.
                          </div>
                          <div className="mt-3">
                            <a
                              href="#add"
                              className="inline-flex items-center px-3 py-2 rounded bg-[#5B4B8A] text-white"
                            >
                              ➕ Legg til utgift
                            </a>
                          </div>
                        </div>
                      );
                    }
                    return days.map((day) => {
                      const list = groups[day]!;
                      const subtotal = list
                        .filter((x) => !x.skipped)
                        .reduce((s, x) => s + x.amount, 0);
                      const dayStr = String(day).padStart(2, "0");
                      const monthStr = currentMonth.split("-")[1];
                      return (
                        <div key={day} className="py-2">
                          <div className="px-1 py-1 text-xs font-semibold text-gray-600">
                            {dayStr}.{monthStr}
                          </div>
                          {list.map((it) => {
                            return (
                              <div
                                key={`${it.budgetItemId}-${it.month}-${it.day}`}
                                className="flex items-center gap-3 py-2 min-h-[56px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#5B4B8A] rounded-md"
                                role="button"
                                tabIndex={0}
                                aria-label={`Rediger ${it.title}`}
                                onClick={() => openEditDialog(it.budgetItemId)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    openEditDialog(it.budgetItemId);
                                  }
                                }}
                              >
                                {(() => {
                                  const meta = getCategoryMeta(it.category);
                                  return (
                                    <div
                                      className={[
                                        "h-8 w-8 flex items-center justify-center rounded-full text-base",
                                        meta.color,
                                      ].join(" ")}
                                      aria-hidden
                                    >
                                      {it.emoji || meta.emoji}
                                    </div>
                                  );
                                })()}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate text-sm">{it.title}</div>
                                  <div className="text-[11px] text-gray-500 flex items-center gap-2">
                                    <span>
                                      {dayStr}.{monthStr}
                                    </span>
                                    <span>·</span>
                                    <span className="truncate max-w-[140px]">{it.category}</span>
                                    {it.isRecurring && (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                                        ·{" "}
                                        <span className="rounded bg-gray-100 px-1.5 py-0.5">
                                          🔁 Gjentakende
                                        </span>
                                      </span>
                                    )}
                                    {/* Override-badge fjernet */}
                                  </div>
                                </div>
                                <div className="min-w-[110px] sm:min-w-[120px] text-right">
                                  <div className="flex items-center justify-end gap-1 sm:gap-2 whitespace-nowrap">
                                    <span className="text-base font-semibold">{formatNOK(it.amount)} kr</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openEditDialog(it.budgetItemId); }}
                                      aria-label={`Rediger ${it.title}`}
                                      title={`Rediger ${it.title}`}
                                      className="flex items-center justify-center h-11 w-11 rounded-md hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#5B4B8A] select-none text-sm sm:text-base"
                                    >
                                      ✎
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div className="px-1 pt-1 text-xs text-gray-600">
                            Subtotal: {formatNOK(subtotal)} kr
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legg til</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Velg emoji"
                  onClick={() => setEmojiDialogOpen(true)}
                  className="h-10 w-10 flex items-center justify-center rounded-full border bg-white text-xl"
                >
                  {form.emoji ?? "+"}
                </button>
                <Input
                  placeholder="Tittel (f.eks. Stallleie)"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <Input
                placeholder="Beløp"
                type="number"
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <Input
                placeholder="Kategori"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
              <div className="flex gap-2">
                <Select
                  value={form.kind}
                  onValueChange={(v) => setForm((f) => ({ ...f, kind: v as 'oneoff' | 'recurring' }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oneoff">Bare denne måneden</SelectItem>
                    <SelectItem value="recurring">Gjentakende</SelectItem>
                  </SelectContent>
                </Select>
                {form.kind === "recurring" && (
                  <Select
                    value={form.intervalMonths}
                    onValueChange={(v) => setForm((f) => ({ ...f, intervalMonths: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Intervall" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((n) => (
                        <SelectItem key={n} value={n}>
                          Hver {n}. mnd
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select
                  value={form.day}
                  onValueChange={(v) => setForm((f) => ({ ...f, day: v }))}
                >
                  <SelectTrigger className="w-full" aria-label="Dag i måneden">
                    <SelectValue placeholder="Dag" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: daysInMonth(currentMonth) }, (_, i) => String(i + 1)).map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="pt-3">
            <Button onClick={onAdd} disabled={createItem.isPending}>
              {createItem.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Legg til
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Emoji picker dialog */}
      <Dialog open={emojiDialogOpen} onOpenChange={setEmojiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Velg emoji</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-8 gap-2 text-xl">
            {[
              "🏠","🥣","🌾","🧰","🩺","🛡️","🎒","🚚","🏋️","🏆","🐴","💊","🧼","🧹","🪣","🧽","🧴","🧯"
            ].map((e) => (
              <button key={e} className="h-10 w-10 flex items-center justify-center rounded border bg-white" onClick={() => { setForm(f => ({ ...f, emoji: e })); setEmojiDialogOpen(false); }}>{e}</button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            <div className="text-sm text-gray-600">Egendefinert</div>
            <div className="flex items-center gap-2">
              <Input placeholder="Lim inn emoji" value={customEmoji} onChange={(e) => setCustomEmoji(e.target.value)} />
              <Button onClick={() => { if (customEmoji.trim()) { setForm(f => ({ ...f, emoji: customEmoji.trim() })); setEmojiDialogOpen(false); setCustomEmoji(""); } }}>Bruk</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
      
      {/* Edit item dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog((s) => ({ ...s, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger utgift</DialogTitle>
          </DialogHeader>
          {editDialog.form ? (
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Velg emoji"
                  onClick={() => setEmojiDialogOpen(true)}
                  className="h-10 w-10 flex items-center justify-center rounded-full border bg-white text-xl"
                >
                  {editDialog.form.emoji ?? "+"}
                </button>
                <Input value={editDialog.form.title} onChange={(e) => setEditDialog((s) => ({ ...s, form: { ...s.form!, title: e.target.value } }))} placeholder="Tittel" />
              </div>
              <Input value={editDialog.form.amount} onChange={(e) => setEditDialog((s) => ({ ...s, form: { ...s.form!, amount: e.target.value } }))} placeholder="Beløp" type="number" inputMode="numeric" />
              <Input value={editDialog.form.category} onChange={(e) => setEditDialog((s) => ({ ...s, form: { ...s.form!, category: e.target.value } }))} placeholder="Kategori" />
              <div className="flex gap-2">
                <Select value={editDialog.form.kind} onValueChange={(v) => setEditDialog((s) => ({ ...s, form: { ...s.form!, kind: v as 'oneoff' | 'recurring' } }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oneoff">Bare denne måneden</SelectItem>
                    <SelectItem value="recurring">Gjentakende</SelectItem>
                  </SelectContent>
                </Select>
                {editDialog.form.kind === 'recurring' && (
                  <Select value={editDialog.form.intervalMonths} onValueChange={(v) => setEditDialog((s) => ({ ...s, form: { ...s.form!, intervalMonths: v } }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Intervall" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((n) => (
                        <SelectItem key={n} value={n}>Hver {n}. mnd</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={editDialog.form.day} onValueChange={(v) => setEditDialog((s) => ({ ...s, form: { ...s.form!, day: v } }))}>
                  <SelectTrigger><SelectValue placeholder="Dag" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: daysInMonth(currentMonth) }, (_, i) => String(i + 1)).map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-gray-500">Laster…</div>
          )}
          {/* Destruktiv seksjon */}
          {editDialog.open && editDialog.itemId && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Farlig område</div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    // Lukk redigeringsdialog, åpne bekreftelse
                    setEditDialog((s) => ({ ...s, open: false }));
                    setDeleteDialog({ open: true, itemId: editDialog.itemId, title: editDialog.form?.title });
                  }}
                >
                  Slett utgift
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Avbryt</Button>
            </DialogClose>
            <Button onClick={saveEditDialog}>Lagre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete confirm dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((s) => ({ ...s, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slette utgift?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600">Dette kan ikke angres.</div>
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
                  const res = await fetch(`/api/horses/${horseId}/budget/items/${id}`, { credentials: 'include' });
                  const snapshot = res.ok ? await res.json() : null;
                  await deleteItem.mutateAsync({ horseId, itemId: id });
                  setEditDialog({ open: false });
                  setDeleteDialog({ open: false });
                  toast.success('Utgift slettet.', snapshot ? {
                    action: {
                      label: 'Angre',
                      onClick: async () => {
                        try { await createItem.mutateAsync({ horseId, data: snapshot }); } catch {}
                      },
                    },
                    duration: 6000,
                  } : { duration: 4000 });
                } catch (e: unknown) {
                  const msg = e instanceof Error ? e.message : 'Kunne ikke slette';
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
