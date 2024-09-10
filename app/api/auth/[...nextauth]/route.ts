import NextAuth, { DefaultUser, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Add this type declaration
declare module "next-auth" {
  interface User extends DefaultUser {
    accessToken?: string;
    role?: string;
  }
  interface Session {
    accessToken?: string;
    role?: string;
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }
        try {
          const url = `${process.env.NEXT_PUBLIC_API_URL}/login`;
          const body = {
            email: credentials.email,
            password: credentials.password
          };

          console.log('Attempting to authenticate with URL:', url);
          console.log('Request body:', body);

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });
      
          const data = await response.json();
          console.log('Authentication response:', data);

          if (response.ok && data.token) {
            console.log('JWT received from API:', data.token);
            return {
              id: data.userId,
              email: credentials.email,
              accessToken: data.token,
              role: data.role
            };
          } else {
            console.error('Invalid response from server:', data);
            throw new Error(data.message || "Invalid credentials");
          }
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error("Authentication failed");
        }
      }      
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback - token:', token);
      return {
        ...session,
        accessToken: token.accessToken as string | undefined,
        role: token.role as string | undefined,
      };
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
