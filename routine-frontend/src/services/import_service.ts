import api from "@/lib/api";

export interface UploadSheet {
  name: string;
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface UploadResult {
  filename: string;
  sheets: UploadSheet[];
}

export interface FieldMapping {
  id: string;
  school_id: string;
  entity_type: string;
  excel_column: string;
  system_field: string;
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/uploads/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export async function getMappings(
  entityType: string
): Promise<FieldMapping[]> {
  const response = await api.get(`/mappings/${entityType}`);

  return response.data;
}

export async function createMapping(
  entityType: string,
  excelColumn: string,
  systemField: string
): Promise<FieldMapping> {
  const response = await api.post("/mappings/", {
    entity_type: entityType,
    excel_column: excelColumn,
    system_field: systemField,
  });

  return response.data;
}

export async function processImport(
  entityType: string,
  rows: Record<string, unknown>[]
): Promise<{ imported: number }> {
  const response = await api.post("/imports/process", {
    entity_type: entityType,
    rows,
  });

  return response.data;
}
