import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Grid waitlist",
  description:
    "Run your full production operation from Grid — files, payments, contracts and more. Join the waitlist for early access.",
};

// Pre-launch teaser: a slowly-shifting colour field with a liquid-glass headline.
export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ colorScheme: "dark" }} className="min-h-dvh w-full bg-[#04060c] text-white">
      {children}
    </div>
  );
}
