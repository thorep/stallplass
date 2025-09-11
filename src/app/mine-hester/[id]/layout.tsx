import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import HorseTabs from "@/components/molecules/HorseTabs";
import { prisma } from "@/services/prisma";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export default async function HorseLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    notFound();
  }

  // Check if user has access to this horse (owner or shared with)
  const horse = await prisma.horses.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  });

  if (!horse) {
    notFound();
  }

  // Allow access if user is owner OR horse is shared with user
  const isOwner = horse.ownerId === userData.user.id;
  const isShared = await prisma.horse_shares.findFirst({
    where: {
      horseId: id,
      sharedWithId: userData.user.id
    }
  });

  if (!isOwner && !isShared) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Header area for the horse could go here (name, avatar, quick stats) */}
        </div>

        {/* Tabs */}
        <HorseTabs horseId={id} isOwner={isOwner} />

        {/* Page content */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
