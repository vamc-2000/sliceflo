export interface Label {
  id: string;
  name: string;
  color: string;
  workspaceId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabelRequest {
  name: string;
  color: string;
}

export interface LabelsApiResponse {
  labels: Label[]; // Or just Label[] if direct array
}
