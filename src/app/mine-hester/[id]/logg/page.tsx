import { prisma } from "@/services/prisma";
import { createClient } from "@/utils/supabase/server";
import { getCustomCategoriesByHorseId } from "@/services/horse-log-service";
import { notFound } from "next/navigation";
import HorseLoggClient from "./HorseLoggClient";

interface HorseLoggPageProps {
  params: Promise<{ id: string }>;
}

export default async function HorseLoggPage({ params }: HorseLoggPageProps) {
  const { id: horseId } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    notFound();
  }

  // Check if user has access to this horse
  const horse = await prisma.horses.findUnique({
    where: { id: horseId },
    select: { id: true, ownerId: true, name: true },
  });

  if (!horse || horse.ownerId !== userData.user.id) {
    notFound();
  }

  const categories = await getCustomCategoriesByHorseId(horseId, userData.user.id);

  if (categories === null) {
    notFound();
  }

  return (
    <HorseLoggClient
      horse={horse}
      categories={categories}
    />
  );
}

