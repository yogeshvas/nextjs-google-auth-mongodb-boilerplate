import NextAuth from "next-auth";
import User from "@/models/user";
import connectToDatabase from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
const handler = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGlE_CLIENT_SECRET as string,
    }),
    // CredentialsProvider({
    //   name: "Credentials",
    //   credentials: {
    //     email: {},
    //     password: {},
    //   },
    //   async authorize(credentials) {
    //     try {
    //       await connectToDatabase();
    //       const user = await User.findOne({ email: credentials?.email });
    //       if (!user) {
    //         throw new Error("");
    //       }
    //       const isValidPassword = await bcrypt.compare(
    //         credentials?.password ?? "",
    //         user.password as string
    //       );
    //       if (!isValidPassword) {
    //         throw new Error("");
    //       }
    //       return user;
    //     } catch {
    //       return null;
    //     }
    //   },
    // }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        await connectToDatabase();
        const existingUser = await User.findOne({ email: profile?.email });
        if (!existingUser) {
          await User.create({
            name: profile?.name,
            email: profile?.email,
          });
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          email: token.email,
          name: token.name,
          image: token.picture,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  secret: process.env.AUTH_SECRET,
});
export { handler as GET, handler as POST };
