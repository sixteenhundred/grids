"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { guestLogin } from "@/lib/demo-auth";
import { Button } from "@/components/dashboard/ui";
import { Field, AuthError } from "../auth-ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Something went wrong");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div>
      <Link href="/" className="mb-8 inline-block text-xl font-semibold tracking-tight text-white lg:hidden">
        Grid<span className="text-grid-blue">.</span>
      </Link>

      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">Welcome back.</h1>
      <p className="mt-2 text-sm text-white/55">Sign in to your Grid account.</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <Field label="Email" type="email" placeholder="you@studio.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field label="Password" type="password" placeholder="••••••••" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <AuthError>{error}</AuthError>
        <Button type="submit" full arrow disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {/* Demo mode — skip auth and explore the platform instantly. */}
      <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/30">
        <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
      </div>
      <button
        type="button"
        onClick={async () => {
          await guestLogin();
          router.push("/dashboard");
        }}
        className="mt-5 w-full rounded-full border border-white/15 bg-white/[0.04] py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
      >
        Continue as guest →
      </button>

      <p className="mt-8 text-center text-sm text-white/50">
        No account?{" "}
        <Link href="/signup" className="font-medium text-aerial-cyan transition-colors hover:text-white">
          Create one
        </Link>
      </p>
    </div>
  );
}
