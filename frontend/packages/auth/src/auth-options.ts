import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { Bitrix24Provider } from './providers/bitrix24';
import type { JWTTokenPayload, Session } from './types';

/**
 * Bitrix24 profile returned from OAuth.
 */
export interface Bitrix24Profile {
  id: string;
  name: string;
  email: string;
  image?: string;
  bitrixId: string;
  bitrixDomain: string;
}

/**
 * NextAuth configuration options for JOL-HUB.
 */
export const authOptions: NextAuthOptions = {
  providers: [Bitrix24Provider()],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  callbacks: {
    async signIn({ user: _user, account, profile: _profile }) {
      // Allow sign in only for verified Bitrix24 users
      if (account?.provider === 'bitrix24') {
        // Add any additional validation here
        return true;
      }
      return false;
    },

    async jwt({ token, account, user }): Promise<JWT> {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            bitrixId: account.providerAccountId,
            bitrixDomain: extractDomain(account),
          },
        } as JWT;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < ((token as unknown as JWTTokenPayload).accessTokenExpires as number)) {
        return token as JWT;
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token as unknown as JWTTokenPayload);
    },

    async session({ session, token }): Promise<Session> {
      const jwtToken = token as unknown as JWTTokenPayload;

      return {
        ...session,
        accessToken: jwtToken.accessToken,
        refreshToken: jwtToken.refreshToken,
        expiresAt: jwtToken.accessTokenExpires,
        user: {
          ...session.user,
          id: jwtToken.user?.id ?? '',
          email: jwtToken.user?.email ?? '',
          name: jwtToken.user?.name,
          image: jwtToken.user?.image,
          bitrixId: jwtToken.user?.bitrixId,
          bitrixDomain: jwtToken.user?.bitrixDomain,
        },
      } as Session;
    },
  },

  events: {
    async signIn({ user, account: _account, isNewUser }) {
      console.log(`User signed in: ${user.email}, new: ${isNewUser}`);
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token.email}`);
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

/**
 * Extracts the Bitrix24 domain from account info.
 */
function extractDomain(_account: { providerAccountId?: string }): string {
  const authDomain = process.env.BITRIX_AUTH_URL;
  if (authDomain) {
    try {
      const url = new URL(authDomain);
      return url.hostname;
    } catch {
      return '';
    }
  }
  return '';
}

/**
 * Refreshes an expired access token using the refresh token.
 */
async function refreshAccessToken(token: JWTTokenPayload): Promise<JWT> {
  try {
    const authDomain = process.env.BITRIX_AUTH_URL;
    const clientId = process.env.BITRIX_CLIENT_ID;
    const clientSecret = process.env.BITRIX_CLIENT_SECRET;

    if (!authDomain || !clientId || !clientSecret) {
      throw new Error('Missing Bitrix24 OAuth configuration');
    }

    const response = await fetch(
      `${authDomain}/oauth/token/?grant_type=refresh_token&client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${token.refreshToken}`,
      {
        method: 'GET',
      }
    );

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      accessToken: '',
      refreshToken: '',
      accessTokenExpires: 0,
    };
  }
}
