"use server";

/**
 * Built-in demo login.
 *
 * A single hard-coded account that works on ANY deployment — even one with no
 * database — by setting a signed-in cookie. Lets you show the full product
 * without provisioning auth/DB. Real Better Auth login still works alongside it.
 *
 * Remove this file (and its callers) to disable the demo account for production.
 */

import { cookies } from "next/headers";
import { DEMO_COOKIE } from "./demo";

const DEMO_EMAIL = (process.env.DEMO_EMAIL ?? "joingrid@demo.com").toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "joingrid2026";

/** Returns true and signs in if the credentials match the demo account. */
export async function demoLogin(email: string, password: string): Promise<boolean> {
  if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
    const jar = await cookies();
    jar.set(DEMO_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return true;
  }
  return false;
}

/** Enter as a guest — sets the demo session cookie with no credentials.
 *  Powers the "Continue as guest" path so the platform can be showcased
 *  without filling in login/signup. */
export async function guestLogin(): Promise<void> {
  const jar = await cookies();
  jar.set(DEMO_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function demoLogout(): Promise<void> {
  const jar = await cookies();
  jar.delete(DEMO_COOKIE);
}

export async function hasDemoSession(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(DEMO_COOKIE)?.value === "1";
}
