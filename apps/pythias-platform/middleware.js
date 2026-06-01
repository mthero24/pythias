export { default } from "next-auth/middleware";

export const config = {
    matcher: [
        "/((?!login|register|api/auth|api/billing/webhook|_next/static|_next/image|favicon.ico|robots.js).*)",
    ],
};
