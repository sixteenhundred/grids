import { Reveal } from "./reveal";
import { Stagger, StaggerItem } from "./motion";
import { Cta, Eyebrow } from "./ui";

const JOBS = [
  {
    tag: "Urgent",
    tone: "urgent",
    title: "Replacement photographer, hotel launch",
    where: "Oslo · Today",
    pay: "€900",
    skills: ["Photo", "Interiors"],
  },
  {
    tag: "One-off",
    tone: "blue",
    title: "Brand film, 60s product hero",
    where: "Remote · This week",
    pay: "€4,500",
    skills: ["Video", "Editing"],
  },
  {
    tag: "Long-term",
    tone: "green",
    title: "Monthly real-estate aerials retainer",
    where: "Bergen · Ongoing",
    pay: "€2,000/mo",
    skills: ["Drone", "Photo"],
  },
];

const toneMap: Record<string, string> = {
  urgent: "bg-urgent-red/12 text-urgent-red ring-urgent-red/25",
  blue: "bg-grid-blue/12 text-aerial-cyan ring-grid-blue/25",
  green: "bg-client-green/12 text-escrow-green ring-client-green/25",
};

export function Jobs() {
  return (
    <section id="jobs" className="relative px-4 py-24 sm:px-6 md:py-36">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <Eyebrow tone="red">Job board · Urgent calls</Eyebrow>
            <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
              One-off, urgent and long-term work.
            </h2>
            <p className="mt-5 text-pretty text-white/55">
              Post a job and get matched with available creatives, or apply to
              last-minute calls and build ongoing retainers with brands and
              agencies.
            </p>
          </div>
          <Cta href="/signup" variant="ghost">
            Post a job
          </Cta>
        </Reveal>

        <Stagger className="grid gap-4 md:grid-cols-3 md:gap-5" stagger={0.11}>
          {JOBS.map((job) => (
            <StaggerItem key={job.title} className="h-full">
              <div className="group flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/[0.03] p-1.5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:bg-white/[0.05]">
                <div className="flex h-full flex-col rounded-[calc(2rem-0.375rem)] bg-card-charcoal/70 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ring-1 ${toneMap[job.tone]}`}
                    >
                      {job.tone === "urgent" && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-urgent-red"
                          style={{ animation: "grid-pulse 1.6s ease-in-out infinite" }}
                        />
                      )}
                      {job.tag}
                    </span>
                    <span className="font-mono text-sm font-semibold text-white">
                      {job.pay}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold leading-snug tracking-tight text-white">
                    {job.title}
                  </h3>
                  <p className="mt-2 font-mono text-xs text-white/60">
                    {job.where}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-6">
                    {job.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/55"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
