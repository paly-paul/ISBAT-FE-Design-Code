import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

export function middleware(request: NextRequest) {
  // Coarse presence check only — this cannot validate the token, only whether
  // the cookie exists. Only works while erp_access is set same-origin (via the
  // next.config.mjs rewrite proxy); if NEXT_PUBLIC_API_GATEWAY_URL later points
  // cross-origin directly at the gateway, this cookie won't be visible here and
  // the guard becomes a no-op. Real expiry handling lives in src/lib/api/client.ts.
  // Skipped entirely in mock mode, since mock auth never sets the cookie.
  if (!MOCK_AUTH && request.nextUrl.pathname.startsWith('/academic') && !request.cookies.has('erp_access')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const ua = request.headers.get('user-agent') ?? ''
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua)
  const response = NextResponse.next()
  response.headers.set('x-device-type', isMobile ? 'mobile' : 'desktop')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
