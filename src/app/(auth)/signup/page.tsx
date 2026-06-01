"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { guestLogin } from "@/lib/demo-auth";
import { Button } from "@/components/dashboard/ui";
import { Icon } from "@/components/dashboard/icons";
import type { Role } from "@/lib/grid-data";
import { Field, AuthError } from "../auth-ui";

const CHOICES: { id: Role; label: string; desc: string; icon: "camera" | "building" }[] = [
  { id: "creator", label: "I create", desc: "Get booked & paid", icon: "camera" },
  { id: "client", label: "I'm hiring", desc: "Book visual talent", icon: "building" },
];

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("creator");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signUp.email({ name, email, password });
    if (error) {
      setLoading(false);
      setError(error.message ?? "Something went wrong");
      return;
    }
    // Open the dashboard on the side the user picked.
    try {
      localStorage.setItem("grid:role", role);
    } catch {
      /* ignore */
    }
    router.push("/dashboard");
  }

  const green = role === "client";

  return (
    <div>
      <Link href="/" className="mb-8 inline-block text-xl font-semibold tracking-tight text-white lg:hidden">
        Grid<span className="text-grid-blue">.</span>
      </Link>

      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">Create your account.</h1>
      <p className="mt-2 text-sm text-white/55">Free to start — whether you’re hiring or getting booked.</p>

      {/* Role choice */}
      <div className="mt-7 grid grid-cols-2 gap-3">
        {CHOICES.map((c) => {
          const active = role === c.id;
          const ring = c.id === "client" ? "border-client-green/50 bg-client-green/10" : "border-grid-blue/50 bg-grid-blue/10";
          const tint = c.id === "client" ? "text-escrow-green" : "text-aerial-cyan";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setRole(c.id)}
              aria-pressed={active}
              className={`flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${active ? ring : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] ${active ? tint : "text-white/55"}`}>
                <Icon name={c.icon} size={19} />
              </span>
              <span className="text-sm font-semibold text-white">{c.label}</span>
              <span className="text-xs text-white/45">{c.desc}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <Field label="Full name" type="text" placeholder="Jane Doe" autoComplete="name" accent={green ? "green" : "blue"} value={name} onChange={(e) => setName(e.target.value)} required />
        <Field label="Email" type="email" placeholder="you@studio.com" autoComplete="email" accent={green ? "green" : "blue"} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field label="Password" type="password" placeholder="At least 8 characters" autoComplete="new-password" accent={green ? "green" : "blue"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <AuthError>{error}</AuthError>
        <Button type="submit" full arrow tone={green ? "green" : "blue"} disabled={loading}>
          {loading ? "Creating…" : `Create ${green ? "client" : "creator"} account`}
        </Button>
        <p className="text-center text-xs leading-relaxed text-white/40">
          By creating an account you agree to Grid&apos;s{" "}
          <Link href="/terms" className="text-white/60 underline-offset-2 transition-colors hover:text-white hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </form>

      {/* Demo mode — skip signup and explore the platform instantly. */}
      <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/30">
        <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            localStorage.setItem("grid:role", role);
          } catch {
            /* ignore */
          }
          await guestLogin();
          router.push("/dashboard");
        }}
        className="mt-5 w-full rounded-full border border-white/15 bg-white/[0.04] py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
      >
        Continue as guest →
      </button>

      <p className="mt-8 text-center text-sm text-white/50">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-aerial-cyan transition-colors hover:text-white">
          Sign in
        </Link>
      </p>
    </div>
  );
}
