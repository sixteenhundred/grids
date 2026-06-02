import { getCurrentUser } from "@/lib/security/auth-guard";
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
  // Auth is NON-BLOCKING during the build/demo phase: we read the Supabase
  // session for the signed-in identity but never redirect. Guests use the
  // "Continue as guest" anonymous sign-in. At launch, gate behind PLATFORM_LIVE.
  const current = await getCurrentUser();
  const user = current ?? { name: "Guest", email: "" };
  const isAdmin = isAdminEmail(current?.email);
  const flags = await getFlags();

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
