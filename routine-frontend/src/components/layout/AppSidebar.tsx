"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AppSidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-64 border-r bg-white">
      <div className="p-5 text-xl font-bold">
        Routine SaaS
      </div>

      <nav className="flex flex-col">
        <Link href="/dashboard" className="p-3">
          Dashboard
        </Link>

        {user?.role === "SUPER_ADMIN" && (
          <>
            <Link
              href="/schools"
              className="p-3"
            >
              Schools
            </Link>

            <Link
              href="/school-admins"
              className="p-3"
            >
              School Admins
            </Link>

            <Link
              href="/registration-requests"
              className="p-3"
            >
              Registration Requests
            </Link>
          </>
        )}

        {user?.role === "SCHOOL_ADMIN" && (
          <>
            <Link href="/teachers" className="p-3">
              Teachers
            </Link>
            <Link href="/subjects" className="p-3">
              Subjects
            </Link>
            <Link href="/uploads" className="p-3">
              Upload Excel
            </Link>
            <Link href="/timetable" className="p-3">
              Timetable
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}