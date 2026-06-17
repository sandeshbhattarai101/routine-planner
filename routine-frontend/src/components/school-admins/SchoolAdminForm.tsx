"use client";

import { useState } from "react";

import { School } from "@/types/school";

interface Props {

  schools: School[];

  onSubmit: (
    email: string,
    password: string,
    schoolId: string
  ) => Promise<void>;
}

export default function SchoolAdminForm({
  schools,
  onSubmit,
}: Props) {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [schoolId, setSchoolId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();

    try {

      setLoading(true);

      await onSubmit(
        email,
        password,
        schoolId
      );

      setEmail("");
      setPassword("");
      setSchoolId("");

    } finally {

      setLoading(false);
    }
  }

  return (

    <form
      onSubmit={handleSubmit}
      className="
      space-y-4
      mb-8
      "
    >

      <input
        value={email}
        onChange={(e) =>
          setEmail(
            e.target.value
          )
        }
        placeholder="Email"
        className="
        border
        p-2
        w-full
        "
      />

      <input
        type="password"
        value={password}
        onChange={(e) =>
          setPassword(
            e.target.value
          )
        }
        placeholder="Password"
        className="
        border
        p-2
        w-full
        "
      />

      <select
        value={schoolId}
        onChange={(e) =>
          setSchoolId(
            e.target.value
          )
        }
        className="
        border
        p-2
        w-full
        "
      >

        <option value="">
          Select School
        </option>

        {schools.map(
          (school) => (

            <option
              key={school.id}
              value={school.id}
            >
              {school.name}
            </option>

          )
        )}

      </select>

      <button
        disabled={loading}
        className="
        bg-black
        text-white
        px-4
        py-2
        rounded
        "
      >
        {loading
          ? "Creating..."
          : "Create Admin"}
      </button>

    </form>
  );
}