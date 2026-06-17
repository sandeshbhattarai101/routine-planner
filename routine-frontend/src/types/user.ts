export interface User {

    id: string;
  
    email: string;
  
    role:
      | "SUPER_ADMIN"
      | "SCHOOL_ADMIN";
  
    school_id:
      string | null;
  }