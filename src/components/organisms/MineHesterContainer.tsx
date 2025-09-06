import { HorsesWithOwner } from "@/app/mine-hester/page";
import { prisma } from "@/services/prisma";
import { getBudgetOverviewForUser } from "@/services/budget-service";
import { User } from "@supabase/supabase-js";
import MineHesterClient from "./MineHesterClient";

interface MineHesterContainerProps {
  user: User;
}

function ymNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(ym: string, delta: number) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export default async function MineHesterContainer({
  user,
  searchParams
}: Readonly<MineHesterContainerProps & { searchParams?: { [key: string]: string | string[] | undefined } }>) {
  const horses: HorsesWithOwner[] = await prisma.horses.findMany({
    where: { ownerId: user.id, archived: false },
    include: { profiles: true, horseShares: true },
  });

  // Get active month from search params or default to current month
  const activeMonth = typeof searchParams?.month === 'string' ? searchParams.month : ymNow();

  // Fetch budget overview for active month ± 12 months (1 year range)
  const from = addMonths(activeMonth, -12);
  const to = addMonths(activeMonth, 12);
  const budgetOverview = await getBudgetOverviewForUser(user.id, from, to);

  return <MineHesterClient user={user} horses={horses} budgetOverview={budgetOverview} activeMonth={activeMonth} />;
}
