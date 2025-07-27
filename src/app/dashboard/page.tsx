"use client";

import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import StallClient from "@/components/organisms/StallClient";
import { useStablesByOwner } from "@/hooks/useStables";
import { useAuth } from "@/lib/supabase-auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StallPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data: stables = [], isLoading: stablesLoading, error } = useStablesByOwner(user?.id);

  useEffect(() => {
    if (!user && !loading) {
      console.log("ERROR HERE");
      router.push("/logg-inn");
    }
  }, [user, loading, router]);

  // Show loading only while auth is loading OR while we have a user but stables are still loading
  if (loading || (!user && loading !== false)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Laster...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return null;
  }

  // Show loading only for initial stables data fetch if we have a user and no cached data
  if (stablesLoading && !stables.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Laster staller...</div>
        </div>
      </div>
    );
  }

  // Show error state if stables failed to load
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-red-500">Feil ved lasting av staller. Prøv å laste siden på nytt.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <StallClient stables={stables} />
      </main>
      <Footer />
    </div>
  );
}
