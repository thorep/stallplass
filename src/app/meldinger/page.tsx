import Header from "@/components/organisms/Header";
import MessagingClient from "@/components/organisms/MessagingClient";
import { requireAuth } from "@/lib/server-auth";

export default async function MessagesPage() {
  await requireAuth("/meldinger");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <MessagingClient />
      </main>
    </div>
  );
}

export const metadata = {
  title: "Meldinger - Stallplass",
  description: "Se og administrer dine meldinger om boxes",
};
