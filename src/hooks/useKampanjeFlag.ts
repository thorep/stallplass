'use client';

import { getKampanjeFlag } from "@/app/actions/flags";
import { useEffect, useState } from "react";

export function useKampanjeFlag() {
  const [isKampanjeActive, setIsKampanjeActive] = useState(false);

  useEffect(() => {
    const fetchFlag = async () => {
      try {
        const enabled = await getKampanjeFlag();
        setIsKampanjeActive(enabled);
      } catch (error) {
        console.error('Error fetching kampanje flag:', error);
        setIsKampanjeActive(false);
      }
    };

    fetchFlag();
  }, []);

  return isKampanjeActive;
}