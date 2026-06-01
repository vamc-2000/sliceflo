export interface Label {
  id: string;
  name: string;
  color: string;
}


export interface CustomField {
  id: string;
  name: string;
  type: 'select-one' | 'select-many';
  icon?: string;
  required?: boolean;
  description?: string;
  fieldTypeLabel?: string;
  options?: string[];
  config?: any;
}
// API request/response format for workspace custom fields
export interface WorkspaceCustomFieldOption {
  value: string;
  label: string;
}

export interface WorkspaceCustomFieldConfig {
  _id?: string;
  name: string;
  label: string;
  description?: string;
  type: 'text' | 'date' | 'dropdown' | 'number'; // ✅ Only API-supported types
  required?: boolean;
  order?: number;
  options?: WorkspaceCustomFieldOption[];
  defaultValue?: any;
}

export interface WorkspaceCustomFieldFormData {
  name: string;
  type: 'text' | 'date' | 'dropdown' | 'number';
  description: string;
  icon?: string;
  required?: boolean;
  fieldTypeLabel?: string;
  options?: string[];
  config?: any;
}

// Add this new interface for the nested structure
export interface ProjectPhaseChild {
  _id: string;
  value: string;
  label: string;
  description?: string;
  color: string;
  order: number;
}

export interface ProjectPhase {
  _id: string;
  value: string;
  label: string;
  description?: string;
  color: string;
  order: number;
  children?: ProjectPhaseChild[];
}


export interface Workspace {
  id?: string;
  name: string;
  icon?: string;
  // plan: string;
  description?: string;
  members?: { userId: string; role: string }[];
  portfolios?: string[];
  customFields?: CustomField[];
  labels?: Label[];
  projectPhases?: ProjectPhase[];
  createdAt?: string;
  updatedAt?: string;
  slug?: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface WorkspaceMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  profilePicture: string | null;
  avatar?: string;
  id?: string;      // Frontend-friendly ID
  _id?: string;
  user?: {
    name: string;
    avatar: string;
  };
}

export interface WorkspaceMembersResponse {
  members: WorkspaceMember[];
}





