import api from "@/lib/api";
import {
  School,
  CreateSchoolRequest,
  UpdateSchoolRequest,
} from "@/types/school";

export async function getSchools(): Promise<School[]> {
  const response = await api.get("/schools");

  return response.data;
}

export async function createSchool(
  data: CreateSchoolRequest
): Promise<School> {
  const response = await api.post(
    "/schools",
    data
  );

  return response.data;
}

export async function updateSchool(
  id: string,
  data: UpdateSchoolRequest
): Promise<School> {
  const response = await api.put(
    `/schools/${id}`,
    data
  );

  return response.data;
}

export async function getSchool(
  id: string
): Promise<School> {
  const response = await api.get(
    `/schools/${id}`
  );

  return response.data;
}