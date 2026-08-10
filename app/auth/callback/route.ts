import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/inicio'

  if (code) {
    const supabase = createClient()

    // Intentar como authorization code (PKCE flow)
    const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!codeError) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    // Si falla, intentar como OTP (recovery flow con custom SMTP)
    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash: code,
      type: 'recovery',
    })
    if (!otpError) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Auth callback failed:', codeError?.message, otpError?.message)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
