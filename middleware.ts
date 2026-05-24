import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export const runtime = 'edge'

const PROTECTED_PREFIXES = ['/academic']
const PUBLIC_PATHS = ['/login', '/api/auth']

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p))
}

function detectDevice(userAgent: string): 'mobile' | 'desktop' {
  return /mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(
    userAgent,
  )
    ? 'mobile'
    : 'desktop'
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get('user-agent') ?? ''
  const deviceType = detectDevice(userAgent)

  // ── Device detection: inject header for Server Components ──────────────────
  const response = NextResponse.next({
    request: { headers: new Headers(request.headers) },
  })
  response.headers.set('x-device-type', deviceType)

  // ── JWT auth guard for protected routes ────────────────────────────────────
  if (isProtected(pathname) && !isPublic(pathname)) {
    const token =
      request.cookies.get('isbat_session')?.value ??
      request.headers.get('authorization')?.replace(/^Bearer\s+/, '')

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET ?? 'fallback-dev-secret-32-characters!!',
      )
      await jwtVerify(token, secret)
    } catch {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      loginUrl.searchParams.set('reason', 'session_expired')
      const redirect = NextResponse.redirect(loginUrl)
      redirect.cookies.delete('isbat_session')
      return redirect
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static assets)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
