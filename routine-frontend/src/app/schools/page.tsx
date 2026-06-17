"use client";

import { useEffect, useState } from "react";
import SchoolForm from "@/components/schools/SchoolForm";
import SchoolTable from "@/components/schools/SchoolTable";
import { School } from "@/types/school";
import {
  createSchool,
  getSchools,
  updateSchool,
} from "@/services/school_service";

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [editing, setEditing] = useState<School | null>(null);

  async function loadSchools() {
    const data = await getSchools();
    setSchools(data);
  }

  useEffect(() => {
    loadSchools();
  }, []);

  async function handleCreate(name: string) {
    await createSchool({ name });
    await loadSchools();
  }

  async function handleEdit(name: string) {
    if (!editing) return;
    await updateSchool(editing.id, { name });
    setEditing(null);
    await loadSchools();
  }

  return (
    <div>
      {/* Fixed: Single line class string to prevent hydration mismatch */}
      <h1 className="text-3xl font-bold mb-6">
        Schools
      </h1>

      <SchoolForm
        initialName={editing?.name}
        onSubmit={editing ? handleEdit : handleCreate}
      />

      <SchoolTable
        schools={schools}
        onEdit={setEditing}
      />
    </div>
  );
}