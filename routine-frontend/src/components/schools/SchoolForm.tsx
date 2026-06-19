"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <form onSubmit={handleSubmit} className="mb-6 flex gap-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="School name"
        className="flex-1"
      />

      <Button disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
