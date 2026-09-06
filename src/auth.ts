import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "pmleague-temporary-secret-change-me";

if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.warn(
    "[auth] AUTH_SECRET is not set. Using temporary fallback secret. Configure AUTH_SECRET in Vercel."
  );
}

const isProduction = process.env.NODE_ENV === "production";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        userId: { label: "ユーザーID", type: "text" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.userId || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { userId: credentials.userId as string },
        });

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

        return {
          id: user.id,
          name: user.name,
          userId: user.userId,
          role: user.role,
          teamId: user.teamId,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.userId = (user as any).userId;
        token.role = (user as any).role;
        token.teamId = (user as any).teamId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).userId = token.userId;
        (session.user as any).role = token.role;
        (session.user as any).teamId = token.teamId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/Login",
  },
  cookies: {
    sessionToken: {
      name: isProduction ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  trustHost: true,
});