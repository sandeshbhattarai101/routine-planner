"use client";

import { useState } from "react";

interface Props {
  initialName?: string;

  onSubmit: (
    name: string
  ) => Promise<void>;
}

export default function SchoolForm({
  initialName = "",
  onSubmit,
}: Props) {
  const [name, setName] =
    useState(initialName);

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      await onSubmit(name);

      setName("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="
      flex
      gap-3
      mb-6
      "
    >
      <input
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
        placeholder="School Name"
        className="
        border
        p-2
        flex-1
        "
      />

      <button
        disabled={loading}
        className="
        rounded
        bg-black
        px-4
        py-2
        text-white
        "
      >
        {loading
          ? "Saving..."
          : "Save"}
      </button>
    </form>
  );
}