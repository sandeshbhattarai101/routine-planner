"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Lookup,
  TimetableSummary,
  TimetableEntry,
  getAcademicYears,
  getWorkingDays,
  createWorkingDay,
  getPeriods,
  createPeriod,
  getClassrooms,
  getSections,
  getSubjects,
  getTeachers,
  getTimetables,
  createTimetable,
  getTimetableEntries,
  createTimetableEntry,
  deleteTimetableEntry,
  generateTimetable,
} from "@/services/timetable_service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function Page() {
  const [academicYears, setAcademicYears] = useState<Lookup[]>([]);
  const [workingDays, setWorkingDays] = useState<Lookup[]>([]);
  const [periods, setPeriods] = useState<(Lookup & { is_break: boolean })[]>(
    []
  );
  const [classrooms, setClassrooms] = useState<Lookup[]>([]);
  const [sections, setSections] = useState<
    (Lookup & { classroom_id: string })[]
  >([]);
  const [subjects, setSubjects] = useState<Lookup[]>([]);
  const [teachers, setTeachers] = useState<Lookup[]>([]);

  const [timetables, setTimetables] = useState<TimetableSummary[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>("");
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  const [newYearName, setNewYearName] = useState("");
  const [newDayName, setNewDayName] = useState("");
  const [newPeriod, setNewPeriod] = useState({
    name: "",
    start_time: "",
    end_time: "",
  });
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState("");

  const [form, setForm] = useState({
    working_day_id: "",
    period_id: "",
    classroom_id: "",
    section_id: "",
    teacher_id: "",
    subject_id: "",
  });

  async function loadLookups() {
    const [ay, wd, pe, cl, se, su, te, tt] = await Promise.all([
      getAcademicYears(),
      getWorkingDays(),
      getPeriods(),
      getClassrooms(),
      getSections(),
      getSubjects(),
      getTeachers(),
      getTimetables(),
    ]);
    setAcademicYears(ay);
    setWorkingDays(wd);
    setPeriods(pe);
    setClassrooms(cl);
    setSections(se);
    setSubjects(su);
    setTeachers(te);
    setTimetables(tt);
  }

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    if (selectedTimetableId) {
      getTimetableEntries(selectedTimetableId).then(setEntries);
    } else {
      setEntries([]);
    }
  }, [selectedTimetableId]);

  async function handleCreateAcademicYear() {
    if (!newYearName) return;
    await api.post("/academic-years", { name: newYearName });
    setNewYearName("");
    loadLookups();
  }

  async function handleCreateTimetable() {
    if (academicYears.length === 0) return;
    const timetable = await createTimetable(academicYears[0].id);
    setTimetables([...timetables, timetable]);
    setSelectedTimetableId(timetable.id);
  }

  async function handleCreateWorkingDay() {
    if (!newDayName) return;
    await createWorkingDay(newDayName);
    setNewDayName("");
    loadLookups();
  }

  async function handleCreatePeriod() {
    if (!newPeriod.name || !newPeriod.start_time || !newPeriod.end_time) return;
    await createPeriod(
      newPeriod.name,
      newPeriod.start_time,
      newPeriod.end_time,
      false
    );
    setNewPeriod({ name: "", start_time: "", end_time: "" });
    loadLookups();
  }

  async function handleGenerate() {
    if (academicYears.length === 0) return;
    setGenerating(true);
    setGenerateMessage("");
    try {
      const result = await generateTimetable(academicYears[0].id);
      setGenerateMessage(`Generated ${result.entries_saved} entries.`);
      loadLookups();
      setSelectedTimetableId(result.timetable_id);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Generation failed.";
      setGenerateMessage(message);
    } finally {
      setGenerating(false);
    }
  }

  function nameOf(list: Lookup[], id: string) {
    return list.find((item) => item.id === id)?.name || id;
  }

  async function handleAddEntry() {
    setError("");
    if (!selectedTimetableId) {
      setError("Select or create a timetable first.");
      return;
    }
    if (Object.values(form).some((v) => !v)) {
      setError("All fields are required.");
      return;
    }

    try {
      const entry = await createTimetableEntry(selectedTimetableId, form);
      setEntries([...entries, entry]);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Failed to add entry.";
      setError(message);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    await deleteTimetableEntry(entryId);
    setEntries(entries.filter((e) => e.id !== entryId));
  }

  const setupNeeded =
    academicYears.length === 0 || workingDays.length === 0 || periods.length === 0;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Timetable</h1>
        <p className="text-sm text-muted-foreground">
          Set up academic years, working days and periods, then build your timetable
          manually or auto-generate it.
        </p>
      </div>

      {setupNeeded && (
        <Card>
          <CardHeader>
            <CardTitle>Setup</CardTitle>
            <CardDescription>
              These need to exist before you can build a timetable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {academicYears.length === 0 && (
              <div className="flex items-end gap-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Academic year</label>
                  <Input
                    placeholder="e.g. 2026"
                    value={newYearName}
                    onChange={(e) => setNewYearName(e.target.value)}
                    className="w-48"
                  />
                </div>
                <Button onClick={handleCreateAcademicYear}>Add</Button>
              </div>
            )}

            {workingDays.length === 0 && (
              <div className="flex items-end gap-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Working day</label>
                  <Input
                    placeholder="e.g. Monday"
                    value={newDayName}
                    onChange={(e) => setNewDayName(e.target.value)}
                    className="w-48"
                  />
                </div>
                <Button onClick={handleCreateWorkingDay}>Add</Button>
              </div>
            )}

            {periods.length === 0 && (
              <div className="flex items-end gap-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Period name</label>
                  <Input
                    placeholder="e.g. Period 1"
                    value={newPeriod.name}
                    onChange={(e) =>
                      setNewPeriod({ ...newPeriod, name: e.target.value })
                    }
                    className="w-40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Start</label>
                  <Input
                    type="time"
                    value={newPeriod.start_time}
                    onChange={(e) =>
                      setNewPeriod({ ...newPeriod, start_time: e.target.value })
                    }
                    className="w-32"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">End</label>
                  <Input
                    type="time"
                    value={newPeriod.end_time}
                    onChange={(e) =>
                      setNewPeriod({ ...newPeriod, end_time: e.target.value })
                    }
                    className="w-32"
                  />
                </div>
                <Button onClick={handleCreatePeriod}>Add</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Timetable</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Active timetable</label>
            <Select
              value={selectedTimetableId || undefined}
              onValueChange={setSelectedTimetableId}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="-- select --" />
              </SelectTrigger>
              <SelectContent>
                {timetables.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={handleCreateTimetable}
            disabled={academicYears.length === 0}
          >
            + New timetable
          </Button>

          <Button
            variant="secondary"
            onClick={handleGenerate}
            disabled={generating || academicYears.length === 0}
          >
            {generating ? "Generating..." : "Auto-generate timetable"}
          </Button>

          {generateMessage && (
            <span className="text-sm text-muted-foreground">{generateMessage}</span>
          )}
        </CardContent>
      </Card>

      {selectedTimetableId && (
        <Card>
          <CardHeader>
            <CardTitle>Add entry</CardTitle>
            <CardDescription>
              Conflicts (same teacher/section/period), break periods, and daily load
              limits are rejected automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Select
                value={form.working_day_id || undefined}
                onValueChange={(v) => setForm({ ...form, working_day_id: v })}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {workingDays.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={form.period_id || undefined}
                onValueChange={(v) => setForm({ ...form, period_id: v })}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  {periods
                    .filter((p) => !p.is_break)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select
                value={form.classroom_id || undefined}
                onValueChange={(v) => setForm({ ...form, classroom_id: v })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Classroom" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={form.section_id || undefined}
                onValueChange={(v) => setForm({ ...form, section_id: v })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  {sections
                    .filter(
                      (s) =>
                        !form.classroom_id || s.classroom_id === form.classroom_id
                    )
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select
                value={form.subject_id || undefined}
                onValueChange={(v) => setForm({ ...form, subject_id: v })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={form.teacher_id || undefined}
                onValueChange={(v) => setForm({ ...form, teacher_id: v })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleAddEntry}>Add</Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No entries yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Classroom</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{nameOf(workingDays, entry.working_day_id)}</TableCell>
                      <TableCell>{nameOf(periods, entry.period_id)}</TableCell>
                      <TableCell>{nameOf(classrooms, entry.classroom_id)}</TableCell>
                      <TableCell>{nameOf(sections, entry.section_id)}</TableCell>
                      <TableCell>{nameOf(subjects, entry.subject_id)}</TableCell>
                      <TableCell>{nameOf(teachers, entry.teacher_id)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
