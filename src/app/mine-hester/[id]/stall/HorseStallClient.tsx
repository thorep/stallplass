"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StableInfo } from "@/components/horses/StableInfo";
import { StableSelector } from "@/components/horses/StableSelector";

interface HorseStallClientProps {
  horse: {
    id: string;
    stable: {
      id: string;
      name: string;
      address: string | null;
      postalCode: string | null;
      postalPlace: string | null;
      latitude: number;
      longitude: number;
    } | null;
  };
}

export default function HorseStallClient({ horse }: HorseStallClientProps) {
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