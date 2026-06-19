"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  registerSchool,
} from "@/services/registration_service";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterSchoolPage() {

  const router = useRouter();

  const [form, setForm] =
    useState({
      school_name: "",
      admin_name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
    });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);

      await registerSchool(form);

      router.push("/auth/login?registered=1");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Registration failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">

      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Register your school</CardTitle>
          <CardDescription>
            Submit your details below. A super admin will review and approve your
            request before you can log in.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-3"
          >

            <Input
              placeholder="School name"
              value={form.school_name}
              onChange={(e) =>
                setForm({
                  ...form,
                  school_name:
                    e.target.value,
                })
              }
              required
            />

            <Input
              placeholder="Admin name"
              value={form.admin_name}
              onChange={(e) =>
                setForm({
                  ...form,
                  admin_name:
                    e.target.value,
                })
              }
              required
            />

            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email:
                    e.target.value,
                })
              }
              required
            />

            <Input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password:
                    e.target.value,
                })
              }
              required
            />

            <Input
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone:
                    e.target.value,
                })
              }
            />

            <textarea
              className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Address (optional)"
              value={form.address}
              onChange={(e) =>
                setForm({
                  ...form,
                  address:
                    e.target.value,
                })
              }
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button disabled={loading} className="w-full">
              {loading ? "Submitting..." : "Register"}
            </Button>

          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
