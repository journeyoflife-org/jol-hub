import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import type { User } from 'next-auth';

// =============================================================================
// Admin Dashboard Authentication Configuration
// =============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Extended User type for admin dashboard
 */
interface AdminUser extends User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin' | 'support';
  image?: string;
  permissions: string[];
  accessToken: string;
  refreshToken: string;
}

/**
 * Token response from Django backend
 */
interface TokenResponse {
  access: string;
  refresh: string;
  user: AdminUser;
}

/**
 * NextAuth options for admin dashboard
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@jol-hub.eu' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Development mock authentication (when backend is unavailable)
        if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
          console.log('[AUTH] Using mock authentication for development');
          
          // Mock users for development
          const mockUsers: Record<string, AdminUser> = {
            'admin@jol-hub.eu': {
              id: '1',
              email: 'admin@jol-hub.eu',
              name: 'Admin User',
              role: 'super_admin',
              permissions: ['read', 'write', 'delete', 'admin'],
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
            },
            'support@jol-hub.eu': {
              id: '2',
              email: 'support@jol-hub.eu',
              name: 'Support User',
              role: 'support',
              permissions: ['read', 'write'],
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
            },
          };

          const mockUser = mockUsers[credentials.email];
          if (mockUser && credentials.password === 'admin123') {
            return mockUser;
          }
          
          // If mock fails, try real backend
          console.log('[AUTH] Mock auth failed, trying backend...');
        }

        try {
          const response = await fetch(`${API_URL}/auth/login/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Authentication failed');
          }

          const data: TokenResponse = await response.json();

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            image: data.user.image,
            role: data.user.role,
            permissions: data.user.permissions,
            accessToken: data.access,
            refreshToken: data.refresh,
          };
        } catch (error) {
          console.error('[AUTH] Authorization error:', error);
          throw error;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        const adminUser = user as AdminUser;
        return {
          ...token,
          accessToken: adminUser.accessToken,
          refreshToken: adminUser.refreshToken,
          role: adminUser.role,
          permissions: adminUser.permissions,
          userId: adminUser.id,
        };
      }

      // Return previous token if still valid
      if (Date.now() < ((token.accessTokenExpires as number) || 0)) {
        return token;
      }

      // Token expired - try to refresh
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.userId as string,
          role: token.role as string,
          permissions: token.permissions as string[],
        },
        accessToken: token.accessToken as string,
        refreshToken: token.refreshToken as string,
        error: token.error as string | undefined,
      };
    },
  },

  events: {
    async signIn({ user }) {
      console.log(`[AUTH] Admin signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`[AUTH] Admin signed out: ${token.email}`);
      // Notify backend about logout
      try {
        await fetch(`${API_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
          },
        });
      } catch (error) {
        console.error('[AUTH] Logout notification failed:', error);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

/**
 * Refresh expired access token
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: token.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const refreshedTokens = await response.json();

    return {
      ...token,
      accessToken: refreshedTokens.access,
      accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };
  } catch (error) {
    console.error('[AUTH] Token refresh error:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
