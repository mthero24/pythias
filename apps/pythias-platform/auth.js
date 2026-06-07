import CredentialsProvider from "next-auth/providers/credentials";
import { PlatformUser, Organization } from "@pythias/mongo";
import bcrypt from "bcryptjs";

const secureCookies = process.env.NEXTAUTH_URL?.startsWith("https://");
const cookieDomain = process.env.NEXTAUTH_COOKIE_DOMAIN || undefined;

export const authOptions = {
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
        updateAge: 30 * 24 * 60 * 60,
    },
    cookies: {
        sessionToken: {
            name: secureCookies ? "__Secure-next-auth.session-token" : "next-auth.session-token",
            options: { httpOnly: true, sameSite: "lax", path: "/", secure: !!secureCookies, domain: cookieDomain },
        },
        callbackUrl: {
            name: secureCookies ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
            options: { sameSite: "lax", path: "/", secure: !!secureCookies, domain: cookieDomain },
        },
        csrfToken: {
            name: secureCookies ? "__Secure-next-auth.csrf-token" : "next-auth.csrf-token",
            options: { httpOnly: true, sameSite: "lax", path: "/", secure: !!secureCookies, domain: cookieDomain },
        },
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: { email: {}, password: {} },
            async authorize(credentials) {
                const user = await PlatformUser.findOne({ email: credentials.email }).lean();
                if (!user) throw new Error("Invalid credentials");
                if (!(await bcrypt.compare(credentials.password, user.password))) {
                    throw new Error("Invalid credentials");
                }
                if (!user.isActive) throw new Error("Account disabled");
                const org = await Organization.findById(user.orgId).lean();
                if (!org || org.status === 'cancelled') throw new Error("Organization not found");
                return { ...user, org };
            },
        }),
    ],
    callbacks: {
        jwt: async ({ user, token }) => {
            if (user) {
                token = {
                    ...token,
                    userId: user._id?.toString(),
                    orgId: user.orgId?.toString(),
                    email: user.email,
                    userName: user.userName,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    permissions: user.permissions,
                    avatar: user.avatar,
                    orgTier: user.org?.tier,
                    orgSlug: user.org?.slug,
                    orgName: user.org?.name,
                    orgStatus: user.org?.status,
                    orgType: user.org?.orgType ?? "fulfillment",
                };
            }
            return token;
        },
        session: ({ session, token }) => {
            session.user = {
                ...session.user,
                userId: token.userId,
                orgId: token.orgId,
                email: token.email,
                userName: token.userName,
                firstName: token.firstName,
                lastName: token.lastName,
                role: token.role,
                permissions: token.permissions,
                avatar: token.avatar,
                orgTier: token.orgTier,
                orgSlug: token.orgSlug,
                orgName: token.orgName,
                orgStatus: token.orgStatus,
                orgType: token.orgType ?? "fulfillment",
            };
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
};
