export type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface RegistrationRequest {
  id: string;

  school_name: string;

  admin_name: string;

  email: string;

  status: RequestStatus;
}

export interface RegisterSchoolRequest {
  school_name: string;

  admin_name: string;

  email: string;

  password: string;

  phone?: string;

  address?: string;
}