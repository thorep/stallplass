import { getMinhestFlag, getRabattkodeFlag, getNewOldMineStallerDesignFlag } from "@/app/actions/flags";
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

export function useNewOldMineStallerDesignFlag() {
  const [useNewDesign, setUseNewDesign] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlag = async () => {
      try {
        const enabled = await getNewOldMineStallerDesignFlag();
        setUseNewDesign(enabled);
      } catch (error) {
        console.error('Error fetching newOldMineStallerDesign flag:', error);
        setUseNewDesign(false);
      } finally {
        setLoading(false);
      }
    };

    fetchFlag();
  }, []);

  return { useNewDesign, loading };
}