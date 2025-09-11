import { prisma } from "@/services/prisma";
import { createClient } from "@/utils/supabase/server";
import { getBudgetForRange } from "@/services/budget-service";
import { notFound } from "next/navigation";
import HorseBudgetClient from "./HorseBudgetClient";

interface HorseBudgetPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

function ymNow(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function getYear(ym: string) {
  return parseInt(ym.split("-")[0]!, 10);
}

export default async function HorseBudgetPage({ params, searchParams }: HorseBudgetPageProps) {
  const { id: horseId } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    notFound();
  }

  // Check if user has access to this horse (owner or shared with)
  const horse = await prisma.horses.findUnique({
    where: { id: horseId },
    select: { id: true, ownerId: true },
  });

  if (!horse) {
    notFound();
  }

  // Allow access if user is owner OR horse is shared with user
  const isOwner = horse.ownerId === userData.user.id;
  const isShared = await prisma.horse_shares.findFirst({
    where: {
      horseId: horseId,
      sharedWithId: userData.user.id
    }
  });

  if (!isOwner && !isShared) {
    notFound();
  }

  // Get current month from search params or default to current month
  const searchParamsResolved = await searchParams;
  const currentMonth = typeof searchParamsResolved?.m === 'string' ? searchParamsResolved.m : ymNow();

  const curYear = getYear(currentMonth);
  const from = `${curYear}-01`; // start of current year
  const to = `${curYear + 4}-12`; // through end of +4y (5-year window)

  const budgetData = await getBudgetForRange(horseId, userData.user.id, from, to);

  if (!budgetData) {
    notFound();
  }

  return (
    <HorseBudgetClient
      horseId={horseId}
      budgetData={budgetData}
      currentMonth={currentMonth}
    />
  );
}
