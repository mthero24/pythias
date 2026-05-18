import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  session: {
    strategy: "jwt",
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
    error: "/login?error=afddsa",
  },
};
