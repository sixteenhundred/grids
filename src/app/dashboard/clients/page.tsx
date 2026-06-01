import { redirect } from "next/navigation";

// Consolidated: the single client subscription/experience now lives under
// /client. This older standalone page redirects there.
export default function DashboardClientsRedirect() {
  redirect("/client/subscriptions");
}
