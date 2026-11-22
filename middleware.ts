import { NextResponse, type NextRequest } from 'next/server'

// Simple cookie signature verification for edge/middleware runtime
function parseSessionCookie(token: string) {
  try {
    const [data] = token.split('.')
    if (!data) return null
    const jsonStr = atob(data.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(jsonStr)
    if (payload.expiresAt < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

const PUBLIC_ROUTES = ['/login', '/api/auth/login']

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const sessionToken = request.cookies.get('sales_session')?.value
  const session = sessionToken ? parseSessionCookie(sessionToken) : null

  // Allow static files and public routes
  if (path.startsWith('/_next') || path.startsWith('/favicon.ico')) {
    return NextResponse.next()
  }

  // Already logged in user navigating to login page
  if (path === '/login') {
    if (session) {
      if (session.role === 'manager') {
        return NextResponse.redirect(new URL('/manager', request.url))
      } else {
        return NextResponse.redirect(new URL('/salesman', request.url))
      }
    }
    return NextResponse.next()
  }

  // Allow API routes to handle their own session errors
  if (path.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Unauthenticated user trying to access protected routes
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    if (path !== '/') {
      loginUrl.searchParams.set('redirectTo', path)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Block suspended or archived accounts
  if (session.status === 'hold') {
    const res = NextResponse.redirect(new URL('/login?error=account_suspended', request.url))
    res.cookies.delete('sales_session')
    return res
  }

  if (session.status === 'archived') {
    const res = NextResponse.redirect(new URL('/login?error=account_inactive', request.url))
    res.cookies.delete('sales_session')
    return res
  }

  // Role permissions
  if (path.startsWith('/manager') && session.role !== 'manager') {
    return NextResponse.redirect(new URL('/salesman', request.url))
  }

  if (path === '/') {
    if (session.role === 'manager') {
      return NextResponse.redirect(new URL('/manager', request.url))
    } else {
      return NextResponse.redirect(new URL('/salesman', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
