"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { login } from "@/services/auth_service";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const { refreshUser } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  const justRegistered = searchParams.get("registered") === "1";

  async function handleLogin(e: React.FormEvent) {

    e.preventDefault();

    setError("");

    try {

      setLoading(true);

      const response =
        await login(
          email,
          password
        );

      localStorage.setItem(
        "token",
        response.access_token
      );

      await refreshUser();

      router.push(
        "/dashboard"
      );

    } catch (err: unknown) {

      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Invalid credentials";

      setError(message);

    } finally {

      setLoading(false);

    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">School Timetable</CardTitle>
          <CardDescription>Sign in to manage your school&apos;s routine.</CardDescription>
        </CardHeader>

        <CardContent>
          {justRegistered && (
            <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Registration submitted. Once a super admin approves it, you can log in here.
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? "Logging in..."
                : "Login"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register-school" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
