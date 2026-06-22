"use client";

import { useEffect, useState } from "react";
import {
  Teacher,
  Lookup,
  TeacherSubject,
  TeacherAvailability,
  getTeachers,
  createTeacher,
  updateTeacher,
  activateTeacher,
  deactivateTeacher,
  deleteTeacher,
  getSubjects,
  getTeacherSubjects,
  createTeacherSubject,
  deleteTeacherSubject,
  getWorkingDays,
  getPeriods,
  getTeacherAvailability,
  createTeacherUnavailability,
  deleteTeacherAvailability,
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
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Lookup[]>([]);
  const [workingDays, setWorkingDays] = useState<Lookup[]>([]);
  const [periods, setPeriods] = useState<(Lookup & { is_break: boolean })[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
  const [availability, setAvailability] = useState<TeacherAvailability[]>([]);

  const [newTeacher, setNewTeacher] = useState({ name: "", max_periods_per_day: "5" });
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<
    Record<string, { name: string; max_periods_per_day: string }>
  >({});

  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [assignSubjectId, setAssignSubjectId] = useState("");
  const [unavailableDay, setUnavailableDay] = useState("");
  const [unavailablePeriod, setUnavailablePeriod] = useState("");

  async function load() {
    const [t, s, wd, pe, ts, av] = await Promise.all([
      getTeachers(),
      getSubjects(),
      getWorkingDays(),
      getPeriods(),
      getTeacherSubjects(),
      getTeacherAvailability(),
    ]);
    setTeachers(t);
    setSubjects(s);
    setWorkingDays(wd);
    setPeriods(pe);
    setTeacherSubjects(ts);
    setAvailability(av);
    setDrafts(
      Object.fromEntries(
        t.map((teacher) => [
          teacher.id,
          {
            name: teacher.name,
            max_periods_per_day: String(teacher.max_periods_per_day),
          },
        ])
      )
    );
  }

  useEffect(() => {
    load();
  }, []);

  function nameOf(list: Lookup[], id: string) {
    return list.find((item) => item.id === id)?.name || id;
  }

  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newTeacher.name) return;

    try {
      await createTeacher(newTeacher.name, Number(newTeacher.max_periods_per_day) || 5);
      setNewTeacher({ name: "", max_periods_per_day: "5" });
      await load();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Failed to create teacher.";
      setError(message);
    }
  }

  function handleDraftChange(
    teacherId: string,
    field: "name" | "max_periods_per_day",
    value: string
  ) {
    setDrafts((prev) => ({
      ...prev,
      [teacherId]: { ...prev[teacherId], [field]: value },
    }));
  }

  async function handleSaveTeacher(teacher: Teacher) {
    setError("");
    const draft = drafts[teacher.id];
    if (!draft) return;

    const trimmedName = draft.name.trim();
    const maxPeriods = Number(draft.max_periods_per_day);

    if (!trimmedName) {
      setError("Teacher name can't be empty.");
      handleDraftChange(teacher.id, "name", teacher.name);
      return;
    }
    if (!maxPeriods || maxPeriods < 1) {
      setError("Max periods/day must be at least 1.");
      handleDraftChange(teacher.id, "max_periods_per_day", String(teacher.max_periods_per_day));
      return;
    }
    if (trimmedName === teacher.name && maxPeriods === teacher.max_periods_per_day) {
      return;
    }

    try {
      const updated = await updateTeacher(teacher.id, {
        name: trimmedName,
        max_periods_per_day: maxPeriods,
      });
      setTeachers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Failed to update teacher.";
      setError(message);
      await load();
    }
  }

  async function handleToggleActive(teacher: Teacher) {
    if (teacher.is_active) {
      await deactivateTeacher(teacher.id);
    } else {
      await activateTeacher(teacher.id);
    }
    await load();
  }

  async function handleDeleteTeacher(id: string) {
    setError("");
    try {
      await deleteTeacher(id);
      if (selectedTeacherId === id) setSelectedTeacherId("");
      await load();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Failed to delete teacher.";
      setError(message);
    }
  }

  async function handleAssignSubject() {
    if (!selectedTeacherId || !assignSubjectId) return;
    await createTeacherSubject(selectedTeacherId, assignSubjectId);
    setAssignSubjectId("");
    await load();
  }

  async function handleRemoveAssignment(id: string) {
    await deleteTeacherSubject(id);
    await load();
  }

  async function handleMarkUnavailable() {
    if (!selectedTeacherId || !unavailableDay || !unavailablePeriod) return;
    await createTeacherUnavailability(selectedTeacherId, unavailableDay, unavailablePeriod);
    setUnavailableDay("");
    setUnavailablePeriod("");
    await load();
  }

  async function handleRemoveUnavailability(id: string) {
    await deleteTeacherAvailability(id);
    await load();
  }

  const teacherSubjectsForSelected = teacherSubjects.filter(
    (ts) => ts.teacher_id === selectedTeacherId
  );
  const availabilityForSelected = availability.filter(
    (a) => a.teacher_id === selectedTeacherId
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Teachers</h1>
        <p className="text-sm text-muted-foreground">
          Add teachers manually, or import them in bulk on the Upload Excel page.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Add a teacher</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTeacher} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Teacher name"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                className="w-56"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Max periods/day</label>
              <Input
                type="number"
                min={1}
                value={newTeacher.max_periods_per_day}
                onChange={(e) =>
                  setNewTeacher({ ...newTeacher, max_periods_per_day: e.target.value })
                }
                className="w-28"
              />
            </div>
            <Button type="submit">Add teacher</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All teachers</CardTitle>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teachers yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Max periods/day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Input
                        value={drafts[t.id]?.name ?? t.name}
                        onChange={(e) => handleDraftChange(t.id, "name", e.target.value)}
                        onBlur={() => handleSaveTeacher(t)}
                        className="w-44"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={drafts[t.id]?.max_periods_per_day ?? String(t.max_periods_per_day)}
                        onChange={(e) =>
                          handleDraftChange(t.id, "max_periods_per_day", e.target.value)
                        }
                        onBlur={() => handleSaveTeacher(t)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <span className={t.is_active ? "text-emerald-600" : "text-muted-foreground"}>
                        {t.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant={t.is_active ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => handleToggleActive(t)}
                      >
                        {t.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTeacher(t.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subjects & availability</CardTitle>
          <CardDescription>
            Select a teacher to assign the subjects they teach and mark periods they
            are unavailable for.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Select value={selectedTeacherId || undefined} onValueChange={setSelectedTeacherId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="-- select a teacher --" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTeacherId && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Subjects taught</h3>
                <div className="flex items-end gap-2">
                  <Select value={assignSubjectId || undefined} onValueChange={setAssignSubjectId}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssignSubject}>Assign</Button>
                </div>

                {teacherSubjectsForSelected.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No subjects assigned yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {teacherSubjectsForSelected.map((ts) => (
                      <li key={ts.id} className="flex items-center gap-2 text-sm">
                        {nameOf(subjects, ts.subject_id)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAssignment(ts.id)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Unavailable periods</h3>
                <div className="flex items-end gap-2">
                  <Select value={unavailableDay || undefined} onValueChange={setUnavailableDay}>
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

                  <Select value={unavailablePeriod || undefined} onValueChange={setUnavailablePeriod}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={handleMarkUnavailable}>Mark unavailable</Button>
                </div>

                {availabilityForSelected.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No unavailable periods set.</p>
                ) : (
                  <ul className="space-y-1">
                    {availabilityForSelected.map((a) => (
                      <li key={a.id} className="flex items-center gap-2 text-sm">
                        {nameOf(workingDays, a.working_day_id)} - {nameOf(periods, a.period_id)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUnavailability(a.id)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
