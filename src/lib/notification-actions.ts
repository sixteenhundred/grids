"use server";

/** User-facing notification reads for the in-app feed (own rows + broadcasts). */
import { getCurrentUser } from "./security/auth-guard";
import { listNotificationsForUser } from "./notifications";

export type NotificationView = {
  id: string;
  type: string;
  title: string;
  body: string;
  icon: string | null;
  link: string | null;
  createdAt: number;
};

export async function listMyNotifications(): Promise<NotificationView[]> {
  const u = await getCurrentUser();
  if (!u) return []; // guests get no personal feed (no throw)
  const rows = await listNotificationsForUser(u.id, 30);
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    icon: r.icon,
    link: r.link,
    createdAt: r.createdAt.getTime(),
  }));
}
