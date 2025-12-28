import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Passkey from "next-auth/providers/passkey";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma) as Adapter,
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { username: credentials.username as string },
                });

                if (!user) {
                    return null;
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!passwordMatch) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.hoTen,
                    email: user.username, // Dùng username làm định danh
                    role: user.role,
                    mustChangePassword: user.mustChangePassword,
                };
            },
        }),
        Passkey,
    ],
    experimental: {
        enableWebAuthn: true,
    },
    callbacks: {
        async jwt({ token, user, account }) {
            // For Credentials login, user object contains all info
            if (user) {
                token.role = user.role;
                token.mustChangePassword = user.mustChangePassword;
                if (user.id) {
                    token.id = user.id;
                }
            }

            // For Passkey login, need to fetch user data from database
            if (account?.provider === "passkey" && token.sub) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.sub },
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.name = dbUser.hoTen;
                    token.role = dbUser.role;
                    token.mustChangePassword = dbUser.mustChangePassword;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
                session.user.name = token.name as string;
                session.user.mustChangePassword = token.mustChangePassword as boolean;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    trustHost: true,
});
