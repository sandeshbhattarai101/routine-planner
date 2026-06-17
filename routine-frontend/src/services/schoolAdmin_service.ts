import api from "@/lib/api";

import {
  SchoolAdmin,
  CreateSchoolAdminRequest,
} from "@/types/schoolAdmin";

export async function getSchoolAdmins(): Promise<
  SchoolAdmin[]
> {
  const response =
    await api.get(
      "/users/school-admins"
    );

  return response.data;
}

export async function createSchoolAdmin(
  data: CreateSchoolAdminRequest
): Promise<SchoolAdmin> {

  const response =
    await api.post(
      "/users/school-admin",
      data
    );

  return response.data;
}

export async function activateAdmin(
  id: string
) {

  const response =
    await api.patch(
      `/users/${id}/activate`
    );

  return response.data;
}

export async function deactivateAdmin(
  id: string
) {

  const response =
    await api.patch(
      `/users/${id}/deactivate`
    );

  return response.data;
}