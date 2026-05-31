/**
 * Grid Studio — client-side generators + persistence.
 *
 * No AI backend yet: each tool turns a short brief into structured, on-brand
 * output. Creations are saved to localStorage so they show up as individual
 * projects on the Studio landing page across reloads. Swap `generate()` for a
 * real model call when the API lands — the shape stays the same.
 */

import type { Tile } from "./grid-data";

export type StudioToolKey = "shotlist" | "script" | "moodboard" | "proposal";

export const TOOL_LABEL: Record<StudioToolKey, string> = {
  shotlist: "Shot list",
  script: "Script",
  moodboard: "Mood board",
  proposal: "Proposal",
};

/** A render block — the viewer maps each kind to a layout. */
export type StudioBlock =
  | { type: "steps"; items: string[] }
  | { type: "bullets"; items: string[] }
  | { type: "paras"; items: string[] }
  | { type: "swatches"; items: Tile[] };

export type StudioSection = { heading: string; block: StudioBlock };

export type StudioCreation = {
  id: string;
  tool: StudioToolKey;
  title: string;
  brief: string;
  createdAt: number;
  sections: StudioSection[];
};

/* -------------------------------------------------------------------------- */
/*  Generators                                                                 */
/* -------------------------------------------------------------------------- */

function subject(brief: string): string {
  const s = brief.trim();
  return s.length ? s : "the project";
}

function truncate(s: string, n: number): string {
  const t = s.trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

function title(tool: StudioToolKey, brief: string): string {
  const subj = brief.trim() || "Untitled brief";
  return `${TOOL_LABEL[tool]} · ${truncate(subj, 40)}`;
}

function shotlist(brief: string): StudioSection[] {
  const s = subject(brief);
  return [
    {
      heading: "Sequence",
      block: {
        type: "steps",
        items: [
          `Cold open — drone reveal of ${s}, golden hour`,
          `Establishing wide — ${s} in context, slow push in`,
          "Approach — handheld move toward the entrance",
          "Detail beats — textures, materials, light play",
          "Interior flow — continuous gimbal through key spaces",
          `Hero frame — ${s} at twilight, locked off`,
          "Closing — pull back to wide, gentle fade",
        ],
      },
    },
    {
      heading: "Gear & notes",
      block: {
        type: "bullets",
        items: [
          "Shoot golden-hour and twilight blocks back to back",
          "ND filters for exteriors, fast prime for interiors",
          "Gimbal + drone; 4K 24fps for cinematic motion",
          "Bracket the twilight hero for a clean composite",
        ],
      },
    },
  ];
}

function script(brief: string): StudioSection[] {
  const s = subject(brief);
  return [
    {
      heading: "Voiceover draft",
      block: {
        type: "paras",
        items: [
          `Some spaces are built to be seen. ${s.charAt(0).toUpperCase() + s.slice(1)} is one of them.`,
          "Light moves through every room like it was invited. The lines are deliberate. Nothing here is an accident.",
          "Booked, protected and delivered on Grid — so the work speaks, and everyone gets paid.",
        ],
      },
    },
    {
      heading: "Tone",
      block: {
        type: "bullets",
        items: [
          "Confident and cinematic — never salesy",
          "Short sentences; let the visuals breathe",
          "One idea per line, paced to the cut",
        ],
      },
    },
  ];
}

const MOOD_SWATCHES: Tile[] = [
  { title: "Golden hour", from: "#c8923f", to: "#1a120a" },
  { title: "Twilight blue", from: "#2b4a72", to: "#080b14" },
  { title: "Warm interior", from: "#7a4a2e", to: "#14100c" },
  { title: "Deep shadow", from: "#1c1f26", to: "#070809" },
  { title: "Natural light", from: "#9fb0c4", to: "#1a2028" },
  { title: "Architectural", from: "#3a4250", to: "#0a0c10" },
];

function moodboard(brief: string): StudioSection[] {
  return [
    { heading: "Palette & references", block: { type: "swatches", items: MOOD_SWATCHES } },
    {
      heading: "Keywords",
      block: {
        type: "bullets",
        items: [
          "Cinematic, premium, restrained",
          "Natural light + strong architectural lines",
          "Warm / cool contrast, deep negative space",
          subject(brief) === "the project" ? "Editorial, magazine-grade finish" : `${subject(brief)} — hero subject`,
        ],
      },
    },
  ];
}

function proposal(brief: string): StudioSection[] {
  const s = subject(brief);
  return [
    {
      heading: "Overview",
      block: {
        type: "paras",
        items: [
          `A focused production to capture ${s} with a cinematic, premium finish — built to convert and to last.`,
        ],
      },
    },
    {
      heading: "Scope",
      block: {
        type: "bullets",
        items: [
          "Pre-production & shot planning",
          "Half-day on-site shoot",
          "Aerial coverage (licensed drone)",
          "Edit, color grade and sound",
          "Two rounds of revisions",
        ],
      },
    },
    {
      heading: "Deliverables",
      block: {
        type: "bullets",
        items: ["20–30 edited stills", "60–90s brand film", "Web + social exports"],
      },
    },
    {
      heading: "Investment",
      block: {
        type: "paras",
        items: [
          "Fixed project rate, protected by Grid Escrow. 50% held on signing, 50% released on approved delivery — no chasing, no risk on either side.",
        ],
      },
    },
  ];
}

const GENERATORS: Record<StudioToolKey, (brief: string) => StudioSection[]> = {
  shotlist,
  script,
  moodboard,
  proposal,
};

/** Turn a brief into a saved creation. */
export function generate(tool: StudioToolKey, brief: string): StudioCreation {
  return {
    id: `st${Date.now()}`,
    tool,
    title: title(tool, brief),
    brief: brief.trim(),
    createdAt: Date.now(),
    sections: GENERATORS[tool](brief),
  };
}

/* -------------------------------------------------------------------------- */
/*  Persistence                                                                */
/* -------------------------------------------------------------------------- */

const KEY = "grid:studio";

/** One worked example so the landing page isn't empty on first visit. */
const SEED: StudioCreation = {
  id: "st-seed",
  tool: "shotlist",
  title: "Shot list · Cliffside villa",
  brief: "Cliffside villa",
  createdAt: Date.UTC(2026, 4, 28),
  sections: shotlist("the cliffside villa"),
};

export function loadCreations(): StudioCreation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return [SEED]; // first visit — show the example
    return JSON.parse(raw) as StudioCreation[];
  } catch {
    return [SEED];
  }
}

export function saveCreations(list: StudioCreation[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function relativeDate(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(ts).toLocaleDateString();
}
