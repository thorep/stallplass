"use client";

import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import StallClient from "@/components/organisms/StallClient";
import { useUserStables } from "@/hooks/useQueries";
import { useAuth } from "@/lib/supabase-auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StallPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data: stables = [], isLoading: stablesLoading } = useUserStables(user?.id || "");

  useEffect(() => {
    if (!user && !loading) {
      console.log("ERROR HERE");
      router.push("/logg-inn");
    }
  }, [user, loading, router]);

  if (!user && !loading) {
    return null;
  }

  if (!user || loading || stablesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Laster...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
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
