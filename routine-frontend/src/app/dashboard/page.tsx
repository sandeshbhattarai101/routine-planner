"use client";

import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back{user?.email ? `, ${user.email}` : ""}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-medium">{user?.role}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-medium">{user?.email}</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
