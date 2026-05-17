import NextAuth from "next-auth";
import { authOptions } from "@/auth";
const auth = NextAuth(authOptions);
export { auth as GET, auth as POST };