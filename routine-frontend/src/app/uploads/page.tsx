"use client";

import { useState } from "react";
import {
  uploadFile,
  getMappings,
  createMapping,
  processImport,
  UploadResult,
} from "@/services/import_service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ENTITY_TYPES = [
  "teacher",
  "classroom",
  "section",
  "subject",
  "class_subject",
] as const;

const SYSTEM_FIELDS: Record<string, string[]> = {
  teacher: ["name", "max_periods_per_day"],
  classroom: ["name"],
  section: ["name", "classroom_name"],
  subject: ["name"],
  class_subject: [
    "classroom_name",
    "section_name",
    "subject_name",
    "periods_per_week",
  ],
};

export default function Page() {
  const [entityType, setEntityType] = useState<string>(ENTITY_TYPES[0]);
  const [upload, setUpload] = useState<UploadResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setStatus("Uploading...");

    try {
      const result = await uploadFile(file);
      setUpload(result);

      const existing = await getMappings(entityType);
      const prefill: Record<string, string> = {};
      for (const m of existing) {
        if (result.columns.includes(m.excel_column)) {
          prefill[m.excel_column] = m.system_field;
        }
      }
      setMapping(prefill);
      setStatus("");
    } catch {
      setStatus("");
      setError("Failed to upload or parse file.");
    }
  }

  async function handleImport() {
    if (!upload) return;

    setError("");
    setStatus("Saving mappings...");

    try {
      for (const [excelColumn, systemField] of Object.entries(mapping)) {
        if (!systemField) continue;
        await createMapping(entityType, excelColumn, systemField);
      }

      setStatus("Importing rows...");

      const result = await processImport(entityType, upload.rows);

      setStatus(`Imported ${result.imported} ${entityType} record(s).`);
      setUpload(null);
      setMapping({});
    } catch (err: unknown) {
      setStatus("");
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Import failed.";
      setError(message);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Upload Excel / CSV</h1>
        <p className="text-sm text-muted-foreground">
          Import teachers, classrooms, sections, subjects, or class subjects in bulk.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Choose data type & file</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Entity type</label>
            <Select
              value={entityType}
              onValueChange={(value) => {
                setEntityType(value);
                setUpload(null);
                setMapping({});
              }}
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">File (.xlsx or .csv)</label>
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              className="block text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {upload && (
        <Card>
          <CardHeader>
            <CardTitle>2. Map columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upload.columns.map((column) => (
              <div key={column} className="flex items-center gap-3">
                <span className="w-48 truncate text-sm font-medium">{column}</span>
                <Select
                  value={mapping[column] || "__ignore__"}
                  onValueChange={(value) =>
                    setMapping({
                      ...mapping,
                      [column]: value === "__ignore__" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="-- ignore --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ignore__">-- ignore --</SelectItem>
                    {SYSTEM_FIELDS[entityType].map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            <Button onClick={handleImport}>
              Import {upload.rows.length} rows
            </Button>
          </CardContent>
        </Card>
      )}

      {status && <p className="text-sm text-muted-foreground">{status}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
