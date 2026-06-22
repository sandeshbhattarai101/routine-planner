"use client";

import { useState } from "react";
import {
  uploadFile,
  getMappings,
  createMapping,
  processImport,
  UploadSheet,
} from "@/services/import_service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ENTITY_TYPES = [
  "teacher",
  "classroom",
  "section",
  "subject",
  "class_subject",
  "teacher_subject",
] as const;

// Import order matters: sections need classrooms, class_subjects need
// classroom+section+subject, teacher_subjects need teacher+subject.
const IMPORT_ORDER = [
  "teacher",
  "classroom",
  "subject",
  "section",
  "class_subject",
  "teacher_subject",
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
    "days_per_week",
    "teacher_name",
  ],
  teacher_subject: ["teacher_name", "subject_name"],
};

// Fields that must be mapped before a sheet can be imported.
const REQUIRED_FIELDS: Record<string, string[]> = {
  teacher: ["name"],
  classroom: ["name"],
  section: ["name", "classroom_name"],
  subject: ["name"],
  class_subject: ["classroom_name", "section_name", "subject_name", "periods_per_week"],
  teacher_subject: ["teacher_name", "subject_name"],
};

const ENTITY_LABELS: Record<string, string> = {
  teacher: "Teachers",
  classroom: "Classes",
  section: "Sections",
  subject: "Subjects",
  class_subject: "Curriculum (class subjects)",
  teacher_subject: "Teacher subjects",
};

const ENTITY_DESCRIPTIONS: Record<string, string> = {
  teacher: "One row per teacher. Used to build the staff list and to check workload limits when generating the timetable.",
  classroom: "One row per class/grade (e.g. Grade 1, Grade 2). Sections and curriculum are linked to these.",
  section: "One row per section within a class (e.g. Grade 5 - A, Grade 5 - B). Each section needs to know which class it belongs to.",
  subject: "One row per subject taught in the school (e.g. Mathematics, Science).",
  class_subject: "The curriculum: which subjects are taught to which class/section, how many periods per week, and (optionally) which teacher teaches it.",
  teacher_subject: "Which subjects each teacher is qualified to teach. Used to auto-assign a teacher when a curriculum row doesn't specify one.",
};

const FIELD_DESCRIPTIONS: Record<string, Record<string, string>> = {
  teacher: {
    name: "Full name of the teacher, as it should appear on the timetable.",
    max_periods_per_day: "Maximum periods this teacher can teach in one day (defaults to 5 if left unmapped).",
  },
  classroom: {
    name: 'Name of the class or grade, e.g. "Grade 5" or "Class 10".',
  },
  section: {
    name: 'Section label within a class, e.g. "A" or "B".',
    classroom_name: "Must match a class name exactly (from the Classes sheet) so the section is linked to the right class.",
  },
  subject: {
    name: 'Name of the subject, e.g. "Mathematics".',
  },
  class_subject: {
    classroom_name: "Must match a class name exactly (from the Classes sheet).",
    section_name: "Must match a section name exactly (from the Sections sheet).",
    subject_name: "Must match a subject name exactly (from the Subjects sheet).",
    periods_per_week: "How many periods this subject should be taught per week for this class/section.",
    teacher_name: "Teacher who teaches this subject to this class. Leave unmapped to auto-assign from Teacher subjects instead.",
    days_per_week: "Optional. How many distinct days per week this subject runs, e.g. 3 for a subject taught only 3 days a week. Leave unmapped for subjects taught every day.",
  },
  teacher_subject: {
    teacher_name: "Must match a teacher name exactly (from the Teachers sheet).",
    subject_name: "Must match a subject name exactly (from the Subjects sheet).",
  },
};

function firstSampleValue(rows: Record<string, unknown>[], column: string): string {
  for (const row of rows) {
    const value = row[column];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "";
}

function guessEntityType(sheetName: string): string {
  const normalized = sheetName.toLowerCase().replace(/[\s_-]+/g, "_").trim();

  const aliases: Record<string, string> = {
    teacher: "teacher",
    teachers: "teacher",
    classroom: "classroom",
    classrooms: "classroom",
    class: "classroom",
    classes: "classroom",
    section: "section",
    sections: "section",
    subject: "subject",
    subjects: "subject",
    class_subject: "class_subject",
    class_subjects: "class_subject",
    curriculum: "class_subject",
    teacher_subject: "teacher_subject",
    teacher_subjects: "teacher_subject",
  };

  return aliases[normalized] || "";
}

interface SheetState extends UploadSheet {
  entityType: string;
  mapping: Record<string, string>;
}

export default function Page() {
  const [sheets, setSheets] = useState<SheetState[]>([]);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [importing, setImporting] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setStatus("Uploading...");
    setSheets([]);

    try {
      const result = await uploadFile(file);

      const prepared: SheetState[] = [];
      for (const sheet of result.sheets) {
        const entityType = guessEntityType(sheet.name);
        const mapping: Record<string, string> = {};

        if (entityType) {
          const existing = await getMappings(entityType);
          for (const m of existing) {
            if (sheet.columns.includes(m.excel_column)) {
              mapping[m.excel_column] = m.system_field;
            }
          }
        }

        prepared.push({ ...sheet, entityType, mapping });
      }

      setSheets(prepared);
      setStatus("");
    } catch {
      setStatus("");
      setError("Failed to upload or parse file.");
    }
  }

  function updateSheet(index: number, updates: Partial<SheetState>) {
    setSheets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  }

  async function handleImportAll() {
    setError("");
    setImporting(true);

    try {
      for (const entityType of IMPORT_ORDER) {
        const sheet = sheets.find((s) => s.entityType === entityType);
        if (!sheet) continue;

        setStatus(`Saving column mappings for ${entityType}...`);
        for (const [excelColumn, systemField] of Object.entries(sheet.mapping)) {
          if (!systemField) continue;
          await createMapping(entityType, excelColumn, systemField);
        }

        setStatus(`Importing ${entityType} rows...`);
        const result = await processImport(entityType, sheet.rows);
        setStatus(`Imported ${result.imported} ${entityType} record(s).`);
      }

      setStatus("Import complete.");
      setSheets([]);
    } catch (err: unknown) {
      setStatus("");
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Import failed.";
      setError(message);
    } finally {
      setImporting(false);
    }
  }

  function missingRequiredFields(sheet: SheetState): string[] {
    if (!sheet.entityType) return [];
    const required = REQUIRED_FIELDS[sheet.entityType] || [];
    const mappedFields = new Set(Object.values(sheet.mapping).filter(Boolean));
    return required.filter((field) => !mappedFields.has(field));
  }

  const unassignedSheets = sheets.filter((s) => !s.entityType);
  const sheetsWithMissingFields = sheets.filter(
    (s) => s.entityType && missingRequiredFields(s).length > 0
  );
  const canImport =
    sheets.length > 0 &&
    unassignedSheets.length === 0 &&
    sheetsWithMissingFields.length === 0;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Upload Excel / CSV</h1>
        <p className="text-sm text-muted-foreground">
          Upload one workbook with a sheet per data type (teachers, classes,
          sections, subjects, curriculum, teacher subjects) — or a single CSV for one
          data type. Sheets named after the data type are detected automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step 1 · Choose a file</CardTitle>
          <CardDescription>
            Accepted formats: .xlsx (one sheet per data type) or .csv (a single data type).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
            className="block w-full text-sm rounded-md border border-input bg-background file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
          />
        </CardContent>
      </Card>

      {sheets.length > 0 && (
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Step 2 · Confirm data type and map columns for each sheet
          </h2>
          <p className="text-sm text-muted-foreground">
            For every column in your file, tell us which field it represents. Columns
            left as &quot;ignore&quot; will not be imported.
          </p>
        </div>
      )}

      {sheets.map((sheet, index) => {
        const missing = missingRequiredFields(sheet);
        const isReady = sheet.entityType && missing.length === 0;

        return (
          <Card key={sheet.name} className={!sheet.entityType ? "border-amber-400" : undefined}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{sheet.name}</CardTitle>
                {sheet.entityType ? (
                  isReady ? (
                    <Badge variant="success">Ready</Badge>
                  ) : (
                    <Badge variant="destructive">Missing fields</Badge>
                  )
                ) : (
                  <Badge variant="outline">Select data type</Badge>
                )}
              </div>
              <CardDescription>{sheet.rows.length} row(s) detected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">What kind of data is this?</label>
                <Select
                  value={sheet.entityType}
                  onValueChange={(value) => updateSheet(index, { entityType: value, mapping: {} })}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="-- select data type --" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ENTITY_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {sheet.entityType && (
                  <p className="text-xs text-muted-foreground">
                    {ENTITY_DESCRIPTIONS[sheet.entityType]}
                  </p>
                )}
              </div>

              {sheet.entityType && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Map columns</label>
                    {missing.length > 0 && (
                      <span className="text-xs text-destructive">
                        Still need: {missing.join(", ")}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 rounded-md border p-3">
                    {sheet.columns.map((column) => {
                      const required = REQUIRED_FIELDS[sheet.entityType] || [];
                      const selectedField = sheet.mapping[column] || "";
                      const sample = firstSampleValue(sheet.rows, column);

                      return (
                        <div key={column} className="space-y-1 border-b pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-48 min-w-0">
                              <div className="truncate text-sm font-medium">{column}</div>
                              {sample && (
                                <div className="truncate text-xs text-muted-foreground">
                                  e.g. &quot;{sample}&quot;
                                </div>
                              )}
                            </div>
                            <Select
                              value={selectedField || "__ignore__"}
                              onValueChange={(value) =>
                                updateSheet(index, {
                                  mapping: {
                                    ...sheet.mapping,
                                    [column]: value === "__ignore__" ? "" : value,
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="w-60">
                                <SelectValue placeholder="-- ignore this column --" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__ignore__">-- ignore this column --</SelectItem>
                                {SYSTEM_FIELDS[sheet.entityType].map((field) => (
                                  <SelectItem key={field} value={field}>
                                    {field}
                                    {required.includes(field) ? " (required)" : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {selectedField && FIELD_DESCRIPTIONS[sheet.entityType]?.[selectedField] && (
                            <p className="pl-0 text-xs text-muted-foreground">
                              {FIELD_DESCRIPTIONS[sheet.entityType][selectedField]}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {sheets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3 · Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {unassignedSheets.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Select a data type for every sheet before importing.
              </p>
            )}
            {unassignedSheets.length === 0 && sheetsWithMissingFields.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Map all required fields (marked &quot;required&quot;) for every sheet before importing.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Sheets are imported in dependency order automatically (classes before
              sections, subjects before curriculum, etc.) so you don&apos;t need to
              reorder anything.
            </p>
            <Button onClick={handleImportAll} disabled={!canImport || importing}>
              {importing ? "Importing..." : "Import all sheets"}
            </Button>
          </CardContent>
        </Card>
      )}

      {status && <p className="text-sm text-muted-foreground">{status}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
