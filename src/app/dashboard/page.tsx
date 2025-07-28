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

  useEffect(() => {
    if (!user && !loading) {
      router.push("/logg-inn");
    }
  }, [user, loading, router]);

  // Show loading only while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Laster...</div>
        </div>
      </div>
    );
  }

  // Show loading while we verify auth state to prevent blank page flash
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <StallClient userId={user.id} />
      </main>
      <Footer />
    </div>
  );
}
