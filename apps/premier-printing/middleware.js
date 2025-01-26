import { NextResponse, userAgent } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = [
  {
    path: "/admin",
    roles: ["admin"],
  },
  {
    path: "/account",
    roles: ["admin", "user"],
  },
  {
    path: "/production",
    roles: ["admin", "user"],
  },
  {
    path: "/api/admin",
    roles: ["admin"],
  },
  {
    path: "/api/production",
    roles: ["admin"],
  },
  {
    path: "/api/account",
    roles: ["customer", "admin", "user"],
  },
];

export async function middleware(req) {
    const protectedRoute = protectedRoutes.find((route) =>
      pathname.startsWith(route.path)
    );
    if (protectedRoute) {
      const token = await getToken({ req });
      console.log(token, "__TOKEN__");
      const role = token?.role;
      console.log(role, "__ROLE__");
      if (!protectedRoute.roles.includes(role)) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
    return NextResponse.next({
      request: {
        // New request headers
        headers: requestHeaders,
      },
    });
}