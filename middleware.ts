import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? ''
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua)
  const response = NextResponse.next()
  response.headers.set('x-device-type', isMobile ? 'mobile' : 'desktop')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
