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

export interface TimetableEntryInput {
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

export async function getPeriods(): Promise<
  (Lookup & { is_break: boolean })[]
> {
  const response = await api.get("/periods");
  return response.data;
}

export async function createPeriod(
  name: string,
  startTime: string,
  endTime: string,
  isBreak: boolean
): Promise<Lookup & { is_break: boolean }> {
  const response = await api.post("/periods", {
    name,
    start_time: startTime,
    end_time: endTime,
    is_break: isBreak,
  });
  return response.data;
}

export async function getClassrooms(): Promise<Lookup[]> {
  const response = await api.get("/classrooms");
  return response.data;
}

export async function getSections(): Promise<
  (Lookup & { classroom_id: string })[]
> {
  const response = await api.get("/sections");
  return response.data;
}

export async function getSubjects(): Promise<Lookup[]> {
  const response = await api.get("/subjects");
  return response.data;
}

export async function getTeachers(): Promise<
  (Lookup & { max_periods_per_day: number })[]
> {
  const response = await api.get("/teachers");
  return response.data;
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

export async function createTimetableEntry(
  timetableId: string,
  data: TimetableEntryInput
): Promise<TimetableEntry> {
  const response = await api.post(
    `/timetable/${timetableId}/entries`,
    data
  );
  return response.data;
}

export async function deleteTimetableEntry(entryId: string): Promise<void> {
  await api.delete(`/timetable/entries/${entryId}`);
}

export async function generateTimetable(
  academicYearId: string
): Promise<{ timetable_id: string; entries_saved: number }> {
  const response = await api.post("/timetable/generate", {
    academic_year_id: academicYearId,
  });
  return response.data;
}
