import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Si erreur dans l'URL, rediriger vers login avec message d'erreur
  if (error) {
    const redirectUrl = new URL('/login', requestUrl.origin)
    redirectUrl.searchParams.set('error', errorDescription || error)
    return NextResponse.redirect(redirectUrl)
  }

  // Si pas de code, rediriger vers login
  if (!code) {
    return NextResponse.redirect(new URL('/login', requestUrl.origin))
  }

  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Échanger le code contre une session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      const redirectUrl = new URL('/login', requestUrl.origin)
      redirectUrl.searchParams.set('error', exchangeError.message)
      return NextResponse.redirect(redirectUrl)
    }

    // Succès : rediriger vers la page d'accueil
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  } catch (error: any) {
    const redirectUrl = new URL('/login', requestUrl.origin)
    redirectUrl.searchParams.set('error', error.message || 'Une erreur est survenue')
    return NextResponse.redirect(redirectUrl)
  }
}
