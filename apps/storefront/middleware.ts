import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Strip /storefront prefix when served behind ALB path-based routing
  if (path.startsWith('/storefront')) {
    const newPath = path.replace('/storefront', '') || '/';
    return NextResponse.rewrite(new URL(newPath, request.url));
  }
}

export const config = {
  matcher: '/storefront/:path*',
};
