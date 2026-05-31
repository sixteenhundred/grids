/**
 * Community — client-side feed state (localStorage).
 *
 * User posts and likes live in the browser, merged with the seed POSTS at
 * render time. Swap these for server actions + a `post` table when the feed
 * needs to be shared across users.
 */

export { fileToImageDataUrl } from "./shop";

export type UserPost = {
  id: string;
  author: string;
  caption: string;
  imageUrl: string | null;
  createdAt: number;
};

const POSTS_KEY = "grid:community:posts";
const LIKES_KEY = "grid:community:likes";

export function loadUserPosts(): UserPost[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(POSTS_KEY) ?? "[]") as UserPost[];
  } catch {
    return [];
  }
}

export function saveUserPosts(posts: UserPost[]): void {
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  } catch {
    /* ignore */
  }
}

export function loadLikes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function saveLikes(ids: string[]): void {
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function relativeTime(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
