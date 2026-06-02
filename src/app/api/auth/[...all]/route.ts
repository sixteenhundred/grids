import { NextResponse } from "next/server";

/**
 * Better Auth has been retired in favour of Supabase Auth (Supabase serves its
 * own auth endpoints). This catch-all is inert; kept only so old links 410
 * rather than 404. Safe to delete in the cleanup pass.
 */
const gone = () => NextResponse.json({ error: "Gone — auth moved to Supabase." }, { status: 410 });

export const GET = gone;
export const POST = gone;
