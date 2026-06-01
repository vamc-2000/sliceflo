import type { DiscussionType } from "@/types/discussions.types";

export type SocialPlatform = "linkedin" | "twitter" | "facebook" | "instagram" | "threads";

export type UserRole = "Admin" | "Member" | "Viewer" | "Guest" | "User" | "Manager" | "Owner" | "Co-Owner";

//  Allow any string keys from backend
export interface SocialLinks {
  [key: string]: string; 
}

/* -------------------- Discussion Settings -------------------- */
export type PinnedDiscussionValue = {
  pinnedThreadId: string;
  updatedAt?: string;
};

export type DiscussionEntitySettingsMap = Record<string, PinnedDiscussionValue>;

export type DiscussionSettings = Partial<
  Record<DiscussionType, DiscussionEntitySettingsMap>
>;

export interface ProjectSettings {
  defaultView?: string;
  itemsPerPage?: number;
  sortBy?: string;
  filters?: Record<string, any>;
  display?: {
    theme?: string;
    compact?: boolean;
  };
  tailoredViews?: any[] | Record<string, any>;
  [key: string]: any;
}

export interface Profile {
  _id?: string;
  id: string;
  email?: string;
  name?: string;
  provider?: string;
  providerId?: string;
  idToken?: string;
  tenantId?: string;
  role?: 'admin' | 'user' | 'manager' | 'member';
  status?: 'active' | 'inactive' | 'suspended';
  subscription?: {
    tier?: 'free' | 'basic' | 'premium' | 'enterprise';
    plan?: string;
    startDate?: Date;
    endDate?: Date;
    status?: 'active' | 'expired' | 'cancelled';
    billingCycle?: 'monthly' | 'yearly';
  };
  company?: {
    name?: string;
    position?: string;
    department?: string;
  };
  settings?: {
    timezone?: string;
    language?: string;
    notifications?: boolean;
  };
  lastLogin?: Date;
  isActive?: boolean;
  accessToken?: string;
  isQuestionnaireCompleted?: boolean;
  profilePictureUrl?: string;
  pronouns?: string;
  country?: string;
  about?: string;
  jobRole?: string;
  primaryRole?: string;
  objective?: string[];
  department?: string;
  industry?: string;
  organizationEmployeeCount?: string;
  referralSource?: string[];
  skills?: string[];
  socialLinks?: SocialLinks;

  linkedIn?: boolean;
  onboardingStep?: number;
  // questions?: Record<string, any>;
  preferences?: {
    timeFormat?: string;
    timeZone?: string;
    dateFormat?: string;
    language?: string;
    weekendDays?: string[];
    toastMessage?: boolean;  
    keyboardShortcuts?: boolean;
    checkSpelling?: boolean;  
    notifications?: {
      isMuted?: boolean;
      notificationLevel?: string;
      notificationTiming?: string;
      muteUntil?: string | null;
    };
  };
  workspaceName?: string;
  defaultWorkspaceId?: string;
  onlineActivityIndicator?: boolean;
  displaySettings?: {
    theme?: string;
    fontSize?: string;
    customization?: Record<string, any>;
    compactMode?: boolean;
    colorBlindMode?: boolean;
    occasionalCelebration?: boolean;
    notificationSettings?: {
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      notificationTypes?: string[];
    };
  };
  owner?: string;
  inviteSent?: boolean;
  noOfInvitesSent?: number;
  createdBy?: string;
  userRole?: UserRole;
  workPhone?: string;
  personalPhone?: string;
  createdAt?: Date;
  updatedAt?: Date;

  discussionSettings?: DiscussionSettings;
  discussionType?: string;
  discussionId?: string;
  isPinned?: boolean;
  projectSettings?: ProjectSettings;
}

export interface DefaultWorkspaceRequest {
    workspaceId: string;
}

export interface DefaultWorkspaceResponse {
  success: boolean;
  message: string;
  defaultWorkspaceId: string;
}

export interface ActivityLog {
  id: string;
  actor: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  timestamp: string;
  userRole?: UserRole;
}

export interface ActivityLogsResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  limit: number;
}

//Discussions

export interface UpdateDiscussionPinPayload {
  discussionSettings: DiscussionSettings;
}

export interface MyWorkProject {
  id: string;
  name: string;
  workspaceId: string;
  description?: string | null;
  slug?: string | null;
  status?: string | null;
  state?: string | null;
  phase?: string | null;
  priority?: string | null;
  ownerId?: string | null;
  iconId?: string | null;
  icon?: any;
  color?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  updatedAt?: string | null;
  members?: any[];
  viewers?: any[];
}

export interface MyWorkTeam {
  id: string;
  name: string;
  slug: string;
  workspaceId: string;
  role: string;
  isLeader: boolean;
  status: string;
  teamMembers?: any[];
}

export interface MyWorkTask {
  id: string;
  taskNumber: number;
  title: string;
  status: string;
  taskType: string;
  projectId: string;
  projectName: string;
  assigneeId: string | null;
  reporter: string;
  createdBy: string;
  priority: string;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  endDate?: string;
  dueDate?: string;
}

export interface MyWorkGoal {
  id: string;
  title: string;
  description: string;
  visibility: string;
  status: string;
  workspaceId: string;
  assignedTo: string[];
  owners: string[];
  createdBy: string;
  projectIds: string[];
  startDate: string;
  endDate: string;
  updatedAt: string;
  color?: string;
  isFavorite?: boolean;
}

export interface MyWorkResponse {
  success: boolean;
  period: {
    days: number;
    since: string;
    until: string;
  };
  projects: MyWorkProject[];
  teams: MyWorkTeam[];
  tasks: {
    inPeriodInvolved: number;
    createdByMe: number;
    updatedByMe: number;
    assignedToMeInPeriod: number;
    list: MyWorkTask[];
    byStatus: Record<string, MyWorkTask[]>;
  };
  goals: {
    list: MyWorkGoal[];
    byStatus: Record<string, MyWorkGoal[]>;
  };
  taskTypes: Array<{
    taskType: string;
    count: number;
    percentage: number;
  }>;
  mentions: {
    discussionMessages: number;
    inAppNotifications: number;
    list?: any[];
  };
}





