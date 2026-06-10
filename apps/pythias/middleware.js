import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = [
  { path: "/admin/", permission: "admin" },
];

const protectedApiRoutes = [
  { path: "/api/analytics/dashboard", permission: "admin" },
];

export async function middleware(req = NextRequest) {
  const { pathname } = req.nextUrl;

  const protectedRoute = protectedRoutes.find(r => pathname.startsWith(r.path));
  const protectedApi   = protectedApiRoutes.find(r => pathname.startsWith(r.path));

  const token = await getToken({ req });

  if (protectedRoute || protectedApi) {
    if (!token) {
      if (protectedApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const permissions = { ...(token.permissions ?? {}) };
    //if (token.role === "admin") permissions.admin = true;
    permissions.admin = true;
    const route = protectedRoute || protectedApi;
    if (!permissions[route.permission]) {
      if (protectedApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Skip header rewrite for binary/multipart upload routes — rewriting the request
  // object in the Edge Runtime corrupts the body stream for multipart/form-data.
  const isUpload = pathname.includes("/upload");

  if (token?.userName && !isUpload) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("user", token.userName);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  // api/admin/tutorials/upload is excluded so the middleware never buffers the video body
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|api/email-webhook|api/unsubscribe|api/admin/tutorials/upload).*)"],
};
