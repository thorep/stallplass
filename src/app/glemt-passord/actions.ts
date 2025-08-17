'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  
  if (!email) {
    redirect('/glemt-passord?error=E-postadresse er påkrevd')
  }
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/tilbakestill-passord`
  })
  
  if (error) {
    redirect(`/glemt-passord?error=${encodeURIComponent(error.message)}`)
  }
  
  // Always show success message for security (don't reveal if email exists)
  redirect('/glemt-passord?success=true')
}