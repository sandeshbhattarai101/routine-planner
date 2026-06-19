"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/80 hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

export default function AppSidebar() {
  const { user } = useAuth();

  return (
    <aside className="flex w-60 flex-col border-r bg-background">
      <div className="border-b p-4 text-lg font-semibold">
        Routine SaaS
      </div>

      <nav className="flex flex-col gap-1 p-3">
        <NavLink href="/dashboard">Dashboard</NavLink>

        {user?.role === "SUPER_ADMIN" && (
          <>
            <NavLink href="/schools">Schools</NavLink>
            <NavLink href="/school-admins">School Admins</NavLink>
            <NavLink href="/registration-requests">
              Registration Requests
            </NavLink>
          </>
        )}

        {user?.role === "SCHOOL_ADMIN" && (
          <>
            <NavLink href="/teachers">Teachers</NavLink>
            <NavLink href="/subjects">Subjects</NavLink>
            <NavLink href="/uploads">Upload Excel</NavLink>
            <NavLink href="/timetable">Timetable</NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
