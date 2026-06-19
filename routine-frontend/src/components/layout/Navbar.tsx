"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/layout/BackButton";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-between border-b bg-background px-4 py-3">
      <BackButton />

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{user?.email}</span>

        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
