import { requireVerifiedEmail } from '@/lib/server-auth'
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import Dashboard2Client from "@/components/organisms/Dashboard2Client";

export default async function Dashboard2Page() {
  const user = await requireVerifiedEmail('/dashboard2')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Dashboard2Client userId={user.id} />
      </main>
      <Footer />
    </div>
  )
}