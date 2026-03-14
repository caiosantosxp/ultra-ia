import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

/**
 * Edge-compatible auth config (no Node.js-only imports).
 * Used by middleware and extended by auth.ts with the Prisma adapter.
 * JWT/session callbacks live here so req.auth.user.role is available in middleware.
 */
export const authConfig = {
  session: { strategy: 'jwt' as const },
  pages: {
    signIn: '/login',
    newUser: '/register',
    error: '/auth/error',
  },
  providers: [
    Google({ clientId: '', clientSecret: '' }),
    Credentials({ authorize: async () => null }),
  ],
  callbacks: {
    authorized({ auth }) {
      return !!auth;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
