import { requireVerifiedEmail } from '@/lib/server-auth';
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import MineHesterClient from "@/components/organisms/MineHesterClient";

export default async function MineHesterPage() {
  const user = await requireVerifiedEmail('/mine-hester');

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <MineHesterClient user={user} />
      </main>
      <Footer />
    </div>
  );
}
