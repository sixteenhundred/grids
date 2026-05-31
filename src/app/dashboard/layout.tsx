import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RoleProvider } from "@/components/dashboard/role-context";
import { SheetProvider } from "@/components/dashboard/sheet";
import { DashboardShell } from "@/components/dashboard/shell";

// Demo mode (set NEXT_PUBLIC_DEMO_MODE=1) opens the app with no login — ideal
// for showing the product to investors/users. It also tolerates having no
// database configured, so the dashboard always loads.
const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
const DEMO_USER = { name: "John Hope", email: "demo@grid.com" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);

  if (!session && !DEMO) {
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
