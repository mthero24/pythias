import CredentialsProvider from "next-auth/providers/credentials";
import User from "../../../../models/User";
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
        console.log("+++++++++++++++++", credentials)
        let userName = credentials.userName.toLowerCase();
        const user = await User.findOne({ userName: userName }).lean();
        
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
  callbacks: {
    jwt: async ({ user, token, trigger, session }) => {
      if (user) {
        token = {
          ...token,
          userName: user.userName,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
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
        _id: token._id,
        role: token.role,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login?error=afddsa"
  },
};
