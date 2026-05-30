"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Same-origin in the browser; falls back to the env var for SSR/native use.
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
