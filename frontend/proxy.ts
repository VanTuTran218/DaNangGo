import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      if (request.cookies.has('admin_access')) return NextResponse.redirect(new URL('/admin', request.url));
      return NextResponse.next();
    }
    if (!request.cookies.has('admin_access')) return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  if (
    (pathname.startsWith('/ca-nhan') ||
      pathname.startsWith('/partner') ||
      pathname.startsWith('/lich-trinh') ||
      pathname.startsWith('/vip')) &&
    !request.cookies.has('access_token')
  ) {
    const target = new URL('/dang-nhap', request.url);
    target.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(target);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/ca-nhan/:path*',
    '/partner/:path*',
    '/lich-trinh/:path*',
    '/vip/:path*',
  ],
};

