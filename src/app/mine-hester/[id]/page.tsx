import { prisma } from "@/services/prisma";
import { createClient } from "@/utils/supabase/server";
import HorseDetailClient from "@/components/horses/HorseDetailClient";
import { notFound } from "next/navigation";

interface HorseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function HorseDetailPage({ params }: HorseDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    notFound();
  }

  // Fetch horse with basic relations
  const horse = await prisma.horses.findUnique({
    where: { id },
    include: {
      profiles: true,
      horseShares: {
        include: {
          sharedWith: true,
        },
      },
    },
  });

  if (!horse) {
    notFound();
  }

  // Check if user has access to this horse
  const isOwner = horse.ownerId === userData.user.id;
  const hasAccess = isOwner || horse.horseShares.some((share) => share.sharedWithId === userData.user.id);

  if (!hasAccess) {
    notFound();
  }

  return <HorseDetailClient horse={horse} user={userData.user} />;
}