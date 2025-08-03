import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import DashboardClient from "@/components/organisms/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/logg-inn')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <DashboardClient userId={user.id} />
      </main>
      <Footer />
    </div>
  )
}
