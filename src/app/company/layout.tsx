import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/security/auth-guard";
import { isAdminEmail } from "@/lib/admin";
import { isPlatformLive } from "@/lib/config-store";

/**
 * Public company pages sit behind the launch switch like the rest of the platform.
 * Previously they were reachable pre-launch AND rendered demo data, leaking the
 * unlaunched platform + fake data in prod (SECURITY_AUDIT #7). Admins bypass;
 * everyone else is sent to /waitlist until the platform is live. Pass-through
 * wrapper — no visual change to the page.
 */
export default async function CompanyLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const isAdmin = !!user && isAdminEmail(user.email);
  if (!isAdmin && !(await isPlatformLive())) redirect("/waitlist");
  return <>{children}</>;
}
