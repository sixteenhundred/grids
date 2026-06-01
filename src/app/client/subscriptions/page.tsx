"use client";

import { useRouter } from "next/navigation";
import { OperationBackground } from "@/components/dashboard/operation-bg";
import { ClientPlanCard } from "@/components/dashboard/client-plan-card";
import { ClientComparison } from "@/components/dashboard/client-comparison";
import { Surface, Button, Icon } from "@/components/dashboard/ui";
import { useClient } from "@/components/client/client-context";
import {
  CLIENT_TIERS,
  ENTERPRISE_SHOWCASE,
  CLIENT_BG,
  type ClientTier,
} from "@/lib/client-plans";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const INVEST_TAGS = [
  "Less chaos",
  "Less searching",
  "Less friction",
  "More visibility",
  "More structure",
  "More execution",
] as const;

export default function ClientSubscriptionsPage() {
  const router = useRouter();
  const { setPlan, toast } = useClient();

  // Demo wiring: choosing a paid plan switches the active plan and drops you
  // straight into the workspace. No payment, no contact sheet.
  const onCardContact = (tier: ClientTier) => {
    if (tier.id === "enterprise") {
      setPlan("enterprise");
      toast("Enterprise plan activated");
      router.push("/client/dashboard");
    } else {
      setPlan("agency");
      toast("Agency plan activated");
      router.push("/client/dashboard");
    }
  };

  const startFree = () => {
    setPlan("free");
    toast("Free plan activated");
    router.push("/client/onboarding");
  };

  const talkEnterprise = () => {
    setPlan("enterprise");
    toast("Enterprise plan activated");
    router.push("/client/dashboard");
  };

  return (
    <>
      {/* navy → deep-green → black moving background (no pink pulse) */}
      <OperationBackground on colors={CLIENT_BG} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-5 pb-24 pt-10 sm:px-8 lg:px-10">
        {/* ---------------------------------------------------------------- */}
        {/* (2) HERO                                                          */}
        {/* ---------------------------------------------------------------- */}
        <section className="pt-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-aerial-cyan">
            <Icon name="building" size={13} /> GRID for Clients
          </span>
          <h1 className="mt-6 max-w-4xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
            Take control of your company&apos;s{" "}
            <span className="bg-gradient-to-r from-white via-white to-aerial-cyan/70 bg-clip-text text-transparent">
              creative operation.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/60 sm:text-lg">
            For companies managing content, campaigns, media teams, creative departments, and external
            talent, GRID gives you one place to hire, organize, approve, and scale creative work.
          </p>

          <Surface radius="1.75rem" className="mt-8 max-w-2xl" inner="p-6">
            <p className="text-sm leading-relaxed text-white/65">
              Content isn&apos;t a one-time purchase for every company. Some businesses hire a creator
              once. Others manage campaigns, teams, assets, approvals, and creative production every day.
              <span className="text-white"> GRID was built for both.</span>
            </p>
          </Surface>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button tone="green" arrow onClick={() => scrollToId("plans")}>
              Choose Your Plan
            </Button>
            <Button variant="ghost" onClick={() => scrollToId("compare")}>
              Compare Features
            </Button>
            <Button variant="dark" onClick={startFree}>
              Start Free
            </Button>
          </div>
          <p className="mt-4 text-xs text-white/40">
            Demo — switching plans opens the workspace; no payment is taken.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* (3) CLIENT SEGMENT EXPLAINER                                      */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <h2 className="max-w-3xl text-balance text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Built for every stage of creative operations.
          </h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <p className="text-pretty text-sm leading-relaxed text-white/60">
              The Free Plan is designed for businesses with occasional creative needs — posting a job,
              hiring a creator, managing a project, and moving on.
              <br />
              <br />
              Agency and Enterprise are built for organizations where content is not occasional. It&apos;s
              operational. These are companies running campaigns every week. Managing multiple projects
              simultaneously. Working with internal teams and external creatives.
            </p>
            <p className="text-pretty text-sm leading-relaxed text-white/60">
              Handling thousands of files, assets, revisions, approvals, and deliverables throughout the
              year. They don&apos;t simply hire creatives. They manage creative operations.
              <br />
              <br />
              <span className="text-white">If content is a project, Free is enough.</span> If content is
              part of how your company operates, Agency and Enterprise were built for you.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* (4) PRICING CARDS                                                 */}
        {/* ---------------------------------------------------------------- */}
        <section id="plans" className="scroll-mt-24">
          <div className="mb-7">
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">Plans</span>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white">Choose your plan</h2>
          </div>
          <div className="grid items-stretch gap-4 lg:grid-cols-3 lg:gap-5">
            {CLIENT_TIERS.map((t) => (
              <ClientPlanCard key={t.id} tier={t} onContact={onCardContact} />
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-white/40">
            Agency billed monthly. Enterprise is tailored to your organization.{" "}
            <span className="text-white/60">
              Demo — switching plans opens the workspace; no payment is taken.
            </span>
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* (5) COMPARISON                                                    */}
        {/* ---------------------------------------------------------------- */}
        <section id="compare" className="scroll-mt-24">
          <div className="mb-7">
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">Compare</span>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white">Compare every plan</h2>
          </div>
          <ClientComparison />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* (6) ENTERPRISE SHOWCASE                                           */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <div className="max-w-3xl">
            <span className="text-[10px] uppercase tracking-[0.18em] text-aerial-cyan">Enterprise</span>
            <h2 className="mt-2 text-balance text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Turn your creative department into an operating system.
            </h2>
            <p className="mt-5 text-pretty text-sm leading-relaxed text-white/60 sm:text-base">
              Enterprise gives larger organizations the visibility, structure, control, and coordination
              required to manage creative work across teams, departments, projects, and campaigns.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ENTERPRISE_SHOWCASE.map((b) => (
              <Surface key={b.title} radius="1.5rem" inner="p-5" hover>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-grid-blue/15 text-aerial-cyan ring-1 ring-grid-blue/25">
                  <Icon name={b.icon} size={19} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55">{b.body}</p>
              </Surface>
            ))}
          </div>

          <div className="mt-7">
            <Button tone="blue" arrow onClick={talkEnterprise}>
              Talk to GRID Enterprise
            </Button>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* (7) MOTIVATIONAL INVESTMENT                                       */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            You&apos;re not buying software.
            <br />
            <span className="bg-gradient-to-r from-aerial-cyan via-white to-escrow-green bg-clip-text text-transparent">
              You&apos;re investing in your operation.
            </span>
          </h2>
          <p className="mt-6 text-pretty text-sm leading-relaxed text-white/60 sm:text-base">
            The future of your company is built by the decisions you make today. The companies that scale
            creative output aren&apos;t working harder. They&apos;re operating with better systems.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {INVEST_TAGS.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/70"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="mt-6 text-pretty text-sm leading-relaxed text-white/50">
            Whether you&apos;re hiring your first creator or managing an entire creative department, GRID
            was built to support what&apos;s next.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* (8) FINAL CTA                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.025] p-1.5">
            <div className="relative overflow-hidden rounded-[calc(2.5rem-0.375rem)] bg-[radial-gradient(130%_160%_at_50%_-20%,#0c2f4f_0%,#08130f_55%,#050708_100%)] px-6 py-16 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] sm:px-12 md:py-20">
              <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-grid-blue/25 blur-[100px]" />
              <div className="pointer-events-none absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-client-green/20 blur-[110px]" />
              <h2 className="relative mx-auto max-w-2xl text-balance text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
                Your creative operation deserves more than scattered tools.
              </h2>
              <p className="relative mx-auto mt-5 max-w-xl text-pretty text-white/60">
                Hire, manage, organize, approve, and scale creative work from one powerful workspace.
              </p>
              <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
                <Button tone="white" arrow onClick={startFree}>
                  Start Free
                </Button>
                <Button variant="ghost" onClick={talkEnterprise}>
                  Talk to GRID Enterprise
                </Button>
              </div>
              <p className="relative mt-6 text-xs text-white/40">
                Demo — switching plans opens the workspace; no payment is taken.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
