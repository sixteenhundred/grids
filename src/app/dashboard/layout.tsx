import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { hasDemoSession } from "@/lib/demo-auth";
import { DEMO_USER } from "@/lib/demo";
import { isAdminEmail } from "@/lib/admin";
import { getFlags } from "@/lib/admin-actions";
import { ThemeProvider } from "@/components/theme";
import { RoleProvider } from "@/components/dashboard/role-context";
import { SheetProvider } from "@/components/dashboard/sheet";
import { DashboardShell } from "@/components/dashboard/shell";
import { PlanProvider } from "@/components/dashboard/plan-context";
import { FeatureGate } from "@/components/dashboard/feature-gate";

// Campaign's live web research (Claude + web_search) can run 20-40s — give
// server actions on dashboard routes room before the platform times them out.
// (Vercel Hobby caps at 60s; raise on Pro if needed.)
export const maxDuration = 60;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Demo mode: auth is NON-BLOCKING. We read any real/demo session for the
  // signed-in identity, but never redirect away — anyone can click straight
  // into the platform as a guest (falls back to the demo user). The login UI
  // still exists and works; it's just optional. To re-enable the auth gate,
  // redirect to "/login" when there's no session below.
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const demo = await hasDemoSession();

  const user = session?.user ?? DEMO_USER;
  const isAdmin = isAdminEmail(user.email);
  const flags = await getFlags();
  void demo; // detected for parity; not used to gate access in demo mode

  return (
    <ThemeProvider>
      <RoleProvider>
        <SheetProvider>
          <PlanProvider>
            <DashboardShell user={{ name: user.name, email: user.email }} isAdmin={isAdmin} flags={flags}>
              <FeatureGate>{children}</FeatureGate>
            </DashboardShell>
          </PlanProvider>
        </SheetProvider>
      </RoleProvider>
    </ThemeProvider>
  );
}
