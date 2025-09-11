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

  // Check if user has access to this horse (owner or shared with)
  const horse = await prisma.horses.findUnique({
    where: { id: horseId },
    select: { id: true, ownerId: true, name: true },
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

  return (
    <HorseDelClient
      horse={horse}
      isOwner={isOwner}
    />
  );
}

