import { getMinhestFlag } from "@/app/actions/flags";
import { useEffect, useState } from "react";

export function useMinhestFlag() {
  const [showMineHester, setShowMineHester] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlag = async () => {
      try {
        const enabled = await getMinhestFlag();
        setShowMineHester(enabled);
      } catch (error) {
        console.error('Error fetching minhest flag:', error);
        setShowMineHester(false);
      } finally {
        setLoading(false);
      }
    };

    fetchFlag();
  }, []);

  return { showMineHester, loading };
}