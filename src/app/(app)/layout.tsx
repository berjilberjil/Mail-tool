"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { useSession, organization } from "@/lib/auth-client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [orgReady, setOrgReady] = useState(false);

  useEffect(() => {
    if (isPending) return;

    // Not logged in → redirect to login
    if (!session?.user) {
      router.push("/login");
      return;
    }

    // Already has an active org → good to go
    if (session.session.activeOrganizationId) {
      setOrgReady(true);
      return;
    }

    // No active org → auto-select the first one
    (async () => {
      try {
        const { data: orgs } = await organization.list();
        if (orgs && orgs.length > 0) {
          await organization.setActive({ organizationId: orgs[0].id });
          setOrgReady(true);
        } else {
          // User has no org — create one or redirect
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    })();
  }, [session, isPending, router]);

  if (isPending || !orgReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
