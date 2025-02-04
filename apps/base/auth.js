import CredentialsProvider from "next-auth/providers/credentials";
import User from "./models/User";
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
      async authorize(credentials, req) {
        var salt = bcrypt.genSaltSync(10);
        console.log("+++++++++++++++++", credentials)
        let userName = credentials.userName.toLowerCase();
        const user = await User.findOne({ email: userName }).lean();
        console.log(user.type, await bcrypt.compare(credentials.password, user.password))
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
          userName: user.email,
          role: user.type,
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
      console.log(session, "session", token, "token")
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
};
