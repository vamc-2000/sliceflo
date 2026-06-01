import type {
  DiscussionSettings,
  UpdateDiscussionPinPayload,
} from "@/types/profile.types";
import type { DiscussionType } from "@/types/discussions.types";

export const buildDiscussionPinPayload = (
  entityType: DiscussionType,
  entityId: string,
  pinnedThreadId: string
): UpdateDiscussionPinPayload => {
  return {
    discussionSettings: {
      [entityType]: {
        [entityId]: {
          pinnedThreadId,
          updatedAt: new Date().toISOString(),
        },
      },
    } satisfies DiscussionSettings,
  };
};