import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('[AUTH CONFIRM] Processing auth confirmation:', {
    url: request.url,
    hasCode: !!code,
    hasTokenHash: !!token_hash,
    type,
    next,
    origin
  })

  const supabase = await createClient()

  // Handle PKCE flow (code parameter)
  if (code) {
    console.log('[AUTH CONFIRM] Attempting PKCE code exchange')
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log('[AUTH CONFIRM] PKCE code exchange successful, redirecting to:', `${origin}${next}`)
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.log('[AUTH CONFIRM] PKCE code exchange failed:', error)
  }

  // Handle traditional OTP flow (token_hash parameter)
  if (token_hash && type) {
    console.log('[AUTH CONFIRM] Attempting traditional OTP verification')
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      console.log('[AUTH CONFIRM] OTP verification successful')
      // For password recovery, redirect to tilbakestill-passord page
      if (type === 'recovery') {
        console.log('[AUTH CONFIRM] Password recovery, redirecting to tilbakestill-passord')
        return NextResponse.redirect(`${origin}/tilbakestill-passord`)
      }
      
      // For other types, redirect to specified URL or dashboard
      console.log('[AUTH CONFIRM] Regular signup/login, redirecting to:', `${origin}${next}`)
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.log('[AUTH CONFIRM] OTP verification failed:', error)
    
    // Handle specific error for password recovery
    if (type === 'recovery') {
      console.log('[AUTH CONFIRM] Password recovery failed, redirecting to glemt-passord with error')
      return NextResponse.redirect(`${origin}/glemt-passord?error=${encodeURIComponent('Tilbakestillingslenken er ugyldig eller har utløpt. Vennligst be om en ny lenke.')}`)
    }
  }

  // redirect the user to an error page with some instructions
  console.log('[AUTH CONFIRM] No valid parameters found or all verification attempts failed, redirecting to error page')
  return NextResponse.redirect(`${origin}/verifiser-epost?error=${encodeURIComponent('Kunne ikke bekrefte e-postadressen. Prøv å be om en ny bekreftelseslenke.')}`)
}