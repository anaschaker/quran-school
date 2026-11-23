import { NextRequest, NextResponse } from "next/server";

import {
  getRequiredRole,
  ROLE_HOME,
  SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // صفحة الحساب متاحة لأي مستخدم مسجّل.
  const isAccountRoute =
    pathname === "/account" || pathname.startsWith("/account/");

  if (isAccountRoute) {
    if (!session) {
      const response = NextResponse.redirect(new URL("/login", request.url));

      if (token) {
        response.cookies.delete(SESSION_COOKIE);
      }

      return response;
    }

    return NextResponse.next();
  }

  // المستخدم المسجّل لا يحتاج صفحة الدخول.
  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
    }

    return NextResponse.next();
  }

  // إجبار المستخدم على تغيير كلمة المرور المؤقتة.
  if (
    session?.mustChangePassword &&
    pathname !== "/account" &&
    !pathname.startsWith("/account/")
  ) {
    return NextResponse.redirect(new URL("/account?force=1", request.url));
  }

  // صندوق الرسائل والإشعارات متاح لكل الأدوار المسجّلة.
  const isSharedInboxRoute =
    pathname === "/messages" ||
    pathname.startsWith("/messages/") ||
    pathname === "/notifications" ||
    pathname.startsWith("/notifications/");

  if (isSharedInboxRoute) {
    if (!session) {
      const response = NextResponse.redirect(new URL("/login", request.url));

      if (token) {
        response.cookies.delete(SESSION_COOKIE);
      }

      return response;
    }

    return NextResponse.next();
  }

  const requiredRole = getRequiredRole(pathname);

  if (!requiredRole) {
    return NextResponse.next();
  }

  if (!session) {
    const response = NextResponse.redirect(new URL("/login", request.url));

    // إزالة أي جلسة غير صالحة أو منتهية.
    if (token) {
      response.cookies.delete(SESSION_COOKIE);
    }

    return response;
  }

  // منع المستخدم من الوصول إلى مسارات أدوار أخرى.
  if (session.role !== requiredRole) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/account",
    "/account/:path*",
    "/messages",
    "/messages/:path*",
    "/notifications",
    "/notifications/:path*",
    "/admin",
    "/admin/:path*",
    "/teacher",
    "/teacher/:path*",
    "/student",
    "/student/:path*",
    "/parent",
    "/parent/:path*",
  ],
};
