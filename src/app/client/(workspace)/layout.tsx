import { ClientShell } from "@/components/client/client-shell";

export default function ClientWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
