"use client";

import { MotionConfig } from "motion/react";
import { AudienceProvider } from "./audience";
import { EASE_GRID } from "./motion";
import { Nav } from "./nav";
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
