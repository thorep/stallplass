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

  // Get the return URL from the form data
  const returnUrl = formData.get('returnUrl') as string || '/dashboard'

  const { error, data: authData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // Check if error is about email not being confirmed
    if (error.message.toLowerCase().includes('email not confirmed') || 
        error.message.toLowerCase().includes('not confirmed')) {
      redirect(`/verifiser-epost?email=${encodeURIComponent(data.email)}`)
    }
    redirect(`/logg-inn?error=${encodeURIComponent(error.message)}&returnUrl=${encodeURIComponent(returnUrl)}`)
  }

  // Check if email is verified (double check for safety)
  if (authData.user && !authData.user.email_confirmed_at) {
    redirect('/verifiser-epost')
  }

  revalidatePath('/', 'layout')
  redirect(returnUrl)
}