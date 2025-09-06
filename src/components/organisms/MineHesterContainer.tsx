import { HorsesWithOwner } from "@/app/mine-hester/page";
import { budget_items } from "@/generated/prisma";
import { prisma } from "@/services/prisma";
import { User } from "@supabase/supabase-js";
import MineHesterClient from "./MineHesterClient";

interface MineHesterContainerProps {
  user: User;
}

export default async function MineHesterContainer({ user }: Readonly<MineHesterContainerProps>) {
  const horses: HorsesWithOwner[] = await prisma.horses.findMany({
    where: { ownerId: user.id, archived: false },
    include: { profiles: true, horseShares: true },
  });

  return <MineHesterClient user={user} horses={horses} />;
}
