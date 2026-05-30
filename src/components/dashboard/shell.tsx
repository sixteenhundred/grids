"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { EASE_GRID } from "@/components/landing/motion";
import { signOut } from "@/lib/auth-client";
import { useRole, RoleToggle } from "./role-context";
import { useSheet } from "./sheet";
import { NotificationsSheet, PostJobSheet, UploadSheet, InviteSheet } from "./sheets";
import { Avatar } from "./ui";
import { Icon, type IconName } from "./icons";
import type { Role } from "@/lib/grid-data";

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
  const discover: NavItem[] = [
    { label: "Radar", href: "/dashboard/radar", icon: "map" },
    { label: "Community", href: "/dashboard/community", icon: "users" },
    { label: "Saved", href: "/dashboard/saved", icon: "bookmark" },
    { label: "News", href: "/dashboard/news", icon: "news" },
    { label: "Trends", href: "/dashboard/trends", icon: "trending" },
  ];
  const grow: NavItem[] = [
    { label: "AI Studio", href: "/dashboard/studio", icon: "sparkles" },
    { label: "Shop", href: "/dashboard/shop", icon: "shop" },
    { label: "Academy", href: "/dashboard/academy", icon: "school" },
    { label: "Collab", href: "/dashboard/collab", icon: "users" },
  ];

  if (role === "client") {
    return [
      { items: main },
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
  children,
}: {
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  const { role } = useRole();
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useSheet();
  const [drawer, setDrawer] = useState(false);
  const groups = navFor(role);
  // Full literal class strings so Tailwind's JIT can see them.
  const accentText = role === "client" ? "text-client-green" : "text-grid-blue";

  const primaryAction = () => (role === "client" ? open(<PostJobSheet />) : open(<UploadSheet />));

  async function handleSignOut() {
    await signOut();
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
      <aside className="sticky top-0 z-30 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/8 bg-[#0a0b0e]/60 px-4 py-6 backdrop-blur-xl lg:flex">
        <Link href="/dashboard" className="px-3 text-xl font-semibold tracking-tight text-white">
          Grid<span className="text-grid-blue">.</span>
        </Link>

        <nav className="mt-7 flex-1 overflow-y-auto no-scrollbar">
          {groups.map((g, gi) => (
            <div key={gi} className={gi > 0 ? "mt-6" : ""}>
              {g.heading && <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">{g.heading}</div>}
              <ul className="flex flex-col gap-0.5">
                {g.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                          active ? "bg-white/[0.06] font-medium text-white" : "text-white/55 hover:bg-white/[0.03] hover:text-white"
                        }`}
                      >
                        <span className={active ? accentText : "text-white/45 group-hover:text-white/70"}>
                          <Icon name={item.icon} size={19} />
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-4 border-t border-white/8 pt-4">
          <button onClick={() => open(<InviteSheet />)} className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/55 transition-colors hover:bg-white/[0.03] hover:text-white">
            <Icon name="gift" size={19} className="text-review-gold" /> Invite &amp; earn
          </button>
          <Link href="/dashboard/profile" className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${isActive(pathname, "/dashboard/profile") ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}>
            <Avatar id="john" name={user.name} size={36} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white">{user.name}</span>
              <span className="block truncate text-xs text-white/45">{user.email}</span>
            </span>
          </Link>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Main column                                                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/8 bg-[#08090c]/70 px-4 py-3 backdrop-blur-xl sm:px-6">
          {/* mobile logo */}
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-white lg:hidden">
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
            <RoleToggle size="sm" />
            <button
              onClick={primaryAction}
              aria-label={role === "client" ? "Post a job" : "Add to portfolio"}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform hover:scale-105 ${role === "client" ? "bg-client-green" : "bg-grid-blue"}`}
            >
              <Icon name="plus" size={20} />
            </button>
            <button
              onClick={() => open(<NotificationsSheet role={role} />)}
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon name="bell" size={19} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-urgent-red ring-2 ring-[#08090c]" />
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
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#16171b]/90 px-2 py-2 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <BottomBtn href="/dashboard" icon="home" pathname={pathname} accent={accentText} />
          <BottomBtn href="/dashboard/browse" icon="compass" pathname={pathname} accent={accentText} />
          <button
            onClick={primaryAction}
            aria-label={role === "client" ? "Post a job" : "Add to portfolio"}
            className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${role === "client" ? "bg-client-green" : "bg-grid-blue"}`}
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
              className="max-h-[85dvh] w-full overflow-y-auto rounded-t-[28px] border border-white/10 bg-[radial-gradient(130%_120%_at_50%_0%,#121318_0%,#08090b_60%)] px-5 pb-8 pt-3"
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
