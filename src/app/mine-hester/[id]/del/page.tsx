import { prisma } from "@/services/prisma";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import HorseDelClient from "./HorseDelClient";

interface HorseDelPageProps {
  params: Promise<{ id: string }>;
}

export default async function HorseDelPage({ params }: HorseDelPageProps) {
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

  return (
    <HorseDelClient
      horse={horse}
    />
  );
}

