



export type GoalVisibility = "private" | "team" | "organization";
export type GoalFormVisibility = GoalVisibility | "";

export type GoalStatus = "not started" | "in progress" | "completed" | "on hold";


export interface UpdateHistoryItem {
  id: string;
  field: string;
  previousValue: any;
  newValue: any;
  updatedBy: string;
  updatedAt: string;
}

export interface GoalApiResponse {
  id: string;
  _id: string;
  title: string;
  description: string;
  assignedTo: (string | any)[];
  visibility?: GoalVisibility;
  status: GoalStatus;
  workspaceId: string;
  createdBy: string | any;
  createdAt: string;
  updatedAt: string;
  favoritedBy: any[];
  color?: string;
  owners: (string | any)[];
  startDate?: number; // ✅ timestamp
    endDate?: number | null;
  __v?: number;
  assignedTeams?: string[];
  targets?: GoalTarget[];
  users?: any[];
  teams?: any[];
  isFavorite?: boolean;
}

export interface Goal {
  id: string;
  _id?: string;
  title: string;
  name?: string;
  description: string;
  workspaceId: string;
 startDate: string;       
    endDate: string | null;
  status: GoalStatus;
  visibility?: GoalVisibility;
  assignedTo: (string | any)[];
  createdAt?: string;
  createdBy: string | any;
  updatedAt?: string;
  favoritedBy: any[];
  owners: (string | any)[];
  color?: string;
  icon?: string | null;
  assignedTeams?: string[];
  targets?: GoalTarget[];
  users?: any[];
  teams?: any[];
  isFavorite?: boolean;

  type?: string;
  dateViewed?: string;
  email?: string;
}

export const TARGET_TYPE_COLORS: Record<string, string> = {
    number: '#9BB2DC',   // blue
    boolean: '#FF9500',   // orange
    currency: '#34C759',   // green
    task: '#A2845E',   // green (boards)
};


export interface GoalFormData {
  title: string;
  description: string;
  color: string;
 startDate: string;      // ✅ keep as string "yyyy-MM-dd"
    endDate: string | null;
  owner: string;
  visibility: GoalFormVisibility;
  icon?: string | null;
  assignedTo: string[];
  assignedTeams?: string[];
  isFavorite?: boolean;
}

export interface CreateGoalRequest {
  title: string;
  description: string;
  startDate: string;
  endDate: string | null;
  status: GoalStatus;
  visibility?: GoalVisibility;
  color?: string;
  assignedTo: string[];
  assignedTeams?: string[];
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
   startDate?: number; // ✅ timestamp
    endDate?: number | null;
  status?: GoalStatus;
  visibility?: GoalVisibility;
  color?: string;
  assignedTo?: string[];
  assignedTeams?: string[];
}

export type TargetType = "number" | "boolean" | "currency" | "task";

export interface GoalTarget {
  id: string;
  tenant?: string;
  goal?: string;
  goalId: string;
  label: string;
  description?: string;
  type: TargetType;
  status: "not started" | "in progress" | "completed";
  value?: any;
  current?: number;
  range?: any;
  linkedTaskIds?: string[];
  progress?: {
    percentage: number;
    lastUpdated: string;
    updatedBy: string;
  };
  color?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: {
    _id?: string;
    note: string;
    number?: number;
    done?: boolean;
    currencyValue?: number;
    createdBy?: string | any;
    tenant?: string;
    createdAt?: string;
    updatedAt?: string;
  }[];
  attachments?: any[];
  updateHistory?: UpdateHistoryItem[];
  done?: boolean;
  assignedTo?: string | any;
  completed?: boolean;
  startDate?: number; // ✅ timestamp
    endDate?: number | null;
  unit?: string;
  localProgressPercent?: number;
  localNotes?: {
    text: string;
    percent: number;
    at: string;
    by: string;
  }[];
}

export interface AddTargetNoteRequest {
  note: string;
  number: number;
  done: boolean;
  currencyValue: number;
}


