"use client";

import { useState } from "react";

import {
  registerSchool,
} from "@/services/registration_service";

export default function RegisterSchoolPage() {

  const [form, setForm] =
    useState({
      school_name: "",
      admin_name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
    });

  const [success, setSuccess] =
    useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    await registerSchool(form);

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="p-10">
        Registration submitted.
        Await approval.
      </div>
    );
  }

  return (
    <div className="max-w-xl p-10">

      <h1 className="text-3xl mb-6">
        Register School
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        <input
          className="border p-2 w-full"
          placeholder="School Name"
          value={form.school_name}
          onChange={(e) =>
            setForm({
              ...form,
              school_name:
                e.target.value,
            })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Admin Name"
          value={form.admin_name}
          onChange={(e) =>
            setForm({
              ...form,
              admin_name:
                e.target.value,
            })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email:
                e.target.value,
            })
          }
        />

        <input
          type="password"
          className="border p-2 w-full"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password:
                e.target.value,
            })
          }
        />

        <input
          className="border p-2 w-full"
          placeholder="Phone"
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
          className="border p-2 w-full"
          placeholder="Address"
          value={form.address}
          onChange={(e) =>
            setForm({
              ...form,
              address:
                e.target.value,
            })
          }
        />

        <button
          className="
          bg-black
          text-white
          px-4
          py-2
          rounded
          "
        >
          Register
        </button>

      </form>

    </div>
  );
}