"use client";

import { useState } from "react";

import { School } from "@/types/school";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      className="grid gap-3 sm:grid-cols-2"
    >

      <Input
        value={email}
        onChange={(e) =>
          setEmail(
            e.target.value
          )
        }
        placeholder="Email"
      />

      <Input
        type="password"
        value={password}
        onChange={(e) =>
          setPassword(
            e.target.value
          )
        }
        placeholder="Password"
      />

      <Select value={schoolId} onValueChange={setSchoolId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select school" />
        </SelectTrigger>
        <SelectContent>
          {schools.map((school) => (
            <SelectItem key={school.id} value={school.id}>
              {school.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button disabled={loading} className="sm:w-fit">
        {loading
          ? "Creating..."
          : "Create admin"}
      </Button>

    </form>
  );
}
