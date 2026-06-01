"use client";

import { MotionConfig } from "motion/react";
import { AudienceProvider } from "./audience";
import { OperationBackground } from "@/components/dashboard/operation-bg";
import { EASE_GRID } from "./motion";
import { Nav } from "./nav";

/** Ocean palette for the landing's moving aurora background. */
const OCEAN = ["#22d3ee", "#0ea5e9", "#3b82f6", "#6366f1", "#1e3a8a"];
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { Talent } from "./talent";
import { Escrow } from "./escrow";
import { Jobs } from "./jobs";
import { Trust } from "./trust";
import { Pricing } from "./pricing";
import { FinalCta } from "./final-cta";

export function Landing() {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE_GRID }}>
      <AudienceProvider>
        <div className="relative overflow-x-clip">
          <OperationBackground on colors={OCEAN} />
          <Nav />
          <main>
            <Hero />
            <HowItWorks />
            <Talent />
            <Escrow />
            <Jobs />
            <Trust />
            <Pricing />
            <FinalCta />
          </main>
        </div>
      </AudienceProvider>
    </MotionConfig>
  );
}
