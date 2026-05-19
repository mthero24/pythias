import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = [
  { path: "/admin",          roles: ["admin"] },
  {
    path: "/admin/shopify",
    roles: ["admin"],
    permission: "integrations"
  },
  {
    path: "/admin/sales",
    roles: ["admin"],
  },
  {
    path: "/api/admin/shopify",
    roles: ["admin"],
    permission: "integrations"
  },
  { path: "/account",        roles: ["admin", "production"] },
  { path: "/",               roles: ["admin", "production"] },
  { path: "/production",     roles: ["admin", "production"] },
  { path: "/api/admin",      roles: ["admin", "production"] },
  { path: "/api/production", roles: ["admin", "production"] },
  { path: "/api/account",    roles: ["admin", "production"] },
];

export async function middleware(req = NextRequest) {
    const token = await getToken({ req });
    const me    = token?.userName ?? token?.email;
    const role  = token?.role;

    const protectedRoute = protectedRoutes.find(r =>
        req.nextUrl.pathname.startsWith(r.path)
    );

    if (
        protectedRoute &&
        !req.nextUrl.pathname.includes("login") &&
        !req.nextUrl.pathname.includes("/api/production/synergy")
    ) {
        if (!protectedRoute.roles.includes(role)) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    const requestHeaders = new Headers(req.headers);
    if (me) requestHeaders.set("user", me);
    return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
