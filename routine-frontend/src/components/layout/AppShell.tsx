"use client";

import { usePathname } from "next/navigation";
import { useAuth, PUBLIC_PATHS } from "@/context/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
import Navbar from "@/components/layout/Navbar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user || PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AppSidebar />

      <div className="flex flex-1 flex-col">
        <Navbar />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
