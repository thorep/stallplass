"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHorse } from "@/hooks/useHorses";
import { HorseSharing } from "@/components/horses/HorseSharing";

export default function HorseSharePage() {
  const params = useParams();
  const horseId = params.id as string;
  const { data: horse, isLoading, error } = useHorse(horseId);

  if (isLoading) {
    return (
      <div className="min-h-40 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (error || !horse) {
    return <div className="text-center text-red-600">Kunne ikke laste hest</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-h2">Del</h1>
      <Card>
        <CardHeader>
          <CardTitle>Deling og tilgang</CardTitle>
        </CardHeader>
        <CardContent>
          <HorseSharing horseId={horse.id} isOwner={!!horse.isOwner} />
        </CardContent>
      </Card>
    </div>
  );
}

