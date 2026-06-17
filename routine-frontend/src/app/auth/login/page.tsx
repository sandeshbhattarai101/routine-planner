"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { login } from "@/services/auth_service";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleLogin() {

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

      router.push(
        "/dashboard"
      );

    } catch {

      alert(
        "Invalid credentials"
      );

    } finally {

      setLoading(false);

    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">

      <div className="w-full max-w-md rounded-lg border p-8">

        <h1 className="mb-6 text-2xl font-bold">
          School Timetable
        </h1>

        <input
          className="mb-3 w-full border p-2"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
        />

        <input
          type="password"
          className="mb-4 w-full border p-2"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full rounded bg-black p-2 text-white"
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>

      </div>

    </div>
  );
}