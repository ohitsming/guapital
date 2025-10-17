import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // This middleware is currently disabled and does nothing.
  return NextResponse.next()
}

// The matcher is set to an empty array to prevent the middleware from running on any path.
export const config = {
  matcher: [],
}