import api from "@/lib/api";

export interface Lookup {
  id: string;
  name: string;
}

export interface TimetableSummary {
  id: string;
  academic_year_id: string;
  name: string;
  status: string;
}

export interface TimetableEntry {
  id: string;
  timetable_id: string;
  working_day_id: string;
  period_id: string;
  classroom_id: string;
  section_id: string;
  teacher_id: string;
  subject_id: string;
}

export async function getAcademicYears(): Promise<Lookup[]> {
  const response = await api.get("/academic-years");
  return response.data;
}

export async function getWorkingDays(): Promise<Lookup[]> {
  const response = await api.get("/working-days");
  return response.data;
}

export async function createWorkingDay(name: string): Promise<Lookup> {
  const response = await api.post("/working-days", { name });
  return response.data;
}

export async function deleteWorkingDay(id: string): Promise<void> {
  await api.delete(`/working-days/${id}`);
}

export interface Period extends Lookup {
  is_break: boolean;
  start_time: string;
  end_time: string;
}

export async function getPeriods(): Promise<Period[]> {
  const response = await api.get("/periods");
  return response.data;
}

export async function createPeriod(
  name: string,
  startTime: string,
  endTime: string,
  isBreak: boolean
): Promise<Period> {
  const response = await api.post("/periods", {
    name,
    start_time: startTime,
    end_time: endTime,
    is_break: isBreak,
  });
  return response.data;
}

export async function updatePeriodBreak(
  id: string,
  isBreak: boolean
): Promise<Period> {
  const response = await api.patch(`/periods/${id}`, { is_break: isBreak });
  return response.data;
}

export async function deletePeriod(id: string): Promise<void> {
  await api.delete(`/periods/${id}`);
}

export interface Classroom extends Lookup {
  start_time: string | null;
  end_time: string | null;
}

export async function getClassrooms(): Promise<Classroom[]> {
  const response = await api.get("/classrooms");
  return response.data;
}

export async function createClassroom(
  name: string,
  startTime?: string,
  endTime?: string
): Promise<Classroom> {
  const response = await api.post("/classrooms", {
    name,
    start_time: startTime || null,
    end_time: endTime || null,
  });
  return response.data;
}

export async function updateClassroomTimeRange(
  id: string,
  startTime: string,
  endTime: string
): Promise<Classroom> {
  const response = await api.patch(`/classrooms/${id}`, {
    start_time: startTime,
    end_time: endTime,
  });
  return response.data;
}

export async function clearClassroomTimeRange(id: string): Promise<Classroom> {
  const response = await api.patch(`/classrooms/${id}`, {
    clear_time_range: true,
  });
  return response.data;
}

export async function deleteClassroom(id: string): Promise<void> {
  await api.delete(`/classrooms/${id}`);
}

export async function getSections(): Promise<
  (Lookup & { classroom_id: string })[]
> {
  const response = await api.get("/sections");
  return response.data;
}

export async function createSection(
  name: string,
  classroomId: string
): Promise<Lookup & { classroom_id: string }> {
  const response = await api.post("/sections", {
    name,
    classroom_id: classroomId,
  });
  return response.data;
}

export async function deleteSection(id: string): Promise<void> {
  await api.delete(`/sections/${id}`);
}

export async function getSubjects(): Promise<Lookup[]> {
  const response = await api.get("/subjects");
  return response.data;
}

export async function createSubject(name: string): Promise<Lookup> {
  const response = await api.post("/subjects", { name });
  return response.data;
}

export async function deleteSubject(id: string): Promise<void> {
  await api.delete(`/subjects/${id}`);
}

export interface Teacher extends Lookup {
  teacher_code: string | null;
  max_periods_per_day: number;
  is_active: boolean;
}

export async function getTeachers(): Promise<Teacher[]> {
  const response = await api.get("/teachers");
  return response.data;
}

export async function createTeacher(
  name: string,
  maxPeriodsPerDay: number,
  teacherCode?: string
): Promise<Teacher> {
  const response = await api.post("/teachers", {
    name,
    max_periods_per_day: maxPeriodsPerDay,
    teacher_code: teacherCode || null,
  });
  return response.data;
}

export async function updateTeacher(
  id: string,
  data: { name?: string; max_periods_per_day?: number }
): Promise<Teacher> {
  const response = await api.patch(`/teachers/${id}`, data);
  return response.data;
}

export async function activateTeacher(id: string): Promise<Teacher> {
  const response = await api.patch(`/teachers/${id}/activate`);
  return response.data;
}

export async function deactivateTeacher(id: string): Promise<Teacher> {
  const response = await api.patch(`/teachers/${id}/deactivate`);
  return response.data;
}

export async function deleteTeacher(id: string): Promise<void> {
  await api.delete(`/teachers/${id}`);
}

export interface ClassSubject {
  id: string;
  classroom_id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string | null;
  periods_per_week: number;
  days_per_week: number | null;
}

export async function getClassSubjects(): Promise<ClassSubject[]> {
  const response = await api.get("/class-subjects");
  return response.data;
}

export async function createClassSubject(
  classroomId: string,
  sectionId: string,
  subjectId: string,
  periodsPerWeek: number,
  teacherId?: string,
  daysPerWeek?: number
): Promise<ClassSubject> {
  const response = await api.post("/class-subjects", {
    classroom_id: classroomId,
    section_id: sectionId,
    subject_id: subjectId,
    periods_per_week: periodsPerWeek,
    teacher_id: teacherId || null,
    days_per_week: daysPerWeek || null,
  });
  return response.data;
}

export async function deleteClassSubject(id: string): Promise<void> {
  await api.delete(`/class-subjects/${id}`);
}

export interface TeacherSubject {
  id: string;
  teacher_id: string;
  subject_id: string;
}

export async function getTeacherSubjects(): Promise<TeacherSubject[]> {
  const response = await api.get("/teacher-subjects");
  return response.data;
}

export async function createTeacherSubject(
  teacherId: string,
  subjectId: string
): Promise<TeacherSubject> {
  const response = await api.post("/teacher-subjects", {
    teacher_id: teacherId,
    subject_id: subjectId,
  });
  return response.data;
}

export async function deleteTeacherSubject(id: string): Promise<void> {
  await api.delete(`/teacher-subjects/${id}`);
}

export interface TeacherAvailability {
  id: string;
  teacher_id: string;
  working_day_id: string;
  period_id: string;
  available: boolean;
}

export async function getTeacherAvailability(): Promise<
  TeacherAvailability[]
> {
  const response = await api.get("/teacher-availability");
  return response.data;
}

export async function createTeacherUnavailability(
  teacherId: string,
  workingDayId: string,
  periodId: string
): Promise<TeacherAvailability> {
  const response = await api.post("/teacher-availability", {
    teacher_id: teacherId,
    working_day_id: workingDayId,
    period_id: periodId,
    available: false,
  });
  return response.data;
}

export async function deleteTeacherAvailability(id: string): Promise<void> {
  await api.delete(`/teacher-availability/${id}`);
}

export interface ClassAvailability {
  id: string;
  classroom_id: string;
  section_id: string;
  working_day_id: string;
  period_id: string;
  available: boolean;
}

export async function getClassAvailability(): Promise<ClassAvailability[]> {
  const response = await api.get("/class-availability");
  return response.data;
}

export async function createClassUnavailability(
  classroomId: string,
  sectionId: string,
  workingDayId: string,
  periodId: string
): Promise<ClassAvailability> {
  const response = await api.post("/class-availability", {
    classroom_id: classroomId,
    section_id: sectionId,
    working_day_id: workingDayId,
    period_id: periodId,
    available: false,
  });
  return response.data;
}

export async function deleteClassAvailability(id: string): Promise<void> {
  await api.delete(`/class-availability/${id}`);
}

export async function getTimetables(): Promise<TimetableSummary[]> {
  const response = await api.get("/timetable/");
  return response.data;
}

export async function createTimetable(
  academicYearId: string
): Promise<TimetableSummary> {
  const response = await api.post("/timetable/", {
    academic_year_id: academicYearId,
  });
  return response.data;
}

export async function getTimetableEntries(
  timetableId: string
): Promise<TimetableEntry[]> {
  const response = await api.get(`/timetable/${timetableId}`);
  return response.data;
}

export async function deleteTimetable(timetableId: string): Promise<void> {
  await api.delete(`/timetable/${timetableId}`);
}

export async function renameTimetable(
  timetableId: string,
  name: string
): Promise<TimetableSummary> {
  const response = await api.patch(`/timetable/${timetableId}`, { name });
  return response.data;
}

export async function generateTimetable(
  academicYearId: string
): Promise<{
  timetable_id: string;
  entries_saved: number;
  warnings: string[];
}> {
  const response = await api.post("/timetable/generate", {
    academic_year_id: academicYearId,
  });
  return response.data;
}
