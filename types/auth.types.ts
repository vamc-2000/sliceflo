
export interface Session {
   id: string;
  deviceType: string;
  deviceName: string;
  browserInfo: string;
  ipAddress: string;
  lastActive: string;
  createdAt: string;
  isCurrentSession: boolean;
}

export interface User {
  id?: string;
  email: string;
  name?: string;
  provider?: string;
  profilePictureUrl?: string;
  isExistingUser?: boolean; 
  isQuestionnaireCompleted?: boolean;
  token?: string;
  refreshToken?: string;
}

export interface LoginRequest {
  provider: "local" | "google" | "microsoft";
  email: string;
  idToken?: string;
  accessToken?: string;
}

export interface RegisterRequest {
  provider: "local" | "google" | "microsoft";
  email?: string;
  name?: string;
  idToken?: string;
  accessToken?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface AuthResponse {
  email: string;
  requiresOTP?: boolean;
  isExistingUser?: boolean;
  token: string;
  refreshToken?: string;
  // user: {
  //   id: string;
  //   email: string;
  //   name?: string;
  //   provider?: string;
  //   isExistingUser?: boolean;
  //   // isOnboardingCompleted?: boolean;
  // };
}

export interface RegisterResponse {
  success: boolean;
  message?: boolean;
  requiresOTP?: boolean;
  isExistingUser?: boolean;
  token?: string;
  refreshToken?: string;

  // isOnboardingCompleted?: boolean;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    provider: string;
    isExistingUser: boolean;
    isOnboardingCompleted?: boolean;
  };
}

export interface CheckUserAuthResponse {
  success: boolean;
  message: string;
  isActive: boolean;
  isAuthenticated: boolean;
  email: string;
  name: string;
  questions: Record<string, unknown>;
  isQuestionnaireCompleted: boolean;
}

export interface LogoutResponse {
  message: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token: string;
  refreshToken: string;
  // isOnboarded: boolean;

   user?: {                          
    id?: string;
    email: string;
    name?: string;
    provider?: string;
    isExistingUser?: boolean;
    // isOnboardingCompleted?: boolean;
  };
}

export interface GetSessionsResponse {
  sessions: Session[];
}

export interface TerminateSessionsResponse {
  success: boolean;
  message: string;
}


export interface ErrorResponse {
  status: number;
  data: {
    message: string;
  };
}

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  isQuestionnaireCompleted: boolean; 
  isHydrated: boolean;
  signupEmail: string | null;
  
  setCredentials: (payload: { token: string; user?: User }) => void;
  // updateUser: (userData: Partial<User>) => void;
  clearCredentials: () => void;
  reset: () => void;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<RegisterResponse>;
  verifyOtp: (data: VerifyOtpRequest) => Promise<VerifyOtpResponse>;
  // checkUserAuth: () => Promise<CheckUserAuthResponse>;
  checkUserAuth: (token?: string) => Promise<CheckUserAuthResponse>;
  switchWorkspace: (workspaceId: string) => Promise<any>
  
  logout: () => Promise<LogoutResponse>;
  getSessions: () => Promise<GetSessionsResponse>;
  getSessionById: (sessionId: string) => Promise<Session>;
  terminateSession: (sessionId: string) => Promise<TerminateSessionsResponse>;
  terminateOtherSessions: () => Promise<TerminateSessionsResponse>;

  refreshToken: (data: {
    ipAddress: string;
    deviceType: string;
    deviceName: string;
    browserInfo: string;
  }) => Promise<AuthResponse>;

  setSignupEmail: (email: string | null) => void;
}
