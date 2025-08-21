"use client";

import type { HorseBuy } from "@/hooks/useHorseBuys";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useViewTracking } from "@/services/view-tracking-service";

interface Props { horseBuy: HorseBuy }

export default function HorseBuyDetailClient({ horseBuy }: Props) {
  const fmt = (n?: number) => (typeof n === 'number' ? new Intl.NumberFormat('nb-NO').format(n) : undefined);
  const price = [fmt(horseBuy.priceMin), fmt(horseBuy.priceMax)].filter(Boolean).join(' - ');
  const age = [horseBuy.ageMin, horseBuy.ageMax].filter(v => v !== undefined).join(' - ');
  const height = [horseBuy.heightMin, horseBuy.heightMax].filter(v => v !== undefined).join(' - ');
  const gender = horseBuy.gender ? (horseBuy.gender === 'HOPPE' ? 'Hoppe' : horseBuy.gender === 'HINGST' ? 'Hingst' : 'Vallach') : 'Alle kjønn';
  const { trackHorseBuyView } = useViewTracking();
  useEffect(() => {
    if (horseBuy?.id) trackHorseBuyView(horseBuy.id);
  }, [horseBuy?.id, trackHorseBuyView]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="mb-4">
          <Link href="/sok?mode=horse_sales&horseTrade=buy" className="text-sm text-gray-600 hover:text-gray-900">← Tilbake til søk</Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{horseBuy.name}</h1>
        <div className="text-gray-600 mb-4">{horseBuy.description}</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <div className="text-sm text-gray-500">Ønsket pris</div>
            <div className="font-medium">{price ? `${price} kr` : 'Ikke oppgitt'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Ønsket alder</div>
            <div className="font-medium">{age || 'Ikke oppgitt'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Ønsket kjønn</div>
            <div className="font-medium">{gender}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Mankehøyde</div>
            <div className="font-medium">{height ? `${height} cm` : 'Ikke oppgitt'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Rase</div>
            <div className="font-medium">{horseBuy.breed?.name || 'Alle'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Gren</div>
            <div className="font-medium">{horseBuy.discipline?.name || 'Alle'}</div>
          </div>
        </div>

        {horseBuy.images?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {horseBuy.images.map((url, idx) => (
              <div key={url} className="relative aspect-video bg-gray-50 rounded overflow-hidden">
                <Image src={url} alt={horseBuy.imageDescriptions?.[idx] || horseBuy.name} fill className="object-cover" />
              </div>
            ))}
          </div>
        ) : null}

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">Kontakt</h2>
          <div className="text-gray-700">
            <div><span className="text-gray-500">Navn:</span> {horseBuy.contactName}</div>
            {horseBuy.contactEmail && <div><span className="text-gray-500">E-post:</span> {horseBuy.contactEmail}</div>}
            {horseBuy.contactPhone && <div><span className="text-gray-500">Telefon:</span> {horseBuy.contactPhone}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
 
