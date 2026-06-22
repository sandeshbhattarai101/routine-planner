"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Lookup,
  Teacher,
  ClassSubject,
  TeacherSubject,
  getClassrooms,
  getSections,
  getSubjects,
  getTeachers,
  getTeacherSubjects,
  getClassSubjects,
  createClassSubject,
  deleteClassSubject,
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
  const [classrooms, setClassrooms] = useState<Lookup[]>([]);
  const [sections, setSections] = useState<(Lookup & { classroom_id: string })[]>([]);
  const [subjects, setSubjects] = useState<Lookup[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);

  const [classroomId, setClassroomId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [row, setRow] = useState({
    subject_id: "",
    teacher_id: "",
    periods_per_week: "",
    days_per_week: "",
  });
  const [error, setError] = useState("");

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

  const load = useCallback(async () => {
    setError("");
    try {
      const [c, s, su, te, ts, cs] = await Promise.all([
        getClassrooms(),
        getSections(),
        getSubjects(),
        getTeachers(),
        getTeacherSubjects(),
        getClassSubjects(),
      ]);
      setClassrooms(c);
      setSections(s);
      setSubjects(su);
      setTeachers(te);
      setTeacherSubjects(ts);
      setClassSubjects(cs);
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to load curriculum data."));
    }
  }, []);

  useEffect(() => {
    // Fetching from the backend on mount synchronizes with an external
    // system (not deriving state from props/state), which is the
    // documented exception to this rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function nameOf(list: Lookup[], id: string | null) {
    if (!id) return "—";
    return list.find((item) => item.id === id)?.name || id;
  }

  // Teachers qualified to teach the selected subject (via Teachers page assignment),
  // falling back to all teachers if none have been explicitly assigned yet.
  const qualifiedTeacherIds = new Set(
    teacherSubjects.filter((ts) => ts.subject_id === row.subject_id).map((ts) => ts.teacher_id)
  );
  const teacherOptions =
    row.subject_id && qualifiedTeacherIds.size > 0
      ? teachers.filter((t) => qualifiedTeacherIds.has(t.id))
      : teachers;

  const sectionsForClassroom = sections.filter(
    (s) => !classroomId || s.classroom_id === classroomId
  );

  const requirementsForClass = classSubjects.filter(
    (cs) => cs.classroom_id === classroomId && cs.section_id === sectionId
  );

  // Resolve the teacher who'll actually teach this requirement: the
  // explicitly assigned one, or — same fallback auto-generation uses —
  // the first teacher assigned to that subject on the Teachers page.
  function resolveTeacher(cs: ClassSubject): { name: string; isExplicit: boolean } {
    if (cs.teacher_id) {
      return { name: nameOf(teachers, cs.teacher_id), isExplicit: true };
    }
    const fallback = teacherSubjects.find((ts) => ts.subject_id === cs.subject_id);
    if (fallback) {
      return { name: nameOf(teachers, fallback.teacher_id), isExplicit: false };
    }
    return { name: "No teacher assigned", isExplicit: false };
  }

  const classesWithCurriculum = sections
    .filter((s) => classSubjects.some((cs) => cs.section_id === s.id))
    .map((s) => ({
      section: s,
      requirements: classSubjects.filter(
        (cs) => cs.classroom_id === s.classroom_id && cs.section_id === s.id
      ),
    }));

  async function handleAddRow() {
    setError("");
    if (!classroomId || !sectionId) {
      setError("Select a classroom and section first.");
      return;
    }
    if (!row.subject_id || !row.periods_per_week) {
      setError("Subject and periods/week are required.");
      return;
    }
    if (row.days_per_week && Number(row.days_per_week) > Number(row.periods_per_week)) {
      setError("Days/week can't be more than periods/week.");
      return;
    }

    try {
      await createClassSubject(
        classroomId,
        sectionId,
        row.subject_id,
        Number(row.periods_per_week),
        row.teacher_id || undefined,
        row.days_per_week ? Number(row.days_per_week) : undefined
      );
      setRow({ subject_id: "", teacher_id: "", periods_per_week: "", days_per_week: "" });
      await load();
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to add requirement."));
    }
  }

  async function handleDelete(id: string) {
    setError("");
    try {
      await deleteClassSubject(id);
      await load();
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to remove requirement."));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Curriculum</h1>
        <p className="text-sm text-muted-foreground">
          Define how many periods per week each section needs of each subject, and
          which teacher teaches it. This drives auto-generation.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Class</CardTitle>
          <CardDescription>
            Pick the classroom and section once, then add as many subject
            requirements as you need for it below.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <Select
            value={classroomId}
            onValueChange={(v) => {
              setClassroomId(v);
              setSectionId("");
            }}
          >
            <SelectTrigger className="w-44">
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

          <Select value={sectionId} onValueChange={setSectionId}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {sectionsForClassroom.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {classroomId && sectionId && (
        <Card>
          <CardHeader>
            <CardTitle>
              Subject requirements — {nameOf(classrooms, classroomId)} /{" "}
              {nameOf(sections, sectionId)}
            </CardTitle>
            <CardDescription>
              Leaving teacher blank falls back to any teacher assigned to that
              subject during auto-generation. Leave days/week blank for
              subjects taught throughout the week; set it for subjects taught
              only on some days (e.g. 6 periods over 3 days/week).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Periods/week</TableHead>
                  <TableHead>Days/week</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Select
                      value={row.subject_id}
                      onValueChange={(v) => setRow({ ...row, subject_id: v, teacher_id: "" })}
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
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.teacher_id}
                      onValueChange={(v) => setRow({ ...row, teacher_id: v })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Teacher (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherOptions.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Periods/week"
                      value={row.periods_per_week}
                      onChange={(e) => setRow({ ...row, periods_per_week: e.target.value })}
                      className="w-28"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Every day"
                      value={row.days_per_week}
                      onChange={(e) => setRow({ ...row, days_per_week: e.target.value })}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" onClick={handleAddRow}>
                      Add
                    </Button>
                  </TableCell>
                </TableRow>
                {requirementsForClass.map((cs) => (
                  <TableRow key={cs.id}>
                    <TableCell>{nameOf(subjects, cs.subject_id)}</TableCell>
                    <TableCell>{nameOf(teachers, cs.teacher_id)}</TableCell>
                    <TableCell>{cs.periods_per_week}</TableCell>
                    <TableCell>{cs.days_per_week ?? "Every day"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(cs.id)}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Teachers by class</CardTitle>
          <CardDescription>
            Every class and section, with the teacher who teaches each
            subject. Teachers shown in italics were auto-assigned (no
            specific teacher was set on the requirement above) and will be
            picked the same way during auto-generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {classesWithCurriculum.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No curriculum requirements yet. Add subjects to a class above.
            </p>
          ) : (
            classesWithCurriculum.map(({ section, requirements }) => (
              <div key={section.id} className="space-y-1">
                <h3 className="text-sm font-semibold">
                  {nameOf(classrooms, section.classroom_id)} / {section.name}
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requirements.map((cs) => {
                      const teacher = resolveTeacher(cs);
                      return (
                        <TableRow key={cs.id}>
                          <TableCell>{nameOf(subjects, cs.subject_id)}</TableCell>
                          <TableCell className={teacher.isExplicit ? "" : "italic text-muted-foreground"}>
                            {teacher.name}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
