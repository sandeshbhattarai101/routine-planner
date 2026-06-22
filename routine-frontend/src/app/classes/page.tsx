"use client";

import { useEffect, useState } from "react";
import {
  Lookup,
  Classroom,
  ClassAvailability,
  getClassrooms,
  createClassroom,
  updateClassroomTimeRange,
  clearClassroomTimeRange,
  deleteClassroom,
  getSections,
  createSection,
  deleteSection,
  getWorkingDays,
  getPeriods,
  getClassAvailability,
  createClassUnavailability,
  deleteClassAvailability,
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

export default function Page() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [sections, setSections] = useState<(Lookup & { classroom_id: string })[]>([]);
  const [workingDays, setWorkingDays] = useState<Lookup[]>([]);
  const [periods, setPeriods] = useState<(Lookup & { is_break: boolean })[]>([]);
  const [availability, setAvailability] = useState<ClassAvailability[]>([]);

  const [newClassroomName, setNewClassroomName] = useState("");
  const [newClassroomStart, setNewClassroomStart] = useState("");
  const [newClassroomEnd, setNewClassroomEnd] = useState("");
  const [timeRangeEdits, setTimeRangeEdits] = useState<
    Record<string, { start_time: string; end_time: string }>
  >({});
  const [newSection, setNewSection] = useState({ name: "", classroom_id: "" });
  const [error, setError] = useState("");

  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [unavailableDay, setUnavailableDay] = useState("");
  const [unavailablePeriod, setUnavailablePeriod] = useState("");

  async function load() {
    const [c, s, wd, pe, av] = await Promise.all([
      getClassrooms(),
      getSections(),
      getWorkingDays(),
      getPeriods(),
      getClassAvailability(),
    ]);
    setClassrooms(c);
    setSections(s);
    setWorkingDays(wd);
    setPeriods(pe);
    setAvailability(av);
  }

  useEffect(() => {
    load();
  }, []);

  function nameOf(list: Lookup[], id: string) {
    return list.find((item) => item.id === id)?.name || id;
  }

  async function handleCreateClassroom(e: React.FormEvent) {
    e.preventDefault();
    if (!newClassroomName) return;
    await createClassroom(newClassroomName, newClassroomStart, newClassroomEnd);
    setNewClassroomName("");
    setNewClassroomStart("");
    setNewClassroomEnd("");
    await load();
  }

  function getTimeRangeEdit(classroom: Classroom) {
    return (
      timeRangeEdits[classroom.id] || {
        start_time: classroom.start_time || "",
        end_time: classroom.end_time || "",
      }
    );
  }

  async function handleSaveTimeRange(classroom: Classroom) {
    setError("");
    const edit = getTimeRangeEdit(classroom);
    if (!edit.start_time || !edit.end_time) return;
    try {
      await updateClassroomTimeRange(classroom.id, edit.start_time, edit.end_time);
      await load();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Failed to update time range.";
      setError(message);
    }
  }

  async function handleClearTimeRange(classroom: Classroom) {
    await clearClassroomTimeRange(classroom.id);
    setTimeRangeEdits((prev) => {
      const next = { ...prev };
      delete next[classroom.id];
      return next;
    });
    await load();
  }

  async function handleCreateSection() {
    if (!newSection.name || !newSection.classroom_id) return;
    await createSection(newSection.name, newSection.classroom_id);
    setNewSection({ name: "", classroom_id: "" });
    await load();
  }

  async function handleDeleteClassroom(id: string) {
    setError("");
    try {
      await deleteClassroom(id);
      await load();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Failed to delete classroom.";
      setError(message);
    }
  }

  async function handleDeleteSection(id: string) {
    setError("");
    try {
      await deleteSection(id);
      if (selectedSectionId === id) setSelectedSectionId("");
      await load();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Failed to delete section.";
      setError(message);
    }
  }

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  async function handleMarkUnavailable() {
    if (!selectedSection || !unavailableDay || !unavailablePeriod) return;
    await createClassUnavailability(
      selectedSection.classroom_id,
      selectedSection.id,
      unavailableDay,
      unavailablePeriod
    );
    setUnavailableDay("");
    setUnavailablePeriod("");
    await load();
  }

  async function handleRemoveUnavailability(id: string) {
    await deleteClassAvailability(id);
    await load();
  }

  const availabilityForSelected = availability.filter((a) => a.section_id === selectedSectionId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Classes & Sections</h1>
        <p className="text-sm text-muted-foreground">
          Set up the classrooms (e.g. Grade 1) and their sections (e.g. A, B) used
          across the timetable.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Add a classroom</CardTitle>
          <CardDescription>
            Optionally set a daily start and end time for this class (e.g. younger
            grades can finish earlier). Leave blank to use the school&apos;s full
            period grid.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateClassroom} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g. Grade 1"
                value={newClassroomName}
                onChange={(e) => setNewClassroomName(e.target.value)}
                className="w-56"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Day starts</label>
              <Input
                type="time"
                value={newClassroomStart}
                onChange={(e) => setNewClassroomStart(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Day ends</label>
              <Input
                type="time"
                value={newClassroomEnd}
                onChange={(e) => setNewClassroomEnd(e.target.value)}
                className="w-32"
              />
            </div>
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <Select
              value={newSection.classroom_id}
              onValueChange={(v) => setNewSection({ ...newSection, classroom_id: v })}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select classroom" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="e.g. A"
              value={newSection.name}
              onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
              className="w-32"
            />
            <Button onClick={handleCreateSection}>Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All classrooms</CardTitle>
          <CardDescription>
            Set a daily time range per class so the timetable generator only
            schedules that class within its own school day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classrooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classrooms yet.</p>
          ) : (
            <div className="space-y-4">
              {classrooms.map((c) => {
                const edit = getTimeRangeEdit(c);
                return (
                <div key={c.id} className="space-y-2 border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteClassroom(c.id)}>
                      Delete
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Day starts</label>
                      <Input
                        type="time"
                        value={edit.start_time}
                        onChange={(e) =>
                          setTimeRangeEdits((prev) => ({
                            ...prev,
                            [c.id]: { ...edit, start_time: e.target.value },
                          }))
                        }
                        className="w-32"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Day ends</label>
                      <Input
                        type="time"
                        value={edit.end_time}
                        onChange={(e) =>
                          setTimeRangeEdits((prev) => ({
                            ...prev,
                            [c.id]: { ...edit, end_time: e.target.value },
                          }))
                        }
                        className="w-32"
                      />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleSaveTimeRange(c)}>
                      Save time range
                    </Button>
                    {(c.start_time || c.end_time) && (
                      <Button size="sm" variant="ghost" onClick={() => handleClearTimeRange(c)}>
                        Use full school day
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {c.start_time && c.end_time
                        ? `Currently ${c.start_time}–${c.end_time}`
                        : "Currently using the full school day"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {sections.filter((s) => s.classroom_id === c.id).length === 0 ? (
                      "No sections yet."
                    ) : (
                      sections
                        .filter((s) => s.classroom_id === c.id)
                        .map((s) => (
                          <span
                            key={s.id}
                            className="flex items-center gap-1 rounded-md border px-2 py-0.5"
                          >
                            {s.name}
                            <button
                              onClick={() => handleDeleteSection(s.id)}
                              className="text-muted-foreground hover:text-destructive"
                              aria-label={`Delete section ${s.name}`}
                            >
                              ×
                            </button>
                          </span>
                        ))
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Section availability</CardTitle>
          <CardDescription>
            Mark periods a section can&apos;t be scheduled in (e.g. assembly, sports
            block).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedSectionId || undefined} onValueChange={setSelectedSectionId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="-- select a section --" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {nameOf(classrooms, s.classroom_id)} - {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSectionId && (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
