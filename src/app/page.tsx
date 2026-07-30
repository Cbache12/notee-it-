import { getSessionFromCookies } from "@/lib/session-server";
import { ConnectButton } from "@/components/ConnectButton";
import { Dashboard } from "@/components/Dashboard";

export default function HomePage() {
  const session = getSessionFromCookies();
  return session ? <Dashboard /> : <ConnectButton />;
}
