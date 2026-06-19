"use client";

import { useEffect, useState } from "react";
import SchoolForm from "@/components/schools/SchoolForm";
import SchoolTable from "@/components/schools/SchoolTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Schools</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage the schools on this platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? `Edit "${editing.name}"` : "Add a school"}</CardTitle>
        </CardHeader>
        <CardContent>
          <SchoolForm
            initialName={editing?.name}
            onSubmit={editing ? handleEdit : handleCreate}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All schools</CardTitle>
        </CardHeader>
        <CardContent>
          <SchoolTable schools={schools} onEdit={setEditing} />
        </CardContent>
      </Card>
    </div>
  );
}
