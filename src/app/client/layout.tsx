import { redirect } from "next/navigation";
import { ThemeProvider } from "@/components/theme";
import { ClientProvider } from "@/components/client/client-context";
import { getCurrentUser } from "@/lib/security/auth-guard";
import { isAdminEmail } from "@/lib/admin";
import { isPlatformLive } from "@/lib/config-store";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  // Launch gate: pre-launch the public sees only the waitlist. Admins always pass.
  const current = await getCurrentUser();
  if (!isAdminEmail(current?.email) && !(await isPlatformLive())) redirect("/waitlist");

  return (
    <ThemeProvider>
      <ClientProvider>{children}</ClientProvider>
    </ThemeProvider>
  );
}
