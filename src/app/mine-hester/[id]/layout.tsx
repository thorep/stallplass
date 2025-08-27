import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import HorseTabs from "@/components/molecules/HorseTabs";
import type { ReactNode } from "react";

export default async function HorseLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Header area for the horse could go here (name, avatar, quick stats) */}
        </div>

        {/* Tabs */}
        <HorseTabs horseId={id} />

        {/* Page content */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
