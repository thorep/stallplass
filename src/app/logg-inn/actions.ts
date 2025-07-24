'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Type-cast here for cleaner types
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('🔐 Attempting login for:', data.email)

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('❌ Login error:', error.message)
    redirect(`/logg-inn?error=${encodeURIComponent(error.message)}`)
  }

  if (authData.user) {
    console.log('✅ Login successful for user:', authData.user.id)
    console.log('🍪 Session created:', !!authData.session)
  }

  revalidatePath('/', 'layout')
  console.log('🔄 Redirecting to dashboard...')
  redirect('/dashboard')
}