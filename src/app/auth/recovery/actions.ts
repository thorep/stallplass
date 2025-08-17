'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  
  // Get form data
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  
  // Validate passwords
  if (!password || !confirmPassword) {
    redirect(`/auth/recovery?error=${encodeURIComponent('Alle felt er påkrevd')}`)
  }
  
  if (password !== confirmPassword) {
    redirect(`/auth/recovery?error=${encodeURIComponent('Passordene matcher ikke')}`)
  }
  
  if (password.length < 6) {
    redirect(`/auth/recovery?error=${encodeURIComponent('Passordet må være minst 6 tegn')}`)
  }
  
  // Check if user is authenticated (they should be after clicking the recovery link)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect(`/glemt-passord?error=${encodeURIComponent('Sesjonen din har utløpt. Vennligst be om en ny tilbakestillingslenke.')}`)
  }
  
  // Update the password
  const { error: updateError } = await supabase.auth.updateUser({
    password: password
  })
  
  if (updateError) {
    redirect(`/auth/recovery?error=${encodeURIComponent(updateError.message)}`)
  }
  
  // Success! Redirect to login
  redirect(`/logg-inn?message=${encodeURIComponent('Passordet ditt har blitt oppdatert. Du kan nå logge inn med det nye passordet.')}`)
}