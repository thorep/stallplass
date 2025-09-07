"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HorseSharing } from "@/components/horses/HorseSharing";

interface HorseDelClientProps {
  horse: { id: string; name: string; ownerId: string };
}

export default function HorseDelClient({ horse }: HorseDelClientProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-h2">Del</h1>
      <Card>
        <CardHeader>
          <CardTitle>Deling og tilgang</CardTitle>
        </CardHeader>
        <CardContent>
          <HorseSharing horseId={horse.id} isOwner={true} />
        </CardContent>
      </Card>
    </div>
  );
}