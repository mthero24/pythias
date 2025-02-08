import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "@/models/User";
const auth = NextAuth({
    providers: [
        Credentials({
            id: "credentials",
            name: "Credentials",
            credentials: {
                userName: {},
                passWord: {},
            },
            async authorize(credentials) {
                console.log("+++++++++++++++++", credentials);
                let userName = credentials.userName?.toLowerCase();
                const user = await User.findOne({ email: userName }).lean();
                console.log(user);
                if (!user) {
                    throw new Error("Invalid credentials, please try again!");
                }
                if (
                !user ||
                !(await bcrypt.compare(credentials.password, user.password))
                ) {
                    throw new Error("Invalid credentials, please try again!");
                }

                return user;
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        jwt: async ({ user, token, trigger, session }) => {
            if (user) {
                token = {
                ...token,
                userName: user.userName,
                role: user.isAdmin ? "admin" : user.type,
                firstName: user.firstName,
                lastName: user.lastName,
                };
            }
            console.log(token, "jwt")
            return token;
        },
        session: ({ session, token }) => {
        session.user = {
            ...session.user,
            firstName: token.firstName,
            lastName: token.lastName,
            userName: token.userName,
            _id: token._id,
            role: token.role,
        };
        console.log(token, "session");
        return session;
        },
    },
    pages: {
        signIn: "/login",
    },
});

export { auth as GET, auth as POST };