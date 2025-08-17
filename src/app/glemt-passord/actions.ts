'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  
  if (!email) {
    redirect(`/glemt-passord?error=${encodeURIComponent('E-postadresse er påkrevd')}`)
  }
  
  // Send password reset email - redirect to our password reset page
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://www.stallplass.no/auth/password-reset'
  })
  
  if (error) {
    redirect(`/glemt-passord?error=${encodeURIComponent(error.message)}`)
  }
  
  // Always show success message for security (don't reveal if email exists)
  redirect('/glemt-passord?success=true')
}