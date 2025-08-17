'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect(`/glemt-passord?error=${encodeURIComponent('Sesjonen din har utløpt. Vennligst be om en ny tilbakestillingslenke.')}`);
  }
  
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  
  if (!password || !confirmPassword) {
    redirect(`/tilbakestill-passord?error=${encodeURIComponent('Alle felt er påkrevd')}`)
  }
  
  if (password !== confirmPassword) {
    redirect(`/tilbakestill-passord?error=${encodeURIComponent('Passordene matcher ikke')}`)
  }
  
  if (password.length < 6) {
    redirect(`/tilbakestill-passord?error=${encodeURIComponent('Passordet må være minst 6 tegn')}`)
  }
  
  const { error } = await supabase.auth.updateUser({
    password: password
  })
  
  if (error) {
    redirect(`/tilbakestill-passord?error=${encodeURIComponent(error.message)}`)
  }
  
  // Redirect to login with success message
  redirect(`/logg-inn?message=${encodeURIComponent('Passordet ditt har blitt oppdatert. Du kan nå logge inn med det nye passordet.')}`)
}