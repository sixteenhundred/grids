/**
 * Client workspace navigation. Each item maps to a route + feature key (used by
 * the plan badge). In demo mode every item is shown; the badge just hints which
 * tier unlocks it at launch. A few items deep-link to existing dashboard tools
 * so nothing is a dead end.
 */

import type { IconName } from "@/components/dashboard/icons";
import type { ClientFeature } from "./config";

export type ClientNavItem = {
  label: string;
  href: string;
  icon: IconName;
  feature?: ClientFeature;
  /** External to the /client namespace (reuses an existing dashboard tool). */
  external?: boolean;
};

export type ClientNavGroup = { heading?: string; items: ClientNavItem[] };

export const CLIENT_NAV: ClientNavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/client/dashboard", icon: "home", feature: "core" },
      { label: "Company Profile", href: "/client/company-profile", icon: "building", feature: "company-profile" },
      { label: "Jobs", href: "/client/jobs", icon: "briefcase", feature: "jobs" },
      { label: "Projects", href: "/client/projects", icon: "kanban", feature: "projects" },
      { label: "Creatives", href: "/dashboard/browse", icon: "compass", external: true },
      { label: "Files", href: "/client/files", icon: "folder", feature: "files" },
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Contracts", href: "/dashboard/contracts", icon: "file", external: true },
      { label: "Payments", href: "/dashboard/finance", icon: "wallet", external: true },
      { label: "Marketing Advisor", href: "/client/marketing-advisor", icon: "trending", feature: "marketing-advisor" },
      { label: "Performance", href: "/client/performance", icon: "chart", feature: "performance" },
      { label: "Creative Concierge", href: "/client/creative-concierge", icon: "sparkles", feature: "creative-concierge" },
    ],
  },
  {
    heading: "Enterprise",
    items: [
      { label: "Departments", href: "/client/departments", icon: "command", feature: "departments" },
      { label: "Tasks", href: "/client/tasks", icon: "list", feature: "tasks" },
      { label: "Team Workload", href: "/client/team-workload", icon: "users", feature: "team-workload" },
      { label: "Asset Library", href: "/client/asset-library", icon: "grid", feature: "asset-library" },
      { label: "Internal Messages", href: "/client/internal-messages", icon: "comment", feature: "internal-messages" },
      { label: "Approval Workflows", href: "/client/approval-workflows", icon: "verified", feature: "approval-workflows" },
    ],
  },
];

export const CLIENT_BOTTOM_NAV: ClientNavItem[] = [
  { label: "Plans & upgrade", href: "/client/subscriptions", icon: "star" },
  { label: "Settings", href: "/client/company-profile", icon: "user" },
];

export function isClientNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}
