export interface DiscussionParticipant {
  userId: string;
  joinedAt: string;
  lastReadAt: string;
  discussionId: string;
  discussionTitle: string;
}

export type DiscussionType = "project" | "task" | "team" | "goal" | "portfolio";

export interface Discussion {
  id: string;
  _id: string;
  type: DiscussionType;
  referenceId: string;
  title: string;
  description: string;
  participants: DiscussionParticipant[];
  priority: "low" | "medium" | "high";
  status: "open" | "closed" | "archived";

  isPrivate?: boolean;
  labelIds?: string[];

  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  messages?: DiscussionMessage[];
  attachments?: MessageAttachment[];
}

// common API wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

/* -------- message payload -------- */

export interface MessageAttachmentInput {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  uploadedAt: string;      // ISO date
  uploadedBy: string;
}

export interface MessageMentionInput {
  userId: string;
  username: string;
  position: number;
}

export interface CreateMessagePayload {
  text: string;
  replyTo?: string;        // optional if not replying
  attachments?: MessageAttachmentInput[];
  uploadIds?: string[];
  mentions?: MessageMentionInput[];
  reactions?: string[];
}

/* -------- message response -------- */

export interface MessageAttachment {
  id?: string;
  _id?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  uploadedAt: string;
  uploadedBy: string;
  url?: string;
}

export interface MessageMention {
  userId: string;
  username: string;
  position: number;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profilePicture: string;
  };
  createdAt: string;
}

export interface MessageAuthor {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
}

export interface MessageReplyTo {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
}

export interface DiscussionMessage {
  id: string;
  discussionId: string;
  authorId: string | MessageAuthor;
  text: string;
  replyTo?: MessageReplyTo | null;
  attachments: MessageAttachment[];
  mentions: MessageMention[];
  reactions: MessageReaction[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  pending?: boolean;  //Client only field

}

/* -------- update message payload -------- */
// export interface UpdateMessageReactionInput {
//   emoji: string;
// }

export interface UpdateMessagePayload {
  text?: string;

  // attachments
  uploadIds?: string[];              // add new attachments
  removeAttachmentIds?: string[];    // remove existing attachments

  // reactions
  reactions?: string[]; // add reactions
  removeReactionIds?: string[];              // remove reactions

  // mentions
  mentions?: MessageMentionInput[];
}

// Single message returned from createMessage
export type CreateMessageResponse = ApiResponse<DiscussionMessage>;

// For getDiscussions (list of discussions)
export type CreateDiscussionResponse = ApiResponse<Discussion>;

export type FetchMessagesResponse = ApiResponse<Discussion>;

// Update reply response
export type UpdateMessageResponse = ApiResponse<DiscussionMessage>;

export type DeleteDiscussionResponse = {
  success: boolean;
  message: string;
};