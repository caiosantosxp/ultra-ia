import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations/auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // @ts-expect-error — @auth/prisma-adapter@2.11.1 uses @auth/core@0.41.1; next-auth bundles 0.41.0 (minor version mismatch, safe to ignore)
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/login',
    newUser: '/register',
    error: '/auth/error',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.password) return null;

        const isValid = await bcrypt.compare(parsed.data.password, user.password);
        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role: import('@prisma/client').Role }).role;
      }
      return session;
    },
  },
});
