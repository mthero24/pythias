import {NextRequest, NextResponse, userAgent } from "next/server";
import { getToken } from "next-auth/jwt";
const protectedRoutes = [
  {
    path: "/admin/blanks",
    roles: ["admin"],
    permission: "blanks"
  },
  {
    path: "/admin/colors",
    roles: ["admin"],
    permission: "colors"
  },
  {
    path: "/admin/register",
    roles: ["admin"],
    permission: "register"
  },
  {
    path: "/admin/license",
    roles: ["admin"],
    permission: "licenses"
  },
  {
    path: "/admin/designs",
    roles: ["admin", "production"],
    permission: "designsView"
  },
  {
    path: "/orders",
    roles: ["admin", "production"],
    permission: "orders"
  },
  {
    path: "/admin/design",
    roles: ["admin", "production"],
    permission: "designsView"
  },
  {
    path: "/account",
    roles: ["admin", "production"],
    permission: "account"
  },
  {
    path: "/production",
    roles: ["admin", "production"],
    permission: "production"
  },
  {
    path: "/inventory",
    roles: ["admin", "production"],
    permission: "inventory"
  },
  {
    path: "/payouts",
    roles: ["admin"],
    permission: "integrations"
  },
  {
    path: "/quotes",
    roles: ["admin", "production"],
    permission: "orders"
  },
  {
    path: "/admin/shopify",
    roles: ["admin"],
    permission: "integrations"
  },
  {
    path: "/admin/sales",
    roles: ["admin"],
    permission: "integrations"
  },
  {
    path: "/api/admin/shopify",
    roles: ["admin"],
    permission: "integrations"
  },
  {
    path: "/admin/fix-upc",
    roles: ["admin", "production"],
    permission: "upc"
  },
   {
    path: "/admin/integrations",
    roles: ["admin", "production"],
    permission: "integrations"
  },
  {
    path: "/admin/users",
    roles: ["admin", "production"],
    permission: "users"
  },
  {
    path: "/admin/product",
    roles: ["admin", "production"],
    permission: "products"
  },
   {
    path: "/api/admin/blanks",
    roles: ["admin", "production"],
    permission: "blanks"
  },
  {
    path: "/api/admin/create-csv",
    roles: ["admin", "production"],
    permission: "products"
  },
  {
    path: "/api/admin/colors",
    roles: ["admin", "production"],
    permission: "colors"
  },
  {
    path: "/api/admin/designs",
    roles: ["admin", "production"],
    permission: "designs"
  },
   {
    path: "/api/admin/integrations",
    roles: ["admin", "production"],
    permission: "integrations"
  },
  {
    path: "/api/admin/users",
    roles: ["admin", "production"],
    permission: "users"
  },
  {
    path: "/api/production",
    roles: ["admin", "production"],
    permission: "production"
  },
   {
    path: "/api/orders",
    roles: ["admin", "production"],
    permission: "orders"
  },
  {
    path: "/api/account",
    roles: ["admin", "production"],
  },
  {
    path: "/api/admin",
    roles: ["admin", "production"],
    permission: "charts"
  },
  {
    path: "/admin",
    roles: ["admin", "production"],
    permission: "charts"
  },
];

export async function middleware(req=NextRequest, res) {
  console.log("Middleware running for path:", req.nextUrl.pathname)
  const protectedRoute = protectedRoutes.find((route) =>
      req.nextUrl.pathname.startsWith(route.path)
    );
  const requestHeaders = new Headers(req.headers)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (protectedRoute) {
    // Unauthenticated users are always redirected
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    const permissions = { ...(token.permissions || {}) };
    // Grants available to all authenticated users
    permissions.account = true;
    permissions.inventory = true;
    permissions.designsView = true;
    // Only check permission when the route actually requires one
    if (protectedRoute.permission && !permissions[protectedRoute.permission]) {
      // Authenticated but lacks permission — send to home, not login
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  if(token){
    requestHeaders.set('user', token.userName)
    const perms = { ...(token.permissions || {}), account: true, inventory: true, designsView: true };
    if (perms.charts) requestHeaders.set('canPayInvoice', '1');
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