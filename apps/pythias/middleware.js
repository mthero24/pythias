import {NextRequest, NextResponse, userAgent } from "next/server";
import { getToken } from "next-auth/jwt";
const protectedRoutes = [
  {
    path: "/admin/",
    roles: ["admin"],
    permission: "admin"
  },
];

export async function middleware(req=NextRequest, res) {
  const protectedRoute = protectedRoutes.find((route) =>
      req.nextUrl.pathname.startsWith(route.path)
    );
  const requestHeaders = new Headers(req.headers)
  const token = await getToken({ req });
  if (protectedRoute) {
    const permissions = token && token.permissions? token.permissions: {}
    if(token) permissions.account = true
    if (!permissions[protectedRoute.permission]) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }
  if(token){
    requestHeaders.set('user', token.userName)
  }
  return NextResponse.next({
    request: {
      // New request headers
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};