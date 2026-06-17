export interface School {
    id: string;
    name: string;
    is_active: boolean;
  }
  
  export interface CreateSchoolRequest {
    name: string;
  }
  
  export interface UpdateSchoolRequest {
    name?: string;
    is_active?: boolean;
  }