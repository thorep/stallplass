"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building, Navigation } from "lucide-react";

interface StableData {
  id: string;
  name: string;
  address?: string | null;
  postalCode?: string | null;
  postalPlace?: string | null;
  latitude: number;
  longitude: number;
}

interface StableInfoProps {
  stable: StableData;
  className?: string;
}

export function StableInfo({ stable, className }: StableInfoProps) {
  const fullAddress = [
    stable.address,
    stable.postalCode && stable.postalPlace
      ? `${stable.postalCode} ${stable.postalPlace}`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  // Create Google Maps URL for showing location
  const mapsUrl = `https://www.google.com/maps?q=${stable.latitude},${stable.longitude}&z=15`;
  
  // Create Google Maps embed URL for iframe
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${stable.latitude},${stable.longitude}&zoom=15`;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-green-600" />
          Stallplassering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stable Name and Address */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <Building className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-body-sm text-gray-600">Stallnavn</p>
              <p className="text-body font-medium">{stable.name}</p>
            </div>
          </div>

          {fullAddress && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-body-sm text-gray-600">Adresse</p>
                <p className="text-body font-medium">{fullAddress}</p>
              </div>
            </div>
          )}
        </div>

        {/* Location Badge and Map Link */}
        <div className="flex items-center justify-between pt-2">
          <Badge variant="outline" className="text-body-sm">
            <Navigation className="h-3 w-3 mr-1" />
            Lokasjon tilgjengelig
          </Badge>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-body-sm font-medium transition-colors"
          >
            Åpne i kart
          </a>
        </div>

        {/* Simple Map Preview */}
        <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={embedUrl}
              allowFullScreen
              title={`Kart for ${stable.name}`}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-center text-gray-500">
              <div>
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p className="text-body-sm">Kartvisning ikke tilgjengelig</p>
                <p className="text-body-sm">
                  Lat: {stable.latitude.toFixed(4)}, Lng: {stable.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}