import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const adminAccess = request.cookies.get('admin_access')?.value;
  const accessToken = request.cookies.get('access_token')?.value;
  const hasValidAdminToken = !!adminAccess && adminAccess !== 'mock_token';
  const hasValidUserToken = !!accessToken && accessToken !== 'mock_partner_token';

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      if (hasValidAdminToken) return NextResponse.redirect(new URL('/admin', request.url));
      return NextResponse.next();
    }
    if (!hasValidAdminToken) return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  if (
    (pathname.startsWith('/ca-nhan') ||
      pathname.startsWith('/partner') ||
      pathname.startsWith('/lich-trinh') ||
      pathname.startsWith('/vip')) &&
    !hasValidUserToken
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

