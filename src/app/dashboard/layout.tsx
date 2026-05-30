import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RoleProvider } from "@/components/dashboard/role-context";
import { SheetProvider } from "@/components/dashboard/sheet";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return (
    <RoleProvider>
      <SheetProvider>
        <DashboardShell user={{ name: session.user.name, email: session.user.email }}>{children}</DashboardShell>
      </SheetProvider>
    </RoleProvider>
  );
}
