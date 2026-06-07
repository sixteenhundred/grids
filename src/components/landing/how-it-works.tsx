"use client";

import { useAudience } from "./audience";
import { Reveal } from "./reveal";
import { Stagger, StaggerItem } from "./motion";

const STEPS = {
  client: [
    {
      n: "01",
      title: "Find verified talent",
      body: "Search photographers, filmmakers and drone pilots by category, city, rate, rating and portfolio.",
    },
    {
      n: "02",
      title: "Book & fund securely",
      body: "Pick a package, sign a digital contract and fund the job. Payment is held safely until you approve the work.",
    },
    {
      n: "03",
      title: "Approve & release",
      body: "Track every stage from planning to delivery. Approve the final media and release payment in one tap.",
    },
  ],
  creator: [
    {
      n: "01",
      title: "Build your profile",
      body: "Get verified, upload your portfolio and package your services with clear day rates and deliverables.",
    },
    {
      n: "02",
      title: "Get booked",
      body: "Receive bookings and apply to urgent and long-term jobs. Sign the contract, and funds are secured before you start.",
    },
    {
      n: "03",
      title: "Deliver & get paid",
      body: "Move the project through stages, deliver the media and get paid on time, every time. Build your reputation.",
    },
  ],
};

export function HowItWorks() {
  const { audience } = useAudience();
  const steps = STEPS[audience];

  return (
    <section id="how" className="relative px-4 py-24 sm:px-6 md:py-36">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-14 max-w-2xl">
          <h2 className="text-balance text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            {audience === "client"
              ? "From brief to booking in minutes."
              : "From profile to paid in three steps."}
          </h2>
        </Reveal>

        <Stagger className="grid gap-4 md:grid-cols-3 md:gap-5" stagger={0.12}>
          {steps.map((s) => (
            <StaggerItem key={s.n} className="h-full">
              <div className="group relative h-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-1.5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:bg-white/[0.05]">
                <div className="flex h-full flex-col rounded-[calc(2rem-0.375rem)] bg-[radial-gradient(120%_120%_at_0%_0%,#141519_0%,#0a0b0d_70%)] p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
                  <span className="font-mono text-sm text-white/55">{s.n}</span>
                  <h3 className="mt-10 text-xl font-semibold tracking-tight text-white">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">
                    {s.body}
                  </p>
                  <div
                    className={`mt-8 h-px w-full origin-left scale-x-0 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-x-100 ${
                      audience === "client"
                        ? "bg-gradient-to-r from-aerial-cyan to-transparent"
                        : "bg-gradient-to-r from-grid-blue to-transparent"
                    }`}
                  />
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
