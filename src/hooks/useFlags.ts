import { getRabattkodeFlag } from "@/app/actions/flags";
import { useEffect, useState } from "react";

export function useRabattkodeFlag() {
  const [showRabattkode, setShowRabattkode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlag = async () => {
      try {
        const enabled = await getRabattkodeFlag();
        setShowRabattkode(enabled);
      } catch (error) {
        console.error('Error fetching rabattkode flag:', error);
        setShowRabattkode(false);
      } finally {
        setLoading(false);
      }
    };

    fetchFlag();
  }, []);

  return { showRabattkode, loading };
}

