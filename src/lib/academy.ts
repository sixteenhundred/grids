/**
 * Grid Academy — shared types + helpers.
 *
 * Hierarchy: Academy (school) → Path (course track) → Lesson.
 * Persistence lives in `academy-actions.ts`. Image uploads reuse the shop's
 * downscaling helper.
 */

import type { Tile } from "./grid-data";

export { fileToImageDataUrl } from "./shop";

export type Level = "Beginner" | "Intermediate" | "Advanced";

export const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced"];

export type AcademyConfig = {
  name: string;
  description: string;
  logo: string | null;
  banner: string | null;
  // One-time access price. 0 = free.
  price: number;
};

export type LearningPath = {
  id: string;
  academyId: string;
  academyName: string;
  title: string;
  description: string;
  level: Level;
  coverImage: string | null;
  coverTile: Tile;
  lessonCount: number;
  completedCount: number;
  createdAt: number;
};

export type Lesson = {
  id: string;
  pathId: string;
  title: string;
  content: string;
  duration: string;
  position: number;
  createdAt: number;
};

export type AcademySummary = {
  id: string;
  name: string;
  description: string;
  logo: string | null;
  banner: string | null;
  price: number;
  pathCount: number;
};

export type NewPath = {
  title: string;
  description: string;
  level: Level;
  coverImage: string | null;
};

export type NewLesson = {
  title: string;
  content: string;
  duration: string;
};

/* Server-action return shapes (kept here so both sides share them). */
export type MyAcademy = { academyId: string; config: AcademyConfig; paths: LearningPath[] };

/** Visitor view of an academy — adds ownership + access state. */
export type AcademyView = MyAcademy & { isOwner: boolean; enrolled: boolean; locked: boolean };

export type PathDetail = {
  path: LearningPath;
  academyId: string;
  academyName: string;
  academyPrice: number;
  lessons: Lesson[];
  completedLessonIds: string[];
  isOwner: boolean;
  locked: boolean;
};

export type LessonDetail = {
  lesson: Lesson;
  pathId: string;
  pathTitle: string;
  academyId: string;
  academyName: string;
  academyPrice: number;
  completed: boolean;
  isOwner: boolean;
  locked: boolean;
  prevId: string | null;
  nextId: string | null;
  index: number;
  total: number;
};

const LEVEL_TILE: Record<Level, Tile> = {
  Beginner: { title: "Beginner", from: "#243a2c", to: "#080f0b" },
  Intermediate: { title: "Intermediate", from: "#2a3350", to: "#090c14" },
  Advanced: { title: "Advanced", from: "#3a2438", to: "#0d0a10" },
};

export function tileForLevel(level: Level): Tile {
  return LEVEL_TILE[level] ?? LEVEL_TILE.Beginner;
}

export const DEFAULT_ACADEMY: AcademyConfig = {
  name: "Your Academy",
  description: "Short, practical lessons from real shoots.",
  logo: null,
  banner: null,
  price: 0,
};

/** Seeded into an academy on first creation — mirrors the described flow. */
export const SEED_PATHS: { path: NewPath; lessons: NewLesson[] }[] = [
  {
    path: {
      title: "Color Grading",
      description: "Grade like a colorist — from flat footage to a finished cinematic look.",
      level: "Intermediate",
      coverImage: null,
    },
    lessons: [
      {
        title: "Reading scopes & exposure",
        duration: "12 min",
        content:
          "Before you touch a single wheel, learn to read your image objectively.\n\nWaveform, parade and vectorscope tell you what your eyes can't. We set a clean exposure base, balance the channels, and make sure skin tones land where they should — so every later move is built on solid ground.",
      },
      {
        title: "Building a base grade",
        duration: "16 min",
        content:
          "A great grade is layered, not a single filter.\n\nWe start with primary corrections — lift, gamma, gain — then shape contrast and saturation. You'll build a neutral, true base that holds up before any stylised look goes on top.",
      },
      {
        title: "Looks, LUTs & finishing",
        duration: "14 min",
        content:
          "Now the fun part: the look.\n\nWe apply a creative LUT, dial it back to taste, add subtle film emulation and a final vignette. Then we export a clean deliverable and a shareable LUT you can sell in your Grid Shop.",
      },
    ],
  },
  {
    path: {
      title: "Lighting Interiors",
      description: "Make any room look like a magazine spread with simple, repeatable lighting.",
      level: "Beginner",
      coverImage: null,
    },
    lessons: [
      {
        title: "Reading natural light",
        duration: "10 min",
        content: "Every room has a best time of day. Learn to find it, and to shape window light with nothing but timing and a reflector.",
      },
      {
        title: "Flash vs ambient",
        duration: "13 min",
        content: "When to add light and when to let the room speak. We balance a single flash against ambient for clean, natural-looking interiors.",
      },
    ],
  },
];
