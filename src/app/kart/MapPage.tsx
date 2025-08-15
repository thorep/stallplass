"use client";

import FullPageMap from "@/components/organisms/FullPageMap";
import { ServiceMapView } from "@/types/service";
import { StableWithBoxStats } from "@/types/stable";
import { useEffect, useState } from "react";

export default function MapPage() {
  const [stables, setStables] = useState<StableWithBoxStats[]>([]);
  const [services, setServices] = useState<ServiceMapView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch both stables and services in parallel
        const [stablesResponse, servicesResponse] = await Promise.all([
          fetch("/api/stables/map", { credentials: "include" }),
          fetch("/api/services/map", { credentials: "include" }),
        ]);

        if (!stablesResponse.ok) {
          throw new Error("Failed to fetch stables");
        }

        const stablesData = await stablesResponse.json();
        setStables(stablesData.data || []);

        // Services response might fail if some don't have coordinates, that's OK
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          console.log(servicesData);
          setServices(servicesData.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kunne ikke laste kart</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return <FullPageMap stables={stables} services={services} isLoading={isLoading} />;
}
