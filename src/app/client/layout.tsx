import { ThemeProvider } from "@/components/theme";
import { ClientProvider } from "@/components/client/client-context";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ClientProvider>{children}</ClientProvider>
    </ThemeProvider>
  );
}
