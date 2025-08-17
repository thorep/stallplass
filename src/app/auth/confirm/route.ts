import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      // For password recovery, redirect to tilbakestill-passord page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/tilbakestill-passord`)
      }
      
      // For other types, redirect to specified URL or dashboard
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      // Handle specific error for password recovery
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/glemt-passord?error=${encodeURIComponent('Tilbakestillingslenken er ugyldig eller har utløpt. Vennligst be om en ny lenke.')}`)
      }
    }
  }

  // redirect the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/verifiser-epost?error=${encodeURIComponent('Kunne ikke bekrefte e-postadressen. Prøv å be om en ny bekreftelseslenke.')}`)
}