"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { EASE_GRID } from "@/components/landing/motion";
import { signOut } from "@/lib/auth-client";
import { demoLogout } from "@/lib/demo-auth";
import { useRole, RoleToggle } from "./role-context";
import { useSheet } from "./sheet";
import { NotificationsSheet, PostJobSheet, UploadSheet, InviteSheet } from "./sheets";
import { Avatar } from "./ui";
import { ThemeToggle } from "@/components/theme";
import { Notepad } from "./notepad";
import { Icon, type IconName } from "./icons";
import type { Role } from "@/lib/grid-data";
import { featureKeyForHref } from "@/lib/features";
import type { FlagMap } from "@/lib/admin-types";

type NavItem = { label: string; href: string; icon: IconName };
type NavGroup = { heading?: string; items: NavItem[] };

function navFor(role: Role): NavGroup[] {
  const main: NavItem[] = [
    { label: "Home", href: "/dashboard", icon: "home" },
    { label: role === "client" ? "Hire" : "Browse", href: "/dashboard/browse", icon: "compass" },
    { label: role === "client" ? "My jobs" : "Job board", href: "/dashboard/jobs", icon: "briefcase" },
    { label: "Projects", href: "/dashboard/projects", icon: "kanban" },
    { label: "Contracts", href: "/dashboard/contracts", icon: "file" },
    { label: "Finance", href: "/dashboard/finance", icon: "wallet" },
  ];
  // Creators get their operational HQ right under Home.
  if (role !== "client") main.splice(1, 0, { label: "My Operation", href: "/dashboard/operation", icon: "command" });
  // File delivery — creators send, clients receive. Sits directly under Finance.
  main.push({ label: role === "client" ? "Deliveries" : "Transfer", href: "/dashboard/transfer", icon: "folder" });
  const discover: NavItem[] = [
    { label: "Radar", href: "/dashboard/radar", icon: "map" },
    { label: "Community", href: "/dashboard/community", icon: "users" },
    { label: "Saved", href: "/dashboard/saved", icon: "bookmark" },
    { label: "News", href: "/dashboard/news", icon: "news" },
    { label: "Trends", href: "/dashboard/trends", icon: "trending" },
  ];
  const grow: NavItem[] = [
    { label: "Campaign", href: "/dashboard/campaign", icon: "play" },
    { label: "First In Line", href: "/dashboard/first-in-line", icon: "target" },
    { label: "Brand Vault", href: "/dashboard/vault", icon: "grid" },
    { label: "Content Planner", href: "/dashboard/planner", icon: "calendar" },
    { label: "AI Sales", href: "/dashboard/sales", icon: "send" },
    { label: "Creative CRM", href: "/dashboard/crm", icon: "kanban" },
    { label: "Price Intel", href: "/dashboard/pricing", icon: "chart" },
    { label: "Match Score", href: "/dashboard/match", icon: "star" },
    { label: "AI Studio", href: "/dashboard/studio", icon: "sparkles" },
    { label: "Shop", href: "/dashboard/shop", icon: "shop" },
    { label: "Academy", href: "/dashboard/academy", icon: "school" },
    { label: "Collab", href: "/dashboard/collab", icon: "users" },
  ];

  if (role === "client") {
    const hq: NavItem[] = [
      { label: "Concierge", href: "/dashboard/concierge", icon: "sparkles" },
      { label: "Project Builder", href: "/dashboard/builder", icon: "layout" },
      { label: "Content Vault", href: "/dashboard/content-vault", icon: "grid" },
      { label: "Tracker", href: "/dashboard/tracker", icon: "kanban" },
      { label: "Marketing Advisor", href: "/dashboard/advisor", icon: "chart" },
      { label: "Performance", href: "/dashboard/performance", icon: "trending" },
    ];
    return [
      { items: main },
      { heading: "Client HQ", items: hq },
      { heading: "Discover", items: discover.filter((i) => ["Radar", "Community", "Saved"].includes(i.label)) },
    ];
  }
  return [
    { items: main },
    { heading: "Discover", items: discover },
    { heading: "Create & earn", items: grow },
  ];
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

/* -------------------------------------------------------------------------- */
/*  Shell                                                                      */
/* -------------------------------------------------------------------------- */

export function DashboardShell({
  user,
  isAdmin = false,
  flags,
  children,
}: {
  user: { name: string; email: string };
  isAdmin?: boolean;
  flags?: FlagMap;
  children: React.ReactNode;
}) {
  const { role } = useRole();
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useSheet();
  const [drawer, setDrawer] = useState(false);

  // Reflect the creator's custom workspace name in the nav.
  const [opName, setOpName] = useState("My Operation");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("grid:operation");
      if (raw) {
        const n = (JSON.parse(raw) as { name?: string }).name;
        if (n) setOpName(n);
      }
    } catch {
      /* ignore */
    }
  }, [pathname]);

  // Hide any feature an admin has switched off, then drop emptied groups.
  const isEnabled = (href: string) => {
    const key = featureKeyForHref(href);
    return !key || !flags || flags[key] !== false;
  };
  const groups = navFor(role)
    .map((g) => ({
      ...g,
      items: g.items
        .filter((i) => isEnabled(i.href))
        .map((i) => (i.href === "/dashboard/operation" ? { ...i, label: opName } : i)),
    }))
    .filter((g) => g.items.length > 0);
  // Admins get a dedicated control-panel entry at the bottom of the nav.
  if (isAdmin) {
    groups.push({ heading: "Admin", items: [{ label: "Control Panel", href: "/dashboard/admin", icon: "shield" }] });
  }
  // Full literal class strings so Tailwind's JIT can see them.
  const accentText = role === "client" ? "text-client-green" : "text-grid-blue";

  // Collapsible sidebar (persisted). Init expanded to match SSR, then hydrate.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("grid:sidebar") === "1");
    } catch {
      /* ignore */
    }
  }, []);
  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem("grid:sidebar", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  // Guard: if the current page's feature was switched off, bounce home.
  useEffect(() => {
    const key = featureKeyForHref(pathname);
    if (key && flags && flags[key] === false) router.replace("/dashboard");
  }, [pathname, flags, router]);

  // Universal back button — shown on pages nested below a top-level nav item.
  const segs = pathname.split("/").filter(Boolean);
  const canGoBack = segs.length >= 3;

  const primaryAction = () => (role === "client" ? open(<PostJobSheet />) : open(<UploadSheet />));

  async function handleSignOut() {
    await signOut().catch(() => {});
    await demoLogout().catch(() => {});
    router.push("/login");
  }

  return (
    <div className="relative min-h-dvh lg:flex">
      {/* ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className={`absolute -top-40 left-1/4 h-[36rem] w-[36rem] rounded-full ${role === "client" ? "bg-client-green/8" : "bg-grid-blue/8"} blur-[140px]`} />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-aerial-cyan/[0.05] blur-[140px]" />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Desktop sidebar                                                   */}
      {/* ---------------------------------------------------------------- */}
      <aside className={`sticky top-0 z-30 hidden h-dvh shrink-0 flex-col border-r border-white/8 bg-grid-black/60 py-6 backdrop-blur-xl transition-[width,padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:flex ${collapsed ? "w-[4.75rem] px-2.5" : "w-64 px-4"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between px-1"}`}>
          {!collapsed && (
            <Link href="/dashboard" className="text-xl font-semibold tracking-tight text-white">
              Grid<span className="text-grid-blue">.</span>
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Icon name="chevron" size={18} className={collapsed ? "" : "rotate-180"} />
          </button>
        </div>

        <nav className="mt-7 flex-1 overflow-y-auto no-scrollbar">
          {groups.map((g, gi) => (
            <div key={gi} className={gi > 0 ? (collapsed ? "mt-3 border-t border-white/8 pt-3" : "mt-6") : ""}>
              {g.heading && !collapsed && <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">{g.heading}</div>}
              <ul className="flex flex-col gap-0.5">
                {g.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={`group flex items-center rounded-xl py-2 text-sm transition-colors ${collapsed ? "justify-center px-0" : "gap-3 px-3"} ${
                          active ? "bg-white/[0.06] font-medium text-white" : "text-white/55 hover:bg-white/[0.03] hover:text-white"
                        }`}
                      >
                        <span className={active ? accentText : "text-white/45 group-hover:text-white/70"}>
                          <Icon name={item.icon} size={19} />
                        </span>
                        {!collapsed && item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-4 border-t border-white/8 pt-4">
          <Link href="/waitlist" title={collapsed ? "Waitlist page" : undefined} className={`mb-1 flex w-full items-center rounded-xl py-2 text-sm text-white/55 transition-colors hover:bg-white/[0.03] hover:text-white ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}>
            <Icon name="globe" size={19} className="text-aerial-cyan" /> {!collapsed && <span>Waitlist page</span>}
          </Link>
          <Link href="/trust" title={collapsed ? "Trust Center" : undefined} className={`mb-1 flex w-full items-center rounded-xl py-2 text-sm text-white/55 transition-colors hover:bg-white/[0.03] hover:text-white ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}>
            <Icon name="shield" size={19} className="text-escrow-green" /> {!collapsed && <span>Trust Center</span>}
          </Link>
          <button onClick={() => open(<InviteSheet />)} title={collapsed ? "Invite & earn" : undefined} className={`mb-2 flex w-full items-center rounded-xl py-2 text-sm text-white/55 transition-colors hover:bg-white/[0.03] hover:text-white ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}>
            <Icon name="gift" size={19} className="text-review-gold" /> {!collapsed && <span>Invite &amp; earn</span>}
          </button>
          <Link href="/dashboard/profile" title={collapsed ? user.name : undefined} className={`flex items-center rounded-xl transition-colors ${collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2"} ${isActive(pathname, "/dashboard/profile") ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}>
            <Avatar id="john" name={user.name} size={collapsed ? 30 : 36} />
            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-white">{user.name}</span>
                <span className="block truncate text-xs text-white/45">{user.email}</span>
              </span>
            )}
          </Link>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Main column                                                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/8 bg-grid-black/70 px-4 py-3 backdrop-blur-xl sm:px-6">
          {/* universal back — appears on nested pages */}
          {canGoBack && (
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] pl-2.5 pr-3.5 text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
            >
              <Icon name="chevron" size={16} className="rotate-180" /> Back
            </button>
          )}

          {/* mobile logo */}
          <Link href="/dashboard" className={`text-lg font-semibold tracking-tight text-white lg:hidden ${canGoBack ? "hidden sm:block" : ""}`}>
            Grid<span className="text-grid-blue">.</span>
          </Link>

          <Link
            href="/dashboard/browse"
            className="ml-auto hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/45 transition-colors hover:text-white/70 sm:flex lg:ml-0 lg:mr-auto lg:w-72"
          >
            <Icon name="search" size={17} />
            <span>Search talent, jobs…</span>
          </Link>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <ThemeToggle />
            <RoleToggle size="sm" />
            <button
              onClick={primaryAction}
              aria-label={role === "client" ? "Post a job" : "Add to portfolio"}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-on-accent transition-transform hover:scale-105 ${role === "client" ? "bg-client-green" : "bg-grid-blue"}`}
            >
              <Icon name="plus" size={20} />
            </button>
            <button
              onClick={() => open(<NotificationsSheet role={role} />)}
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon name="bell" size={19} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-urgent-red ring-2 ring-grid-black" />
            </button>
            <Link href="/dashboard/profile" className="lg:hidden">
              <Avatar id="john" name={user.name} size={34} />
            </Link>
          </div>
        </header>

        {/* Page body */}
        <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-7 sm:px-6 lg:pb-12 lg:pt-10">{children}</main>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Mobile bottom nav                                                 */}
      {/* ---------------------------------------------------------------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-5 lg:hidden">
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-soft-black/90 px-2 py-2 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <BottomBtn href="/dashboard" icon="home" pathname={pathname} accent={accentText} />
          <BottomBtn href="/dashboard/browse" icon="compass" pathname={pathname} accent={accentText} />
          <button
            onClick={primaryAction}
            aria-label={role === "client" ? "Post a job" : "Add to portfolio"}
            className={`flex h-12 w-12 items-center justify-center rounded-full text-on-accent ${role === "client" ? "bg-client-green" : "bg-grid-blue"}`}
          >
            <Icon name="plus" size={24} />
          </button>
          <BottomBtn href="/dashboard/jobs" icon="briefcase" pathname={pathname} accent={accentText} />
          <button
            onClick={() => setDrawer(true)}
            aria-label="More"
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/55 transition-colors hover:text-white"
          >
            <Icon name="menu" size={22} />
          </button>
        </div>
      </nav>

      {/* Mobile full-nav drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_GRID }}
            onClick={() => setDrawer(false)}
            className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-md lg:hidden"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: "10%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "10%", opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_GRID }}
              className="max-h-[85dvh] w-full overflow-y-auto rounded-t-[28px] border border-white/10 bg-[radial-gradient(130%_120%_at_50%_0%,var(--color-card-from)_0%,var(--color-grid-black)_60%)] px-5 pb-8 pt-3"
            >
              <div className="flex justify-center pb-3">
                <span className="h-1.5 w-10 rounded-full bg-white/20" />
              </div>
              {groups.map((g, gi) => (
                <div key={gi} className={gi > 0 ? "mt-5" : ""}>
                  {g.heading && <div className="px-1 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">{g.heading}</div>}
                  <div className="grid grid-cols-3 gap-2">
                    {g.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setDrawer(false)}
                          className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center text-xs ${
                            active ? `border-white/15 bg-white/[0.06] text-white` : "border-white/8 bg-white/[0.02] text-white/60"
                          }`}
                        >
                          <Icon name={item.icon} size={20} className={active ? accentText : "text-white/55"} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="mt-6 flex gap-2">
                <button onClick={() => { setDrawer(false); open(<InviteSheet />); }} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/12 py-3 text-sm text-white">
                  <Icon name="gift" size={17} className="text-review-gold" /> Invite
                </button>
                <button onClick={handleSignOut} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/12 py-3 text-sm text-white">
                  <Icon name="logout" size={17} /> Sign out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global quick notepad — available across the dashboard */}
      <Notepad />
    </div>
  );
}

function BottomBtn({ href, icon, pathname, accent }: { href: string; icon: IconName; pathname: string; accent: string }) {
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${active ? `bg-white/10 ${accent}` : "text-white/55 hover:text-white"}`}
    >
      <Icon name={icon} size={22} />
    </Link>
  );
}
