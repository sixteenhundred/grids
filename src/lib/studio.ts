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

/* ── Script options (length, pace, mood, cast) ──────────────────────────── */
export type ScriptLength = "30s" | "1m" | "3m" | "5m" | "10m";
export type ScriptPace = "slow" | "medium" | "fast";
export type ScriptMood = "commercial" | "action" | "romantic" | "happy" | "sad" | "dramatic" | "documentary";

export type ScriptOptions = {
  description: string;
  length: ScriptLength;
  pace: ScriptPace;
  actors: number;
  mood: ScriptMood;
};

export const SCRIPT_LENGTHS: { key: ScriptLength; label: string; scenes: number }[] = [
  { key: "30s", label: "30 sec", scenes: 2 },
  { key: "1m", label: "1 min", scenes: 3 },
  { key: "3m", label: "3 min", scenes: 5 },
  { key: "5m", label: "5 min", scenes: 7 },
  { key: "10m", label: "10 min+", scenes: 10 },
];
export const SCRIPT_PACES: { key: ScriptPace; label: string }[] = [
  { key: "slow", label: "Slow" },
  { key: "medium", label: "Medium" },
  { key: "fast", label: "Fast" },
];
export const SCRIPT_MOODS: { key: ScriptMood; label: string }[] = [
  { key: "commercial", label: "Commercial" },
  { key: "action", label: "Action" },
  { key: "romantic", label: "Romantic" },
  { key: "happy", label: "Happy" },
  { key: "sad", label: "Sad" },
  { key: "dramatic", label: "Dramatic" },
  { key: "documentary", label: "Documentary" },
];
export const MAX_ACTORS = 6;
export const DEFAULT_SCRIPT_OPTIONS: ScriptOptions = { description: "", length: "1m", pace: "medium", actors: 2, mood: "commercial" };

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

/* A bank of on-tone material per mood — locations, action beats and dialogue. */
type MoodBank = { adj: string; locations: string[]; action: string[]; lines: string[]; close: string };
const MOOD_BANK: Record<ScriptMood, MoodBank> = {
  commercial: {
    adj: "polished and aspirational",
    locations: ["INT. SUN-LIT STUDIO", "EXT. CITY STREET", "INT. MODERN SHOWROOM", "EXT. ROOFTOP TERRACE"],
    action: ["The product turns slowly in a shaft of light — every detail deliberate.", "She moves through the space with easy, lived-in confidence.", "Hands reach into frame; the moment lands without a word.", "A clean push-in settles on the hero, framed like a portrait."],
    lines: ["This is how it should feel.", "Made for the way you actually live.", "No compromises — just this.", "You'll wonder how you ever did it the other way."],
    close: "CUT TO black. Logo resolves. End card.",
  },
  action: {
    adj: "kinetic and high-stakes",
    locations: ["EXT. RAIN-SLICK ALLEY", "INT. SERVER ROOM", "EXT. HIGHWAY OVERPASS", "INT. STAIRWELL"],
    action: ["A door bursts open; the camera whip-pans to follow.", "Footsteps hammer the concrete — faster, closer.", "Sparks scatter as metal meets metal.", "They vault the rail and drop into the dark."],
    lines: ["Go — now!", "We're out of time.", "Whatever happens, don't stop.", "I've got one shot at this."],
    close: "SMASH CUT to silence. Hold. Out.",
  },
  romantic: {
    adj: "warm and intimate",
    locations: ["EXT. SEASIDE BOARDWALK", "INT. CANDLELIT KITCHEN", "EXT. RAINY DOORWAY", "INT. TRAIN CARRIAGE"],
    action: ["Their hands almost touch on the railing — then do.", "She laughs at something only the two of them heard.", "The city blurs behind them; the world narrows to a glance.", "He tucks a stray strand of hair behind her ear."],
    lines: ["Stay. Just a little longer.", "I wasn't looking for this. Then there was you.", "Tell me this is real.", "I'd find you in any version of this."],
    close: "DISSOLVE on the held look. Fade up warm.",
  },
  happy: {
    adj: "bright and uplifting",
    locations: ["EXT. SUMMER PARK", "INT. BUSY KITCHEN", "EXT. BEACH AT NOON", "INT. LIVING ROOM"],
    action: ["Sunlight floods the room; everyone's mid-laugh.", "Confetti drifts down in slow motion.", "The dog gets there first, ears flying.", "They spin once, twice — breathless and grinning."],
    lines: ["Best day. Hands down.", "Did you see that?! Did you SEE it?", "Okay — again, again!", "I could stay right here forever."],
    close: "FREEZE on the laugh. Fade to white.",
  },
  sad: {
    adj: "quiet and aching",
    locations: ["INT. EMPTY APARTMENT", "EXT. GRAVESIDE — GREY SKY", "INT. PARKED CAR", "EXT. LAST TRAIN PLATFORM"],
    action: ["The phone rings out. She doesn't pick up.", "Rain streaks the glass; nothing else moves.", "He folds the letter once, then can't read it again.", "The seat beside her stays empty the whole way."],
    lines: ["I keep thinking you'll walk back in.", "I'm fine. (beat) I'm not.", "We never said the thing we meant.", "How do you miss someone this much?"],
    close: "HOLD on the empty frame. Slow fade.",
  },
  dramatic: {
    adj: "tense and weighty",
    locations: ["INT. BOARDROOM", "INT. COURTROOM", "EXT. CLIFF EDGE — DUSK", "INT. DIMLY-LIT OFFICE"],
    action: ["A long silence. No one blinks.", "She slides the file across the table.", "Thunder, distant. He doesn't flinch.", "The decision sits between them like a third person."],
    lines: ["You already know what this costs.", "Say it. Out loud.", "There's no version where we both win.", "I made my choice the day I walked in here."],
    close: "CUT TO black on the final word.",
  },
  documentary: {
    adj: "honest and observational",
    locations: ["INT. WORKSHOP", "EXT. WORKSITE", "INT. KITCHEN — INTERVIEW", "EXT. STREET, HANDHELD"],
    action: ["Cutaway: hands working, unhurried and sure.", "Natural light; the subject forgets the camera is there.", "B-roll drifts over the details that tell the story.", "She pauses, finds the real answer, keeps going."],
    lines: ["I didn't plan it. It just… became the thing.", "People ask how. Honestly? You just keep showing up.", "The hard part isn't starting — it's staying.", "If it helps one person, that's the whole point."],
    close: "Lower-third fades. Cut to wide. End.",
  },
};

const SCRIPT_CAST = ["MAYA", "LEO", "SARA", "THEO", "NINA", "OMAR"];
const SCENE_TIMES = ["DAWN", "MORNING", "GOLDEN HOUR", "MIDDAY", "DUSK", "NIGHT", "CONTINUOUS", "LATER"];

function script(opts: ScriptOptions): StudioSection[] {
  const subj = subject(opts.description);
  const lenMeta = SCRIPT_LENGTHS.find((l) => l.key === opts.length) ?? SCRIPT_LENGTHS[1];
  const bank = MOOD_BANK[opts.mood];
  const cast = SCRIPT_CAST.slice(0, Math.max(1, Math.min(opts.actors, MAX_ACTORS)));
  const moodLabel = SCRIPT_MOODS.find((m) => m.key === opts.mood)?.label ?? "Commercial";
  const paceNote =
    opts.pace === "fast" ? "Cut fast — short lines, quick ins and outs." : opts.pace === "slow" ? "Let it breathe — long holds, sparse dialogue." : "Even rhythm — motivated cuts on action.";

  const sections: StudioSection[] = [
    {
      heading: "Logline",
      block: {
        type: "paras",
        items: [
          `A ${bank.adj} ${opts.mood} piece on ${subj}. ${cast.length} on-camera ${cast.length === 1 ? "performer" : "performers"}, written for a ${lenMeta.label} cut.`,
          "FADE IN.",
        ],
      },
    },
  ];

  // One section per scene — slug line, action, then dialogue for the cast.
  const dlgPerScene = opts.pace === "fast" ? 3 : opts.pace === "slow" ? 1 : 2;
  for (let i = 0; i < lenMeta.scenes; i++) {
    const loc = bank.locations[i % bank.locations.length];
    const time = SCENE_TIMES[i % SCENE_TIMES.length];
    const lines: string[] = [`${loc} — ${time}`, bank.action[i % bank.action.length]];
    if (i === 0) lines.push(`We open on ${subj}.`);
    for (let d = 0; d < Math.min(Math.max(1, dlgPerScene), cast.length); d++) {
      const who = cast[(i + d) % cast.length];
      lines.push(`${who}:  "${bank.lines[(i + d) % bank.lines.length]}"`);
    }
    if (i === lenMeta.scenes - 1) lines.push(bank.close);
    sections.push({ heading: `Scene ${i + 1} · ${loc.replace(/^(INT|EXT)\.\s*/, "")}`, block: { type: "paras", items: lines } });
  }

  sections.push({
    heading: "Direction & cast",
    block: {
      type: "bullets",
      items: [
        `Mood: ${moodLabel}`,
        `Pace: ${opts.pace} — ${paceNote}`,
        `Cast (${cast.length}): ${cast.join(", ")}`,
        `Runtime target: ${lenMeta.label} · ${lenMeta.scenes} scenes`,
        "Booked, signed and paid through Grid.",
      ],
    },
  });

  return sections;
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
          "Fixed project rate, protected by Grid. 50% held on signing, 50% released on approved delivery — no chasing, no risk on either side.",
        ],
      },
    },
  ];
}

const GENERATORS: Record<Exclude<StudioToolKey, "script">, (brief: string) => StudioSection[]> = {
  shotlist,
  moodboard,
  proposal,
};

/** Turn a brief (and, for scripts, options) into a saved creation. */
export function generate(tool: StudioToolKey, brief: string, opts?: Partial<ScriptOptions>): StudioCreation {
  const sections =
    tool === "script"
      ? script({ ...DEFAULT_SCRIPT_OPTIONS, ...opts, description: opts?.description ?? brief })
      : GENERATORS[tool](brief);
  return {
    id: `st${Date.now()}`,
    tool,
    title: title(tool, brief),
    brief: brief.trim(),
    createdAt: Date.now(),
    sections,
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
