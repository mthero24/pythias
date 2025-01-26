import NextAuth from "next-auth";
import CredentialProvider from "next-auth/providers/credentials";
import User from "../../../models/User";
// 'invalid json response body at https://printoracle.com/api/auth/session reason: Unexpected token < in JSON at position 0'

export const authOptions = {
  secret: process.env.NEXT_AUTH_SECRET,
  providers: [
    CredentialProvider({
      type: "credentials",
      name: "credentials",
      credentials: {
        username: {
          label: "Email",
          type: "email",
          placeholder: "johndoe@test.com",
        },
        password: {
          label: "password",
          type: "password",
        },
      },
      async authorize(credentials, req) {


        // let fakeUser = await User.findOne({email: 'matt@davisonmc.org'});
        // return fakeUser;

        console.log(credentials, "cred");
        let user = await User.findOne({ email: credentials.email });
        if (user) {
          let authorized = await user.comparePassword(credentials.password);
          if (authorized) {
            return user;
          }
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    onError: async (error, _req, res) => {
      // Handle the error gracefully
      console.error("NextAuth Error:", error);
      res.status(500).json({ error: "Error Code 12345" });
    },
  },
  theme: {
    colorScheme: "light", // "auto" | "dark" | "light"
  },
  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);
