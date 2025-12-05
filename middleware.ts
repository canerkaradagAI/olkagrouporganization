import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public sayfalar - authentication gerektirmeyen
const publicPaths = [
  '/',
  '/organization',
  '/management',
  '/tree-view',
  '/personnel-list',
  '/reports',
  '/employee-list',
  '/employees',
  '/excel-import',
  '/positions',
  '/auth/signin',
  '/api/auth',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public sayfalar için authentication kontrolü yapma
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/') || pathname.startsWith('/api/')
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Diğer sayfalar için normal akış (NextAuth kendi kontrolünü yapar)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

