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


  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/logg-inn?error=${encodeURIComponent(error.message)}`)
  }

  if (authData.user) {
    // User authenticated successfully
  }

  revalidatePath('/', 'layout')
  redirect('/authenticate')
}