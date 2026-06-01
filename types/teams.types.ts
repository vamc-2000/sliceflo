export interface Team {
  id: string
  // teamName?: string
  slug?: string
  description?: string
  labels?: Label[]
  isEndorsed?: boolean
  timezone?: string
  isPrivate?: boolean
  name?: string
  iconId?: string | null
  icon?: IconData;
  members?: TeamMember[];
  teamMembers: TeamMember[]
  memberCount?: number
  portfolios?: any[]
  portfolioIds?: string[];
  createdAt?: string
  updatedAt?: string
  teamType?: string
  approveRequests?: string
  editTeamPage?: string
  editPrivacy?: string
  inviteMembersApproval?: boolean
  inviteGuestsApproval?: boolean
  adminsOnlyRemoval?: boolean
  teamStatus?: boolean
  projectIds?: string[];
  projects?: Array<{     
    id: string
    name: string
    description: string
    status: string
    priority: string
  }>
  goals?: Array<{
    id: string
    title: string
    description?: string
    color?: string
  }>

  // projects?: Array<{
  //   id: string
  //   name: string
  //   icon?: { color: string, name: string }
  //   // add other project fields
  // }>
}

export interface TeamMember {
  id: string
  name: string
  username?: string
  selected?: boolean
  avatar?: string
  initials?: string
  email?: string
  status?: string
  project?: string
  role?: string
  skill?: string
  userId: string;    
  // role: 'owner' | 'member';
  profilePicture: string | null;
  profilePictureUrl: string | null;
}

export interface AddMemberRequest {
  userId?: string;
  email?: string;
  role: "admin" | "member" | "guest";
}

export interface TimelineItem {
  id: string
  title: string
  time: string
  author?: string
}

export interface Label {
  id: string
  name: string
  color: string
}

export interface IconData {
  type: 'icon' | 'file'
  icon?: string
  image?: string
  color: string
  name?: string
}

export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}

export interface IEvent {
  id: number;
  startDate: string;
  endDate: string;
  title: string;
  color: TEventColor;
  description: string;
  user: IUser;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}

export interface CalendarEvent {
  id: string
  title: string
  startDate: string
  endDate: string
  color: string
}

export interface Reply {
  id: number
  author: string
  user?: string;
  text: string
  avatar?: string
  timestamp?: string
  mentions?: string[]
  isTyping?: boolean
  reactions?: {
    likes: number
    dislikes: number
    smiles: number
  }
}

export interface Comment {
  id: number
  author: string
  text: string
  avatar?: string
  timestamp?: string
  replies?: Reply[]
  mentions?: string[]
  isTyping?: boolean
  isPinned?: boolean
  reactions?: {
    likes: number
    dislikes: number
    smiles: number
  }
  typingUsers?: string[]
}

export interface CreateTeamRequest {
  name: string;
  description: string;
  labels?: string[]; // since you are sending only label IDs or names
  isEndorsed?: boolean;
  timezone: string;
  isPrivate?: boolean;
  slug?: string;
  iconId?: string | null;
  icon?: string | null;
  members: {
    userId: string;
    role: "admin" | "member" | "guest";
  }[];
}

export interface TeamApiResponse {
  team: Team;
  teamMembers?: TeamMember[] 
}

export interface FetchTeamResponse {
  teams: Team[];
  teamMembers?: TeamMember[] 
}

export interface TeamApiModel {
  id: string;
  name?: string;
  description?: string;
  members?: TeamMember[];
  teamMembers?: TeamMember[];
  labels?: Label[];
  timezone?: string;
  isPrivate?: boolean;
  iconId?: string | null;
}


export type TCalendarView = "day" | "week" | "month" | "sprint" | "agenda";
export type TEventColor = "blue" | "green" | "red" | "yellow" | "purple" | "orange" | "gray";
export type TBadgeVariant = "dot" | "colored" | "mixed";
export type TWorkingHours = { [key: number]: { from: number; to: number } };
export type TVisibleHours = { from: number; to: number };
