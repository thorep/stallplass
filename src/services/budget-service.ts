import { prisma } from "./prisma";

export interface CreateBudgetItemData {
  title: string;
  category: string;
  amount: number; // NOK, whole kroner
  isRecurring?: boolean;
  startMonth: string; // YYYY-MM
  endMonth?: string | null; // YYYY-MM
  intervalMonths?: number | null; // 1..12
  intervalWeeks?: number | null; // 1..52 (weekly recurrence)
  weekday?: number | null; // 1=Mon .. 7=Sun
  anchorDay?: number | null; // 1..31
  notes?: string | null;
  emoji?: string | null;
}

export type UpdateBudgetItemData = Partial<CreateBudgetItemData>;

export type BudgetOccurrence = {
  budgetItemId: string;
  title: string;
  category: string;
  emoji?: string | null;
  baseAmount: number;
  amount: number; // effective amount for the month (after override)
  isRecurring: boolean;
  month: string; // YYYY-MM
  hasOverride: boolean;
  skipped: boolean;
  intervalMonths?: number | null;
  note?: string | null;
  day: number; // 1-31 (clamped to month)
};

function ymToParts(ym: string): { y: number; m: number } {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  return { y, m };
}

function monthsDiff(from: string, to: string): number {
  const a = ymToParts(from);
  const b = ymToParts(to);
  return (b.y - a.y) * 12 + (b.m - a.m);
}

function addMonths(ym: string, delta: number): string {
  const { y, m } = ymToParts(ym);
  const total = (y * 12 + (m - 1)) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny.toString().padStart(4, "0")}-${nm.toString().padStart(2, "0")}`;
}

function daysInMonth(ym: string): number {
  const { y, m } = ymToParts(ym);
  return new Date(y, m, 0).getDate();
}

/**
 * Verify the authenticated user owns the horse
 */
async function verifyHorseOwnership(horseId: string, userId: string): Promise<boolean> {
  const horse = await prisma.horses.findFirst({
    where: { id: horseId, ownerId: userId, archived: false, deletedAt: null },
    select: { id: true },
  });
  return !!horse;
}

/**
 * Create a budget item for a horse (owner only)
 */
export async function createBudgetItem(horseId: string, userId: string, data: CreateBudgetItemData) {
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) return null;

  const item = await prisma.budget_items.create({
    data: {
      horseId,
      title: data.title,
      category: data.category,
      amount: Math.round(data.amount),
      isRecurring: !!data.isRecurring,
      startMonth: data.startMonth,
      endMonth: data.endMonth ?? null,
      intervalMonths: data.isRecurring
        ? (data.intervalWeeks ? null : (data.intervalMonths ?? 1))
        : null,
      intervalWeeks: data.isRecurring ? (data.intervalWeeks ?? null) : null,
      weekday: data.isRecurring ? (data.weekday ?? null) : null,
      anchorDay: data.anchorDay ?? null,
      emoji: data.emoji ?? null,
      notes: data.notes ?? null,
    },
  });
  return item;
}

/**
 * Update a budget item (owner only)
 */
export async function updateBudgetItem(horseId: string, userId: string, itemId: string, data: UpdateBudgetItemData) {
  // Ensure item belongs to horse and user owns horse
  const item = await prisma.budget_items.findUnique({ where: { id: itemId } });
  if (!item || item.horseId !== horseId) return null;
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) return null;

  const updated = await prisma.budget_items.update({
    where: { id: itemId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.amount !== undefined ? { amount: Math.round(data.amount) } : {}),
      ...(data.isRecurring !== undefined
        ? {
            isRecurring: data.isRecurring,
            intervalMonths: data.isRecurring
              ? (data.intervalWeeks ? null : (data.intervalMonths ?? 1))
              : null,
            intervalWeeks: data.isRecurring ? (data.intervalWeeks ?? null) : null,
            weekday: data.isRecurring ? (data.weekday ?? null) : null,
          }
        : {}),
      ...(data.startMonth !== undefined ? { startMonth: data.startMonth } : {}),
      ...(data.endMonth !== undefined ? { endMonth: data.endMonth } : {}),
      ...(data.intervalMonths !== undefined ? { intervalMonths: data.intervalMonths } : {}),
      ...(data.intervalWeeks !== undefined ? { intervalWeeks: data.intervalWeeks } : {}),
      ...(data.weekday !== undefined ? { weekday: data.weekday } : {}),
      ...(data.anchorDay !== undefined ? { anchorDay: data.anchorDay } : {}),
      ...(data.emoji !== undefined ? { emoji: data.emoji } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
  });
  return updated;
}

/**
 * Delete a budget item (owner only)
 */
export async function deleteBudgetItem(horseId: string, userId: string, itemId: string) {
  const item = await prisma.budget_items.findUnique({ where: { id: itemId } });
  if (!item || item.horseId !== horseId) return false;
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) return false;

  await prisma.budget_overrides.deleteMany({ where: { budgetItemId: itemId } });
  await prisma.budget_items.delete({ where: { id: itemId } });
  return true;
}

export async function getBudgetItem(horseId: string, userId: string, itemId: string) {
  const item = await prisma.budget_items.findUnique({ where: { id: itemId } });
  if (!item || item.horseId !== horseId) return null;
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) return null;
  return item;
}

/** Upsert override for a specific month for an item */
export async function upsertOverride(horseId: string, userId: string, budgetItemId: string, month: string, overrideAmount?: number | null, skip?: boolean, note?: string | null) {
  const item = await prisma.budget_items.findUnique({ where: { id: budgetItemId } });
  if (!item || item.horseId !== horseId) return null;
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) return null;

  // If neither amount nor skip nor note is provided, remove override
  if (overrideAmount === undefined && skip === undefined && note === undefined) {
    await prisma.budget_overrides.deleteMany({ where: { budgetItemId, month } });
    return { deleted: true } as const;
  }

  const o = await prisma.budget_overrides.upsert({
    where: { budgetItemId_month: { budgetItemId, month } },
    create: {
      budgetItemId,
      month,
      overrideAmount: overrideAmount === null || overrideAmount === undefined ? null : Math.round(overrideAmount),
      skip: !!skip,
      note: note ?? null,
    },
    update: {
      ...(overrideAmount !== undefined ? { overrideAmount: overrideAmount === null ? null : Math.round(overrideAmount) } : {}),
      ...(skip !== undefined ? { skip } : {}),
      ...(note !== undefined ? { note } : {}),
    },
  });
  return o;
}

/** Delete override for item+month */
export async function deleteOverride(horseId: string, userId: string, budgetItemId: string, month: string) {
  const item = await prisma.budget_items.findUnique({ where: { id: budgetItemId } });
  if (!item || item.horseId !== horseId) return false;
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) return false;
  await prisma.budget_overrides.deleteMany({ where: { budgetItemId, month } });
  return true;
}

/**
 * Expand budget items into monthly occurrences for a given range [fromMonth, toMonth]
 */
export async function getBudgetForRange(horseId: string, userId: string, fromMonth: string, toMonth: string) {
  // Owner-only for now
  const hasAccess = await verifyHorseOwnership(horseId, userId);
  if (!hasAccess) return null;

  // Fetch all items relevant for the range (quick filter by start/end)
  const items = await prisma.budget_items.findMany({
    where: {
      horseId,
      // Rough range filter: startMonth <= toMonth and (endMonth is null or endMonth >= fromMonth)
      startMonth: { lte: toMonth },
      OR: [
        { endMonth: null },
        { endMonth: { gte: fromMonth } },
      ],
    },
    include: {
      overrides: {
        where: { month: { gte: fromMonth, lte: toMonth } },
      },
    },
  });

  const months: string[] = [];
  const diff = monthsDiff(fromMonth, toMonth);
  for (let i = 0; i <= diff; i++) months.push(addMonths(fromMonth, i));

  const byMonth: Record<string, BudgetOccurrence[]> = {};
  for (const ym of months) byMonth[ym] = [];

  for (const it of items) {
    if (!it.isRecurring) {
      // One-off: occurs only at startMonth
      if (it.startMonth >= fromMonth && it.startMonth <= toMonth) {
        const ov = it.overrides.find((o) => o.month === it.startMonth);
        const amount = ov?.overrideAmount ?? it.amount;
        const skipped = !!ov?.skip;
        const dim = daysInMonth(it.startMonth);
        const day = Math.min(it.anchorDay ?? dim, dim);
        const occ: BudgetOccurrence = {
          budgetItemId: it.id,
          title: it.title,
          category: it.category,
          emoji: it.emoji ?? null,
          baseAmount: it.amount,
          amount,
          isRecurring: false,
          month: it.startMonth,
          hasOverride: !!ov && (ov.overrideAmount != null || ov.skip || !!ov.note),
          skipped,
          note: ov?.note ?? null,
          intervalMonths: null,
          day,
        };
        byMonth[it.startMonth].push(occ);
      }
    } else {
      const start = it.startMonth;
      const end = it.endMonth ?? toMonth;
      if (it.intervalWeeks && it.weekday) {
        // Weekly recurrence: every N weeks on a given weekday
        // Build range bounds
        const { y: fy, m: fm } = ymToParts(fromMonth);
        const fromFirst = new Date(fy, fm - 1, 1);
        const fromFirstWeekday = fromFirst.getDay() === 0 ? 7 : fromFirst.getDay();
        const delta = (it.weekday - fromFirstWeekday + 7) % 7;
        let firstDate = new Date(fy, fm - 1, 1 + delta);

        // Respect item startMonth
        const { y: sy, m: sm } = ymToParts(start);
        const startBoundary = new Date(sy, sm - 1, 1);
        if (firstDate < startBoundary) {
          const diffDays = Math.ceil((startBoundary.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
          const stepDays = 7 * it.intervalWeeks;
          const steps = Math.ceil(diffDays / stepDays);
          firstDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() + steps * stepDays);
        }

        const { y: ty, m: tm } = ymToParts(end);
        const endBoundary = new Date(ty, tm, 0);
        const stepDays = 7 * it.intervalWeeks;
        for (let d = new Date(firstDate); d <= endBoundary; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + stepDays)) {
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (ym < fromMonth || ym > toMonth) continue;
          const ov = it.overrides.find((o) => o.month === ym);
          const amount = ov?.overrideAmount ?? it.amount;
          const skipped = !!ov?.skip;
          const occ: BudgetOccurrence = {
            budgetItemId: it.id,
            title: it.title,
            category: it.category,
            emoji: it.emoji ?? null,
            baseAmount: it.amount,
            amount,
            isRecurring: true,
            month: ym,
            hasOverride: !!ov && (ov.overrideAmount != null || ov.skip || !!ov.note),
            skipped,
            note: ov?.note ?? null,
            intervalMonths: it.intervalMonths ?? null,
            day: d.getDate(),
          };
          byMonth[ym].push(occ);
        }
      } else {
        // Monthly recurrence: existing behavior
        const interval = it.intervalMonths ?? 1;
        let stepStart = fromMonth;
        const offset = monthsDiff(start, fromMonth);
        const remainder = ((offset % interval) + interval) % interval; // handle negatives
        if (remainder !== 0) {
          stepStart = addMonths(fromMonth, interval - remainder);
        }
        for (let ym = stepStart; ym <= end && ym <= toMonth; ym = addMonths(ym, interval)) {
          if (ym < start) continue;
          if (ym < fromMonth) continue;
          const ov = it.overrides.find((o) => o.month === ym);
          const amount = ov?.overrideAmount ?? it.amount;
          const skipped = !!ov?.skip;
          const dim = daysInMonth(ym);
          const day = Math.min(it.anchorDay ?? dim, dim);
          const occ: BudgetOccurrence = {
            budgetItemId: it.id,
            title: it.title,
            category: it.category,
            emoji: it.emoji ?? null,
            baseAmount: it.amount,
            amount,
            isRecurring: true,
            month: ym,
            hasOverride: !!ov && (ov.overrideAmount != null || ov.skip || !!ov.note),
            skipped,
            note: ov?.note ?? null,
            intervalMonths: interval,
            day,
          };
          byMonth[ym].push(occ);
        }
      }
    }
  }

  const monthsOut = months.map((ym) => {
    const items = byMonth[ym].filter((x) => !x.skipped);
    const total = items.reduce((sum, x) => sum + x.amount, 0);
    return { month: ym, total, items };
  });

  return { months: monthsOut };
}
