// types/user.types.ts
export interface UserSubscription {
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  plan?: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  billingCycle?: 'monthly' | 'yearly';
}

export interface UserCompany {
  name?: string;
  position?: string;
  department?: string;
}

export interface UserSettings {
  timezone: string;
  language: string;
  notifications: boolean;
}

export interface UserNotificationSettings {
  isMuted: boolean;
  notificationLevel: string;
  notificationTiming: string;
  muteUntil: string | null;
}

export interface UserPreferences {
  timeFormat: string;
  timeZone: string;
  dateFormat: string;
  language: string;
  weekendDays: string[];
  notifications: UserNotificationSettings;
}

export interface UserDisplaySettings {
  theme: string;
  customization: Record<string, any>;
  compactMode: boolean;
  colorBlindMode: boolean;
  occasionalCelebration: boolean;
  notificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    notificationTypes: string[];
  };
}

export interface User {
  id: string;
  email: string;
  name?: string;
  provider?: string;
  providerId?: string;
  idToken?: string;
  tenantId?: string;
  role: 'admin' | 'user' | 'manager' | 'member';
  status: 'active' | 'inactive' | 'suspended';
  subscription: UserSubscription;
  company: UserCompany;
  settings: UserSettings;
  lastLogin?: Date;
  isActive: boolean;
  accessToken?: string;
  isQuestionnaireCompleted: boolean;
  isQuestionnaireCancelled: boolean;
  profilePicture?: string;
  pronouns?: string;
  country?: string;
  about?: string;
  jobRole?: string;
  department?: string;
  industry?: string;
  skills: string[];
  socialLinks: Record<string, any>;
  questions?: Record<string, any>;
  preferences: UserPreferences;
  onlineActivityIndicator: boolean;
  displaySettings: UserDisplaySettings;
  owner?: string;
  inviteSent: boolean;
  noOfInvitesSent: number;
  createdBy?: string;
  userRole: 'Admin' | 'User' | 'Manager' | 'Owner' | 'Co-Owner';
  workPhone?: string;
  personalPhone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Profile Update Requests
export interface UpdateProfileRequest {
  name?: string;
  profilePicture?: string;
  pronouns?: string;
  country?: string;
  about?: string;
  company?: Partial<UserCompany>;
  workPhone?: string;
  personalPhone?: string;
}

export interface UpdateRolesSkillsRequest {
  jobRole?: string;
  department?: string;
  industry?: string;
  skills?: string[];
}

export interface UpdateSocialLinksRequest {
  socialLinks: Record<string, any>;
}

export interface UpdateTimeZoneRequest {
  timeZone: string;
  dateFormat?: string;
  timeFormat?: string;
}

export interface UpdateDisplaySettingsRequest {
  theme?: string;
  customization?: Record<string, any>;
  compactMode?: boolean;
  colorBlindMode?: boolean;
  occasionalCelebration?: boolean;
}

export interface UpdateNotificationPreferencesRequest {
  isMuted?: boolean;
  notificationLevel?: string;
  notificationTiming?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  notificationTypes?: string[];
}

export interface MuteNotificationsRequest {
  muteUntil: string | null;
}

export interface SearchUsersRequest {
  query: string;
  filters?: {
    role?: string;
    department?: string;
    status?: string;
  };
}

export interface InviteUserRequest {
  email: string;
  role?: string;
  message?: string;
}

export interface BulkInviteRequest {
  csvFile: File;
}

// Response Types
export interface ProfileResponse {
  success: boolean;
  user: User;
}

export interface UsersListResponse {
  success: boolean;
  users: User[];
  total: number;
}

export interface SearchUsersResponse {
  success: boolean;
  users: User[];
}

export interface InviteResponse {
  success: boolean;
  message: string;
}
