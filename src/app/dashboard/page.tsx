import { requireVerifiedEmail } from '@/lib/server-auth'
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import DashboardClient from "@/components/organisms/DashboardClient";

export default async function DashboardPage() {
  const user = await requireVerifiedEmail('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <DashboardClient userId={user.id} user={user} />
      </main>
      <Footer />
    </div>
  )
}