"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHorse } from "@/hooks/useHorses";
import { StableInfo } from "@/components/horses/StableInfo";
import { StableSelector } from "@/components/horses/StableSelector";

export default function HorseStablePage() {
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
      <h1 className="text-h2">Stall</h1>
      <Card>
        <CardHeader>
          <CardTitle>Stallinformasjon</CardTitle>
        </CardHeader>
        <CardContent>
          {horse.stable ? (
            <StableInfo stable={horse.stable} />
          ) : (
            <div className="space-y-4">
              <p className="text-body text-gray-700">
                Hesten er ikke tilknyttet en stall. Knytt den til en stallplassering for å få bedre oversikt.
              </p>
              <StableSelector
                horseId={horse.id}
                currentStable={horse.stable || null}
                onStableSelected={() => {}}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

