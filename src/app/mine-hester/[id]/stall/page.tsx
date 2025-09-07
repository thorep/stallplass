import { prisma } from "@/services/prisma";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import HorseStallClient from "./HorseStallClient";

interface HorseStallPageProps {
  params: Promise<{ id: string }>;
}

export default async function HorseStallPage({ params }: HorseStallPageProps) {
  const { id: horseId } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    notFound();
  }

  // Check if user has access to this horse
  const horse = await prisma.horses.findUnique({
    where: { id: horseId },
    select: {
      id: true,
      ownerId: true,
      stable: {
        select: {
          id: true,
          name: true,
          address: true,
          postalCode: true,
          postalPlace: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  if (!horse || horse.ownerId !== userData.user.id) {
    notFound();
  }

  return (
    <HorseStallClient
      horse={horse}
    />
  );
}

