"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Lookup,
  Period,
  TimetableSummary,
  TimetableEntry,
  getAcademicYears,
  getWorkingDays,
  createWorkingDay,
  deleteWorkingDay,
  getPeriods,
  createPeriod,
  updatePeriodBreak,
  deletePeriod,
  getClassrooms,
  getSections,
  getSubjects,
  getTeachers,
  getTimetables,
  createTimetable,
  deleteTimetable,
  renameTimetable,
  getTimetableEntries,
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
import { Badge } from "@/components/ui/badge";
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
  const [periods, setPeriods] = useState<Period[]>([]);
  const [classrooms, setClassrooms] = useState<Lookup[]>([]);
  const [sections, setSections] = useState<
    (Lookup & { classroom_id: string })[]
  >([]);
  const [subjects, setSubjects] = useState<Lookup[]>([]);
  const [teachers, setTeachers] = useState<Lookup[]>([]);

  const [timetables, setTimetables] = useState<TimetableSummary[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>("");
  const [renamingTimetableId, setRenamingTimetableId] = useState<string>("");
  const [renameDraft, setRenameDraft] = useState<string>("");
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  const [newYearName, setNewYearName] = useState("");
  const [newDayName, setNewDayName] = useState("");
  const [newPeriod, setNewPeriod] = useState({
    name: "",
    start_time: "",
    end_time: "",
    is_break: false,
  });
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [generateWarnings, setGenerateWarnings] = useState<string[]>([]);

  function errorMessage(err: unknown, fallback: string): string {
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof (err as { response?: { data?: { detail?: string } } }).response
        ?.data?.detail === "string"
    ) {
      return (err as { response: { data: { detail: string } } }).response.data
        .detail;
    }
    return fallback;
  }

  async function loadLookups() {
    setError("");
    try {
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
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to load timetable setup data."));
    }
  }

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    if (!selectedTimetableId) {
      setEntries([]);
      return;
    }
    getTimetableEntries(selectedTimetableId)
      .then(setEntries)
      .catch((err: unknown) => {
        setError(errorMessage(err, "Failed to load timetable entries."));
      });
  }, [selectedTimetableId]);

  async function handleCreateAcademicYear() {
    if (!newYearName) return;
    setError("");
    try {
      await api.post("/academic-years", { name: newYearName });
      setNewYearName("");
      await loadLookups();
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to add academic year."));
    }
  }

  async function handleCreateTimetable() {
    if (academicYears.length === 0) return;
    setError("");
    try {
      const timetable = await createTimetable(academicYears[0].id);
      setTimetables([...timetables, timetable]);
      setSelectedTimetableId(timetable.id);
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to create timetable."));
    }
  }

  async function handleDeleteTimetable(timetableId: string) {
    setError("");
    try {
      await deleteTimetable(timetableId);
      setTimetables((prev) => prev.filter((t) => t.id !== timetableId));
      if (selectedTimetableId === timetableId) {
        setSelectedTimetableId("");
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to delete timetable."));
    }
  }

  function handleStartRename(timetableId: string, currentName: string) {
    setRenamingTimetableId(timetableId);
    setRenameDraft(currentName);
  }

  function handleCancelRename() {
    setRenamingTimetableId("");
    setRenameDraft("");
  }

  async function handleSaveRename(timetableId: string) {
    if (!renameDraft.trim()) return;
    setError("");
    try {
      const updated = await renameTimetable(timetableId, renameDraft.trim());
      setTimetables((prev) =>
        prev.map((t) => (t.id === timetableId ? updated : t))
      );
      setRenamingTimetableId("");
      setRenameDraft("");
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to rename timetable."));
    }
  }

  async function handleCreateWorkingDay() {
    if (!newDayName) return;
    setError("");
    try {
      await createWorkingDay(newDayName);
      setNewDayName("");
      await loadLookups();
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to add working day."));
    }
  }

  async function handleCreatePeriod() {
    if (!newPeriod.name || !newPeriod.start_time || !newPeriod.end_time) return;
    setError("");
    try {
      await createPeriod(
        newPeriod.name,
        newPeriod.start_time,
        newPeriod.end_time,
        newPeriod.is_break
      );
      setNewPeriod({ name: "", start_time: "", end_time: "", is_break: false });
      await loadLookups();
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to add period."));
    }
  }

  async function handleToggleBreak(periodId: string, isBreak: boolean) {
    setError("");
    try {
      await updatePeriodBreak(periodId, isBreak);
      await loadLookups();
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to update period."));
    }
  }

  async function handleDeletePeriod(periodId: string) {
    setError("");
    try {
      await deletePeriod(periodId);
      await loadLookups();
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to delete period."));
    }
  }

  async function handleDeleteWorkingDay(dayId: string) {
    setError("");
    try {
      await deleteWorkingDay(dayId);
      await loadLookups();
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to delete working day."));
    }
  }

  async function handleGenerate() {
    if (academicYears.length === 0) return;
    setGenerating(true);
    setGenerateMessage("");
    setGenerateError("");
    setGenerateWarnings([]);
    try {
      const result = await generateTimetable(academicYears[0].id);
      setGenerateMessage(`Generated ${result.entries_saved} entries.`);
      setGenerateWarnings(result.warnings || []);
      await loadLookups();
      setSelectedTimetableId(result.timetable_id);
    } catch (err: unknown) {
      setGenerateError(errorMessage(err, "Generation failed."));
    } finally {
      setGenerating(false);
    }
  }

  function nameOf(list: Lookup[], id: string | undefined) {
    if (!id) return "—";
    return list.find((item) => item.id === id)?.name || "—";
  }

  function formatTime(time: string) {
    return time?.slice(0, 5) ?? "";
  }

  const sectionsWithEntries = sections.filter((s) =>
    entries.some((e) => e.section_id === s.id)
  );

  const sortedPeriods = periods
    .slice()
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // One cell (class/section x period) can hold more than one subject across
  // the week when a subject runs only some days/week and shares the slot
  // with another subject on the remaining days — group by subject+teacher
  // and list which days each group covers.
  function cellGroups(periodId: string, classroomId: string, sectionId: string) {
    const matching = entries.filter(
      (e) =>
        e.period_id === periodId &&
        e.classroom_id === classroomId &&
        e.section_id === sectionId
    );

    const groups = new Map<
      string,
      { subjectId: string; teacherId: string; dayIds: string[] }
    >();

    for (const e of matching) {
      const key = `${e.subject_id}__${e.teacher_id}`;
      const existing = groups.get(key);
      if (existing) {
        existing.dayIds.push(e.working_day_id);
      } else {
        groups.set(key, {
          subjectId: e.subject_id,
          teacherId: e.teacher_id,
          dayIds: [e.working_day_id],
        });
      }
    }

    return Array.from(groups.values());
  }

  function dayLabel(dayIds: string[]) {
    return workingDays
      .filter((d) => dayIds.includes(d.id))
      .map((d) => d.name.slice(0, 3))
      .join(", ");
  }

  const setupIncomplete =
    academicYears.length === 0 ||
    workingDays.length === 0 ||
    periods.filter((p) => !p.is_break).length === 0;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Timetable</h1>
        <p className="text-sm text-muted-foreground">
          Timetables are auto-generated from your curriculum, teacher
          assignments, and availability — no manual entry needed. The
          generator automatically avoids teacher/class clashes, skips breaks,
          and respects daily load limits and each subject&apos;s days/week
          setting.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Schedule setup</CardTitle>
          <CardDescription>
            Academic year, working days and periods apply to the whole school
            timetable. Mark lunch/recess periods as a break below so the
            generator skips them automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Academic year</label>
            <div className="flex flex-wrap items-end gap-2">
              <Input
                placeholder="e.g. 2026"
                value={newYearName}
                onChange={(e) => setNewYearName(e.target.value)}
                className="w-48"
              />
              <Button onClick={handleCreateAcademicYear}>Add</Button>
            </div>
            {academicYears.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {academicYears.map((y) => (
                  <Badge key={y.id} variant="outline">
                    {y.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t pt-4">
            <label className="text-sm font-medium">Working days</label>
            <p className="text-xs text-muted-foreground">
              Days the school runs classes, e.g. Monday through Friday.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <Input
                placeholder="e.g. Monday"
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                className="w-48"
              />
              <Button onClick={handleCreateWorkingDay}>Add</Button>
            </div>
            {workingDays.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {workingDays.map((d) => (
                  <span
                    key={d.id}
                    className="flex items-center gap-1 rounded-md border px-2 py-0.5 text-sm"
                  >
                    {d.name}
                    <button
                      onClick={() => handleDeleteWorkingDay(d.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${d.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t pt-4">
            <label className="text-sm font-medium">Periods &amp; breaktimes</label>
            <p className="text-xs text-muted-foreground">
              Define every slot in the school day, in order, including lunch or
              recess. Tick &quot;This is a break&quot; for non-teaching slots —
              the generator will never schedule a subject there, for any class.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Name</label>
                <Input
                  placeholder="e.g. Period 1 or Lunch"
                  value={newPeriod.name}
                  onChange={(e) =>
                    setNewPeriod({ ...newPeriod, name: e.target.value })
                  }
                  className="w-40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Start</label>
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
                <label className="text-xs text-muted-foreground">End</label>
                <Input
                  type="time"
                  value={newPeriod.end_time}
                  onChange={(e) =>
                    setNewPeriod({ ...newPeriod, end_time: e.target.value })
                  }
                  className="w-32"
                />
              </div>
              <label className="flex items-center gap-1.5 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={newPeriod.is_break}
                  onChange={(e) =>
                    setNewPeriod({ ...newPeriod, is_break: e.target.checked })
                  }
                />
                This is a break
              </label>
              <Button onClick={handleCreatePeriod}>Add</Button>
            </div>

            {periods.length > 0 && (
              <div className="space-y-1 pt-2">
                {periods
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-md border px-3 py-1.5 text-sm"
                    >
                      <span className="min-w-32 font-medium">{p.name}</span>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={p.is_break}
                          onChange={(e) => handleToggleBreak(p.id, e.target.checked)}
                        />
                        Break
                      </label>
                      {p.is_break && <Badge variant="secondary">Break</Badge>}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={() => handleDeletePeriod(p.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {setupIncomplete && (
            <p className="text-sm text-amber-600">
              Add at least one academic year, one working day, and one
              non-break period before generating a timetable.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle>Auto-generate timetable</CardTitle>
          <CardDescription>
            One click builds a conflict-free timetable from your curriculum
            (Curriculum page) and teacher assignments. It automatically
            resolves teacher/class clashes, respects daily load limits and
            breaks, and spreads each subject across the number of days/week
            you set for it — so subjects taught every day and subjects taught
            only a few days a week are both scheduled correctly.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Active timetable</label>
            <Select
              value={selectedTimetableId}
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

          {selectedTimetableId && (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDeleteTimetable(selectedTimetableId)}
            >
              Delete this timetable
            </Button>
          )}

          <Button
            onClick={handleGenerate}
            disabled={generating || setupIncomplete}
          >
            {generating ? "Generating..." : "Auto-generate timetable"}
          </Button>

          {generateMessage && (
            <span className="text-sm text-muted-foreground">{generateMessage}</span>
          )}
          {generateError && (
            <span className="text-sm text-destructive">{generateError}</span>
          )}
        </CardContent>

        {timetables.length > 0 && (
          <CardContent className="border-t pt-4">
            <p className="text-sm font-medium">All timetables</p>
            <p className="text-xs text-muted-foreground">
              Clean up old drafts you no longer need — this deletes the
              timetable and every entry in it.
            </p>
            <ul className="mt-2 space-y-1">
              {timetables.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm"
                >
                  {renamingTimetableId === t.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(t.id);
                          if (e.key === "Escape") handleCancelRename();
                        }}
                        autoFocus
                        className="h-8"
                      />
                      <Button size="sm" onClick={() => handleSaveRename(t.id)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelRename}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span>
                        {t.name} ({t.status})
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartRename(t.id, t.name)}
                        >
                          Rename
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteTimetable(t.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        )}
        {generateWarnings.length > 0 && (
          <CardContent className="border-t pt-4">
            <p className="text-sm font-medium text-amber-600">
              {generateWarnings.length} subject(s) were skipped:
            </p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-amber-600">
              {generateWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      {selectedTimetableId && (
        <Card>
          <CardHeader>
            <CardTitle>Generated timetable — every class</CardTitle>
            <CardDescription>
              One table for every classroom and section. Each row is a
              class/section; each column is a period, labeled with its time
              range. When a subject runs only some days of the week, its
              cell lists each subject/teacher together with the days it
              applies to. To change what gets scheduled, edit the
              curriculum, teacher assignments, or availability and
              re-generate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            {sectionsWithEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No entries yet for this timetable. Generate one above.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class / Section</TableHead>
                      {sortedPeriods.map((p) => (
                        <TableHead key={p.id}>
                          <div className="flex flex-col">
                            <span>{p.name}</span>
                            <span className="text-xs font-normal text-muted-foreground">
                              {formatTime(p.start_time)}–{formatTime(p.end_time)}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectionsWithEntries.map((section) => (
                      <TableRow key={section.id}>
                        <TableCell className="font-medium">
                          {nameOf(classrooms, section.classroom_id)} / {section.name}
                        </TableCell>
                        {sortedPeriods.map((period) => {
                          const groups = cellGroups(
                            period.id,
                            section.classroom_id,
                            section.id
                          );
                          return (
                            <TableCell key={period.id}>
                              {groups.length === 0 ? (
                                <span className="text-xs text-muted-foreground">—</span>
                              ) : (
                                <div className="flex min-w-36 flex-col gap-1.5">
                                  {groups.map((g, i) => {
                                    const partialWeek =
                                      groups.length > 1 ||
                                      g.dayIds.length < workingDays.length;
                                    return (
                                      <div key={i}>
                                        <div className="font-medium">
                                          {nameOf(subjects, g.subjectId)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {nameOf(teachers, g.teacherId)}
                                          {partialWeek && (
                                            <> ({dayLabel(g.dayIds)})</>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
