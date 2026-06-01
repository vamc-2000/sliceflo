// export interface Email {
//   id: number;
//   subject: string;
//   body: string;
//   body1?:string;
//   name?: string;
//   profileImage?: string;
//   property?: string;
//   date?: string;
//   read?: boolean;
//   snoozed?: boolean;
//   image?: string;
//   position?: string;
//   phone?: string;
//   email?: string;
//   city?: string;
//   country?: string;
//   localTime?: string;
// }

export interface Email{
  id: string;
  _id: string;
  userId: string;
  tenantId: string;

  subject: string;
  body: string;

  eventType: string;
  eventData?: any;

  updatedBy?: {
    id: string;
    email: string;
    name?: string;
    username?: string;
    profilePicture?: string;
  };

  read: boolean;
  deleted: boolean;

  createdAt: string;
  updatedAt: string;
  
  snoozed?: boolean;
  snoozedUntil?: string | null;  // ISO date string

  assigneeId?: string;
  assignerId?: string;
  mentionedUserIds?: string[];
}

export interface ProfileData {
  name: string;
  email?: string;
  profilePicture?: string;
  profilePictureUrl?: string;
  phone?: string;
  city?: string;
  country?: string;
  position?: string;
  localTime?: string;
}

export interface MailboxListResponse {
  success: boolean;
  data: Email[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}