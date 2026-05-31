import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasDemoSession } from "@/lib/demo-auth";
import { DEMO_USER } from "@/lib/demo";
import { RoleProvider } from "@/components/dashboard/role-context";
import { SheetProvider } from "@/components/dashboard/sheet";
import { DashboardShell } from "@/components/dashboard/shell";

// Set NEXT_PUBLIC_DEMO_MODE=1 to open the whole app with no login at all.
const OPEN_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Tolerate a missing database (getSession can throw) so the app still loads.
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const demo = await hasDemoSession();

  if (!session && !demo && !OPEN_DEMO) {
    redirect("/login");
  }

  const user = session?.user ?? DEMO_USER;

  return (
    <RoleProvider>
      <SheetProvider>
        <DashboardShell user={{ name: user.name, email: user.email }}>{children}</DashboardShell>
      </SheetProvider>
    </RoleProvider>
  );
}
