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

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/logg-inn?error=${encodeURIComponent(error.message)}&returnUrl=${encodeURIComponent(returnUrl)}`)
  }

  revalidatePath('/', 'layout')
  redirect(returnUrl)
}