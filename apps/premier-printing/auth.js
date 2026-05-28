import CredentialsProvider from "next-auth/providers/credentials";
import { User } from "@pythias/mongo";
import bcrypt from "bcryptjs";

const secureCookies = process.env.NEXTAUTH_URL?.startsWith("https://");
const cookieDomain  = process.env.NEXTAUTH_COOKIE_DOMAIN || undefined;

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge:    30 * 24 * 60 * 60, // 30 days
    updateAge: 30 * 24 * 60 * 60, // only reissue token at expiry, not every 24h
  },
  // Secure, domain-scoped cookies in production; plain cookies in dev
  cookies: {
    sessionToken: {
      name: secureCookies ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: !!secureCookies,
        domain: cookieDomain,
      },
    },
    callbackUrl: {
      name: secureCookies ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: !!secureCookies,
        domain: cookieDomain,
      },
    },
    csrfToken: {
      name: secureCookies ? "__Secure-next-auth.csrf-token" : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: !!secureCookies,
        domain: cookieDomain,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        userName: {},
        password: {},
      },
      async authorize(credentials) {
        const userName = credentials.userName;
        const user = await User.findOne({ userName }).lean();
        if (!user) throw new Error("Invalid credentials, please try again!");
        if (!(await bcrypt.compare(credentials.password, user.password))) {
          throw new Error("Invalid credentials, please try again!");
        }

        return { ...user };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ user, token }) => {
      if (user) {
        token = {
          ...token,
          userName: user.userName,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          permissions: user.permissions,
        };
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user = {
        ...session.user,
        firstName: token.firstName,
        lastName: token.lastName,
        userName: token.userName,
        permissions: token.permissions,
        _id: token._id,
        role: token.role,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
