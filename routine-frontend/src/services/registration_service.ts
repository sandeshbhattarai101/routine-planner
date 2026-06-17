import api from "@/lib/api";

import {
  RegistrationRequest,
  RegisterSchoolRequest,
} from "@/types/registration";

export async function registerSchool(
  data: RegisterSchoolRequest
) {
  const response =
    await api.post(
      "/registration",
      data
    );

  return response.data;
}

export async function getRequests(): Promise<
  RegistrationRequest[]
> {
  const response =
    await api.get(
      "/registration"
    );

  return response.data;
}

export async function approveRequest(
  id: string
) {
  const response =
    await api.post(
      `/registration/${id}/approve`
    );

  return response.data;
}

export async function rejectRequest(
  id: string
) {
  const response =
    await api.post(
      `/registration/${id}/reject`
    );

  return response.data;
}