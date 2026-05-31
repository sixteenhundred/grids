/**
 * Editable profile overrides (localStorage). Merged over the seed data so the
 * "Edit profile" / "Edit company profile" actions actually persist. Swap for a
 * `profile` table + server actions when ready.
 */

export type CreatorProfile = { name: string; type: string; city: string; rate: number; bio: string };
export type ClientProfile = { name: string; industry: string; locations: string };

const CREATOR_KEY = "grid:profile:creator";
const CLIENT_KEY = "grid:profile:client";

export function loadCreatorProfile(defaults: CreatorProfile): CreatorProfile {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(CREATOR_KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<CreatorProfile>) } : defaults;
  } catch {
    return defaults;
  }
}
export function saveCreatorProfile(p: CreatorProfile): void {
  try {
    localStorage.setItem(CREATOR_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function loadClientProfile(defaults: ClientProfile): ClientProfile {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(CLIENT_KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<ClientProfile>) } : defaults;
  } catch {
    return defaults;
  }
}
export function saveClientProfile(p: ClientProfile): void {
  try {
    localStorage.setItem(CLIENT_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
