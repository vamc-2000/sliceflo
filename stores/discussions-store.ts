import { create } from "zustand";

import type {
  Discussion,
  DiscussionType,
  CreateMessagePayload,
  DiscussionMessage,
  UpdateMessagePayload,
  MessageMentionInput,
} from "@/types/discussions.types";
import type { Profile } from "@/types/profile.types";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { discussionAPI } from "@/lib/api/discussion-api";
import { uploadFile } from "@/lib/api/uploads-api";

const makeContextKey = (type: DiscussionType, referenceId: string) =>
  `${type}:${referenceId}`;

const getDiscussionId = (d: Discussion) => d._id ?? d.id;

const getCurrentUserId = (): string | null =>
  useAuthStore.getState().user?.id ?? null;

const buildOptimisticAuthor = () => {
  const authUser = useAuthStore.getState().user;
  const profileUser = useProfileStore.getState().user;
  return {
    id: authUser?.id ?? "",
    name: authUser?.name ?? profileUser?.name ?? "You",
    email: authUser?.email ?? "",
    profilePicture: profileUser?.profilePictureUrl ?? "",
  };
};

const sortDiscussionsByDate = (list: Discussion[]) =>
  [...list].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

const sortMessagesByDate = (messages: DiscussionMessage[]) =>
  [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

/** Default 30s; override via NEXT_PUBLIC_DISCUSSIONS_POLL_INTERVAL_MS */
export const DISCUSSIONS_POLL_INTERVAL_MS = (() => {
  const raw = process.env.NEXT_PUBLIC_DISCUSSIONS_POLL_INTERVAL_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed >= 5_000 ? parsed : 30_000;
})();

const isPendingDiscussion = (d: Discussion) => {
  const id = getDiscussionId(d);
  return (
    id.startsWith("pending-") ||
    Boolean((d.metadata as { pending?: boolean } | undefined)?.pending)
  );
};

const getMessageId = (m: DiscussionMessage): string =>
  m.id || (m as { _id?: string })._id || "";

const getAuthorId = (m: DiscussionMessage): string => {
  if (typeof m.authorId === "string") return m.authorId;
  return m.authorId?.id ?? "";
};

/** True when two messages are the same (by id or optimistic vs confirmed). */
const messagesMatch = (a: DiscussionMessage, b: DiscussionMessage): boolean => {
  const aId = getMessageId(a);
  const bId = getMessageId(b);
  if (aId && bId && aId === bId) return true;

  if (a.text.trim() !== b.text.trim()) return false;
  if (getAuthorId(a) !== getAuthorId(b)) return false;

  const aTime = new Date(a.createdAt).getTime();
  const bTime = new Date(b.createdAt).getTime();
  if (Number.isNaN(aTime) || Number.isNaN(bTime)) return false;

  return Math.abs(aTime - bTime) <= 120_000;
};

const dedupeMessages = (messages: DiscussionMessage[]): DiscussionMessage[] => {
  const result: DiscussionMessage[] = [];

  for (const msg of messages) {
    const duplicateIndex = result.findIndex((existing) =>
      messagesMatch(existing, msg)
    );

    if (duplicateIndex === -1) {
      result.push(msg);
      continue;
    }

    const existing = result[duplicateIndex];
    if (existing.pending && !msg.pending) {
      result[duplicateIndex] = msg;
    }
  }

  return sortMessagesByDate(result);
};

const mergeMessages = (
  local: DiscussionMessage[] | undefined,
  remote: DiscussionMessage[] | undefined
): DiscussionMessage[] => {
  const server = dedupeMessages(remote ?? []);
  const unmatchedPending = (local ?? []).filter(
    (m) => m.pending && !server.some((s) => messagesMatch(s, m))
  );
  return dedupeMessages([...server, ...unmatchedPending]);
};

const mergeDiscussionsFromPoll = (
  local: Discussion[],
  remote: Discussion[],
  messagesLoadedIds: Record<string, boolean>
): Discussion[] => {
  const localById = new Map(local.map((d) => [getDiscussionId(d), d]));
  const remoteIds = new Set(remote.map((d) => getDiscussionId(d)));

  const merged = remote.map((remoteD) => {
    const id = getDiscussionId(remoteD);
    const localD = localById.get(id);
    if (!localD) return remoteD;

    if (messagesLoadedIds[id]) {
      return { ...remoteD, messages: localD.messages };
    }

    if (localD.messages?.some((m) => m.pending)) {
      return {
        ...remoteD,
        messages: mergeMessages(localD.messages, remoteD.messages),
      };
    }

    return remoteD;
  });

  const pendingOnly = local.filter(
    (d) => isPendingDiscussion(d) && !remoteIds.has(getDiscussionId(d))
  );

  return sortDiscussionsByDate([...merged, ...pendingOnly]);
};

interface DiscussionStore {
  discussions: Discussion[];
  contextKey: string | null;
  listLoading: boolean;
  messagesLoadingById: Record<string, boolean>;
  messagesLoadedIds: Record<string, boolean>;
  listPollInFlight: boolean;
  messagesPollInFlight: Record<string, boolean>;
  error: string | null;

  fetchDiscussions: (type: DiscussionType, referenceId: string) => Promise<void>;
  pollDiscussions: (type: DiscussionType, referenceId: string) => Promise<void>;
  pollDiscussionMessages: (discussionId: string) => Promise<void>;
  getSortedDiscussions: (
    profile: Profile | null,
    type: DiscussionType,
    referenceId: string
  ) => Discussion[];
  isMessagesLoading: (discussionId: string) => boolean;

  createDiscussion: (
    type: DiscussionType,
    referenceId: string,
    payload: {
      title: string;
      description?: string;
      priority?: "low" | "medium" | "high";
      tags?: string[];
      mentions?: MessageMentionInput[];
      metadata?: Record<string, unknown>;
      uploadIds?: string[];
    },
    options?: { files?: File[] }
  ) => Promise<string | null>;

  discussionMessages: (discussionId: string) => Promise<void>;
  createMessage: (
    type: DiscussionType,
    referenceId: string,
    discussionId: string,
    payload: CreateMessagePayload,
    options?: { files?: File[] }
  ) => Promise<void>;

  updateMessage: (
    discussionId: string,
    replyId: string,
    payload: UpdateMessagePayload
  ) => Promise<void>;

  deleteDiscussion: (discussionId: string) => Promise<void>;
  deleteReply: (discussionId: string, replyId: string) => Promise<void>;
  deleteDiscussionAttachment: (
    discussionId: string,
    attachmentId: string
  ) => Promise<void>;

  reset: () => void;
}

const initialState = {
  discussions: [] as Discussion[],
  contextKey: null as string | null,
  listLoading: false,
  messagesLoadingById: {} as Record<string, boolean>,
  messagesLoadedIds: {} as Record<string, boolean>,
  listPollInFlight: false,
  messagesPollInFlight: {} as Record<string, boolean>,
  error: null as string | null,
};

export const useDiscussionStore = create<DiscussionStore>()((set, get) => ({
  ...initialState,

  isMessagesLoading: (discussionId) =>
    Boolean(get().messagesLoadingById[discussionId]),

  fetchDiscussions: async (type, referenceId) => {
    const key = makeContextKey(type, referenceId);
    const isNewContext = get().contextKey !== key;

    set({
      contextKey: key,
      listLoading: true,
      error: null,
      ...(isNewContext
        ? { discussions: [], messagesLoadingById: {}, messagesLoadedIds: {} }
        : {}),
    });

    try {
      const res = await discussionAPI.getDiscussions(type, referenceId);
      const list = Array.isArray(res.data) ? res.data : [res.data];
      const sorted = sortDiscussionsByDate(
        list.filter(Boolean) as Discussion[]
      );

      if (get().contextKey !== key) return;

      const messagesLoadedIds: Record<string, boolean> = {};
      sorted.forEach((d) => {
        const id = getDiscussionId(d);
        if (d.messages !== undefined) {
          messagesLoadedIds[id] = true;
        }
      });

      set({
        discussions: sorted,
        listLoading: false,
        messagesLoadedIds: {
          ...get().messagesLoadedIds,
          ...messagesLoadedIds,
        },
      });
    } catch (err: unknown) {
      if (get().contextKey !== key) return;
      const message =
        err instanceof Error ? err.message : "Failed to fetch discussions";
      set({
        listLoading: false,
        error: message,
      });
    }
  },

  pollDiscussions: async (type, referenceId) => {
    const key = makeContextKey(type, referenceId);
    if (get().contextKey !== key || get().listPollInFlight) return;

    set({ listPollInFlight: true });

    try {
      const res = await discussionAPI.getDiscussions(type, referenceId);
      const list = Array.isArray(res.data) ? res.data : [res.data];
      const sorted = sortDiscussionsByDate(
        list.filter(Boolean) as Discussion[]
      );

      if (get().contextKey !== key) return;

      const messagesLoadedIds: Record<string, boolean> = {};
      sorted.forEach((d) => {
        const id = getDiscussionId(d);
        if (d.messages !== undefined) {
          messagesLoadedIds[id] = true;
        }
      });

      set((state) => ({
        discussions: mergeDiscussionsFromPoll(
          state.discussions,
          sorted,
          state.messagesLoadedIds
        ),
        messagesLoadedIds: {
          ...state.messagesLoadedIds,
          ...messagesLoadedIds,
        },
        listPollInFlight: false,
      }));
    } catch {
      if (get().contextKey === key) {
        set({ listPollInFlight: false });
      }
    }
  },

  pollDiscussionMessages: async (discussionId) => {
    if (
      get().messagesLoadingById[discussionId] ||
      get().messagesPollInFlight[discussionId]
    ) {
      return;
    }

    set((state) => ({
      messagesPollInFlight: {
        ...state.messagesPollInFlight,
        [discussionId]: true,
      },
    }));

    try {
      const res = await discussionAPI.fetchMessages(discussionId);
      const remote = sortMessagesByDate(res.data.messages ?? []);

      set((state) => ({
        discussions: state.discussions.map((d) =>
          getDiscussionId(d) === discussionId
            ? {
                ...d,
                messages: mergeMessages(d.messages, remote),
              }
            : d
        ),
        messagesLoadedIds: {
          ...state.messagesLoadedIds,
          [discussionId]: true,
        },
        messagesPollInFlight: {
          ...state.messagesPollInFlight,
          [discussionId]: false,
        },
      }));
    } catch {
      set((state) => ({
        messagesPollInFlight: {
          ...state.messagesPollInFlight,
          [discussionId]: false,
        },
      }));
    }
  },

  getSortedDiscussions: (profile, type, referenceId) => {
    const key = makeContextKey(type, referenceId);
    if (get().contextKey !== key) return [];

    const discussions = get().discussions;
    if (!profile) return discussions;

    const pinnedThreadId =
      profile.discussionSettings?.[type]?.[referenceId]?.pinnedThreadId;

    if (!pinnedThreadId) return discussions;

    return [
      ...discussions.filter((d) => getDiscussionId(d) === pinnedThreadId),
      ...discussions.filter((d) => getDiscussionId(d) !== pinnedThreadId),
    ];
  },

  createDiscussion: async (type, referenceId, payload, options) => {
    const key = makeContextKey(type, referenceId);
    if (get().contextKey !== key) {
      await get().fetchDiscussions(type, referenceId);
    }

    const tempId = `pending-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const author = buildOptimisticAuthor();

    const optimisticDiscussion: Discussion = {
      id: tempId,
      _id: tempId,
      type,
      referenceId,
      title: payload.title,
      description: payload.description ?? "",
      participants: [],
      priority: payload.priority ?? "medium",
      status: "open",
      tags: payload.tags ?? [],
      metadata: {
        ...(payload.metadata ?? {}),
        authorName: author.name,
        avatarUrl: author.profilePicture,
        pending: true,
      },
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      discussions: [...state.discussions, optimisticDiscussion],
      error: null,
    }));

    try {
      let apiPayload = { ...payload };

      if (options?.files?.length) {
        const uploads = await Promise.all(
          options.files.map((file) => uploadFile(file))
        );
        apiPayload = {
          ...apiPayload,
          uploadIds: [
            ...(apiPayload.uploadIds ?? []),
            ...uploads.map((u) => u.id),
          ],
        };
      }

      const res = await discussionAPI.createDiscussion(
        type,
        referenceId,
        apiPayload
      );
      const created = res.data;
      const realId = getDiscussionId(created);

      set((state) => ({
        discussions: sortDiscussionsByDate(
          state.discussions.map((d) =>
            getDiscussionId(d) === tempId
              ? {
                  ...created,
                  messages: created.messages ?? [],
                }
              : d
          )
        ),
        messagesLoadedIds: {
          ...state.messagesLoadedIds,
          ...(realId ? { [realId]: true } : {}),
        },
      }));

      return realId;
    } catch (err: unknown) {
      set((state) => ({
        discussions: state.discussions.filter((d) => getDiscussionId(d) !== tempId),
        error:
          err instanceof Error ? err.message : "Failed to create discussion",
      }));
      return null;
    }
  },

  createMessage: async (_type, _referenceId, discussionId, payload, options) => {
    const clientId = crypto.randomUUID();
    const author = buildOptimisticAuthor();

    const optimisticMessage: DiscussionMessage = {
      id: clientId,
      pending: true,
      discussionId,
      authorId: author,
      text: payload.text,
      replyTo: payload.replyTo
        ? {
            id: payload.replyTo,
            text: "",
            authorId: "",
            createdAt: new Date().toISOString(),
          }
        : null,
      attachments: payload.attachments ?? [],
      mentions: payload.mentions ?? [],
      reactions: [],
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      discussions: state.discussions.map((d) =>
        getDiscussionId(d) === discussionId
          ? {
              ...d,
              messages: [...(d.messages ?? []), optimisticMessage],
            }
          : d
      ),
      error: null,
    }));

    try {
      let finalPayload = { ...payload };

      if (options?.files?.length) {
        const uploads = await Promise.all(
          options.files.map((file) => uploadFile(file))
        );
        finalPayload = {
          ...finalPayload,
          uploadIds: [
            ...(finalPayload.uploadIds ?? []),
            ...uploads.map((u) => u.id),
          ],
        };
      }

      const res = await discussionAPI.createMessages(discussionId, finalPayload);
      const serverMessage: DiscussionMessage = {
        ...res.data,
        id: res.data.id ?? (res.data as { _id?: string })._id ?? clientId,
        pending: false,
      };

      set((state) => ({
        discussions: state.discussions.map((d) =>
          getDiscussionId(d) === discussionId
            ? {
                ...d,
                messages: dedupeMessages(
                  (d.messages ?? []).map((m) =>
                    getMessageId(m) === clientId ? serverMessage : m
                  )
                ),
              }
            : d
        ),
      }));
    } catch (err: unknown) {
      set((state) => ({
        discussions: state.discussions.map((d) =>
          getDiscussionId(d) === discussionId
            ? {
                ...d,
                messages: d.messages?.filter((m) => m.id !== clientId),
              }
            : d
        ),
        error: err instanceof Error ? err.message : "Failed to create message",
      }));
    }
  },

  discussionMessages: async (discussionId) => {
    if (get().messagesLoadingById[discussionId]) return;
    if (get().messagesLoadedIds[discussionId]) return;

    set((state) => ({
      messagesLoadingById: {
        ...state.messagesLoadingById,
        [discussionId]: true,
      },
      error: null,
    }));

    try {
      const res = await discussionAPI.fetchMessages(discussionId);
      const sortedMessages = dedupeMessages(res.data.messages ?? []);

      set((state) => ({
        discussions: state.discussions.map((d) =>
          getDiscussionId(d) === discussionId
            ? {
                ...d,
                messages: mergeMessages(d.messages, sortedMessages),
              }
            : d
        ),
        messagesLoadingById: {
          ...state.messagesLoadingById,
          [discussionId]: false,
        },
        messagesLoadedIds: {
          ...state.messagesLoadedIds,
          [discussionId]: true,
        },
      }));
    } catch (err: unknown) {
      set((state) => ({
        messagesLoadingById: {
          ...state.messagesLoadingById,
          [discussionId]: false,
        },
        error: err instanceof Error ? err.message : "Failed to fetch messages",
      }));
    }
  },

  updateMessage: async (discussionId, replyId, payload) => {
    let previousMessage: DiscussionMessage | null = null;
    const currentUserId = getCurrentUserId();
    if (!currentUserId) throw new Error("User not authenticated");

    const sameReply = (m: DiscussionMessage) =>
      m.id === replyId || (m as { _id?: string })._id === replyId;

    try {
      set((state) => ({
        discussions: state.discussions.map((d) =>
          getDiscussionId(d) === discussionId
            ? {
                ...d,
                messages: d.messages?.map((m) => {
                  if (!sameReply(m)) return m;
                  previousMessage = { ...m };

                  let updated = {
                    ...m,
                    updatedAt: new Date().toISOString(),
                  };

                  if (payload.text !== undefined) {
                    updated = {
                      ...updated,
                      text: payload.text,
                      isEdited: true,
                    };
                  }

                  if (payload.removeAttachmentIds?.length) {
                    updated = {
                      ...updated,
                      attachments: (m.attachments || []).filter(
                        (att) =>
                          !att.id ||
                          !payload.removeAttachmentIds!.includes(att.id)
                      ),
                      isEdited: true,
                    };
                  }

                  if (payload.reactions?.length) {
                    const reactions = updated.reactions || [];
                    payload.reactions.forEach((emoji) => {
                      const exists = reactions.some(
                        (r) => r.emoji === emoji && r.userId === currentUserId
                      );
                      updated.reactions = exists
                        ? reactions.filter(
                            (r) =>
                              !(r.emoji === emoji && r.userId === currentUserId)
                          )
                        : [
                            ...reactions,
                            {
                              id: crypto.randomUUID(),
                              emoji,
                              userId: currentUserId,
                              createdAt: new Date().toISOString(),
                            },
                          ];
                    });
                  }

                  if (payload.removeReactionIds?.length) {
                    updated.reactions = (updated.reactions || []).filter(
                      (r) => !payload.removeReactionIds!.includes(r.id)
                    );
                  }

                  return updated;
                }),
              }
            : d
        ),
      }));

      const res = await discussionAPI.updateReply(
        discussionId,
        replyId,
        payload
      );
      const updatedMessage = {
        ...res.data,
        id: res.data.id ?? (res.data as { _id?: string })._id,
      };

      set((state) => ({
        discussions: state.discussions.map((d) =>
          getDiscussionId(d) === discussionId
            ? {
                ...d,
                messages: d.messages?.map((m) =>
                  sameReply(m) ? updatedMessage : m
                ),
              }
            : d
        ),
      }));
    } catch (err) {
      if (previousMessage) {
        set((state) => ({
          discussions: state.discussions.map((d) =>
            getDiscussionId(d) === discussionId
              ? {
                  ...d,
                  messages: d.messages?.map((m) =>
                    sameReply(m) ? previousMessage! : m
                  ),
                }
              : d
          ),
        }));
      }
      console.error(err);
    }
  },

  deleteDiscussionAttachment: async (discussionId, attachmentId) => {
    const previousDiscussions = get().discussions;

    try {
      set((state) => ({
        discussions: state.discussions.map((d) =>
          getDiscussionId(d) === discussionId
            ? {
                ...d,
                attachments: d.attachments?.filter(
                  (att) => (att.id ?? (att as { _id?: string })._id) !== attachmentId
                ),
              }
            : d
        ),
      }));

      await discussionAPI.deleteDiscussionAttachment(
        discussionId,
        attachmentId
      );
    } catch (err: unknown) {
      set({
        discussions: previousDiscussions,
        error:
          err instanceof Error
            ? err.message
            : "Failed to delete attachment",
      });
      console.error(err);
    }
  },

  deleteDiscussion: async (discussionId) => {
    const previousDiscussions = get().discussions;

    try {
      set((state) => ({
        discussions: state.discussions.filter(
          (d) => getDiscussionId(d) !== discussionId
        ),
      }));

      await discussionAPI.deleteDiscussion(discussionId);
    } catch (err: unknown) {
      set({
        discussions: previousDiscussions,
        error:
          err instanceof Error ? err.message : "Failed to delete discussion",
      });
    }
  },

  deleteReply: async (discussionId, replyId) => {
    const sameReply = (m: DiscussionMessage) =>
      m.id === replyId || (m as { _id?: string })._id === replyId;

    const discussion = get().discussions.find(
      (d) => getDiscussionId(d) === discussionId
    );
    const previousMessages = discussion?.messages
      ? [...discussion.messages]
      : [];

    try {
      set((state) => ({
        discussions: state.discussions.map((d) =>
          getDiscussionId(d) === discussionId
            ? {
                ...d,
                messages: d.messages?.filter((m) => !sameReply(m)),
              }
            : d
        ),
      }));

      await discussionAPI.deleteReply(discussionId, replyId);
    } catch (err: unknown) {
      set((state) => ({
        discussions: state.discussions.map((d) =>
          getDiscussionId(d) === discussionId
            ? { ...d, messages: previousMessages }
            : d
        ),
        error: err instanceof Error ? err.message : "Failed to delete reply",
      }));
      console.error(err);
    }
  },

  reset: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("discussion-store");
    }
    set({ ...initialState });
  },
}));
