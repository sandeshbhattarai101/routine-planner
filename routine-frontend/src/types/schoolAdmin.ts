export interface SchoolAdmin {
    id: string;
    email: string;
    school_id: string;
    is_active: boolean;
  }
  
  export interface CreateSchoolAdminRequest {
    email: string;
    password: string;
    school_id: string;
  }