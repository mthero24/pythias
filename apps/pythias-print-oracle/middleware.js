import {NextRequest, NextResponse, userAgent } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = [
  {
    path: "/admin",
    roles: ["admin"],
  },
  {
    path: "/account",
    roles: ["admin", "production"],
  },
  {
    path: "/",
    roles: ["admin", "production"],
  },
  {
    path: "/production",
    roles: ["admin", "production"],
  },
  {
    path: "/api/admin",
    roles: ["admin", "production"],
  },
  {
    path: "/api/production",
    roles: ["admin", "production"],
  },
  {
    path: "/api/account",
    roles: ["admin", "production"],
  },
];

export async function middleware(req=NextRequest) {
    const protectedRoute = protectedRoutes.find((route) =>
       req.nextUrl.pathname.startsWith(route.path)
     );
    if (protectedRoute) {
      const token = await getToken({ req });
      console.log(token, "__TOKEN__");
      const role = token?.role;
      console.log(role, "__ROLE__");
      if (!protectedRoute.roles.includes(role)) {
        return NextResponse.redirect(new URL("/production/login", req.url));
      }
    }
    return NextResponse.next({
      request: {
        // New request headers
        //headers: requestHeaders,
      },
    });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};