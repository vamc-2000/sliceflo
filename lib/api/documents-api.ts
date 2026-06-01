import axiosInstance from "./axios-instance";

// Notes API prefix.
// - If you call via API Gateway: "/_gateway_/notes"
// - If you call notes service directly: "" (and routes are "/notes/...")
const NOTES_GATEWAY_PREFIX = "";

function unwrapApiData<T>(res: any): T {
  // axios-instance returns `response.data` already.
  // Support both:
  // 1) { success: true, data: ... }
  // 2) { data: ... }
  // 3) raw payload
  if (res && typeof res === "object" && "success" in res && "data" in res) return res.data as T;
  if (res && typeof res === "object" && "data" in res) return res.data as T;
  return res as T;
}

function toStringArray(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((v: any) => (typeof v === "string" ? v : v?.toString?.() ?? "")).filter(Boolean);
}

function normalizeNoteToDoc(note: any): DocumentRecord {
  const id = note?.id || note?._id;
  const title = note?.title || "Untitled";
  const parentId = note?.parentNoteId ?? note?.parentId ?? null;
  const rootId = note?.rootNoteId ?? note?.rootId ?? id;
  const ancestors = Array.isArray(note?.ancestors) ? note.ancestors : [];

  // Prefer backend-signed URL when present (S3 keys stored as cover.value with type "url").
  // Fallback: proxy key via /uploads/presigned (returns JSON with `url`, not ideal as img src).
  let coverImage =
    note?.cover?.presignedUrl ?? note?.cover?.value ?? note?.coverImage ?? null;
  if (
    coverImage &&
    typeof coverImage === "string" &&
    !coverImage.startsWith("http") &&
    !coverImage.startsWith("data:") &&
    !coverImage.startsWith("linear-gradient")
  ) {
    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/$/, "");
    coverImage = `${apiBaseUrl}/uploads/presigned?s3Key=${encodeURIComponent(coverImage)}`;
  }

  return {
    id,
    title,
    parentId,
    rootId,
    ancestors,
    icon: note?.emoji ?? note?.icon,
    coverImage,
    // ... remaining fields
    // Relationship links (document-level)
    linkedProjects: toStringArray(note?.linkedProjects),
    linkedTeams: toStringArray(note?.linkedTeams),
    linkedPortfolios: toStringArray(note?.linkedPortfolios),
    linkedDocuments: toStringArray(note?.linkedDocuments),
    // Relationship links (page-level)
    pageLinkedProjects: toStringArray(note?.pageLinkedProjects),
    pageLinkedTeams: toStringArray(note?.pageLinkedTeams),
    pageLinkedPortfolios: toStringArray(note?.pageLinkedPortfolios),
    pageLinkedDocuments: toStringArray(note?.pageLinkedDocuments),
    // Members & favorites - Map sharedWith to members for consistency if needed
    members: toStringArray(note?.members?.length ? note.members : note?.sharedWith),
    isFavorite: !!note?.isFavorite,
    // Lock state
    isLocked: !!note?.isLocked,
    lockedBy: note?.lockedBy?.toString?.() ?? null,
    // Visibility / status
    visibility: note?.visibility ?? "private",
    status: note?.status ?? "active",
    // Timestamps
    createdAt: note?.createdAt,
    updatedAt: note?.updatedAt,
  } as DocumentRecord;
}

export type BreadcrumbItem =
  | { type: "project" | "task" | "document" | "root"; id: string; title: string };

export interface DocumentRecord {
  id: string;
  title: string;
  parentId: string | null;
  rootId: string;
  ancestors: string[];
  path?: string;
  icon?: string; // mapped to notes.emoji
  coverImage?: string | null; // mapped to notes.cover.value (url or base64)
  isFavorite?: boolean;
  isLocked?: boolean;
  lockedBy?: string | null;
  visibility?: string;
  status?: string;
  linkedProjects?: string[];
  linkedTeams?: string[];
  linkedPortfolios?: string[];
  linkedDocuments?: string[];
  pageLinkedProjects?: string[];
  pageLinkedTeams?: string[];
  pageLinkedPortfolios?: string[];
  pageLinkedDocuments?: string[];
  members?: string[];
  contentJson?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export async function createRootDocument(title?: string) {
  // Backend is "notes" but frontend calls them "docs".
  const res = await axiosInstance.post<any>(`${NOTES_GATEWAY_PREFIX}/notes`, {
    title,
    visibility: "private",
  });
  const note = unwrapApiData<any>(res);
  return normalizeNoteToDoc(note);
}

export async function createChildDocument(parentId: string, title?: string) {
  const res = await axiosInstance.post<any>(`${NOTES_GATEWAY_PREFIX}/notes/${parentId}/children`, {
    title,
  });
  const note = unwrapApiData<any>(res);
  return normalizeNoteToDoc(note);
}

export async function getDocument(docId: string) {
  const res = await axiosInstance.get<any>(`${NOTES_GATEWAY_PREFIX}/notes/${docId}`);
  const note = unwrapApiData<any>(res);
  return normalizeNoteToDoc(note);
}

/** List root documents (no parent). */
export async function listRootDocuments() {
  const res = await axiosInstance.get<any>(`${NOTES_GATEWAY_PREFIX}/notes/root`, {
    params: { limit: 100, skip: 0 },
  });
  const payload = unwrapApiData<any>(res);
  const list = Array.isArray(payload) ? payload : (payload?.documents ?? []);
  return { documents: list.map(normalizeNoteToDoc) };
}

export async function listChildren(parentId: string) {
  const res = await axiosInstance.get<any>(
    `${NOTES_GATEWAY_PREFIX}/notes/${parentId}/children`,
    { params: { limit: 100, skip: 0 } }
  );
  const payload = unwrapApiData<any>(res);
  const list = Array.isArray(payload) ? payload : (payload?.documents ?? []);
  return { documents: list.map(normalizeNoteToDoc) };
}

export async function moveDocument(docId: string, newParentId: string) {
  const res = await axiosInstance.patch<any>(`${NOTES_GATEWAY_PREFIX}/notes/${docId}/move`, {
    newParentNoteId: newParentId ?? null,
    order: 0,
  });
  const note = unwrapApiData<any>(res);
  return normalizeNoteToDoc(note);
}

export async function getBreadcrumbs(docId: string) {
  // Notes backend doesn't expose breadcrumbs yet; keep for compatibility.
  return await axiosInstance.get<{ breadcrumbs: BreadcrumbItem[] }>(`${NOTES_GATEWAY_PREFIX}/notes/${docId}`);
}

export type DocumentUpdatePayload = Partial<Pick<DocumentRecord,
  | "title" | "icon" | "coverImage" | "isFavorite"
  | "linkedProjects" | "linkedTeams" | "linkedPortfolios" | "linkedDocuments"
  | "pageLinkedProjects" | "pageLinkedTeams" | "pageLinkedPortfolios" | "pageLinkedDocuments"
  | "members"
>>;

export async function updateDocument(docId: string, payload: DocumentUpdatePayload) {
  const notesPayload: any = {};
  if (payload.title !== undefined) notesPayload.title = payload.title;
  if (payload.icon !== undefined) notesPayload.emoji = payload.icon;
  if (payload.coverImage !== undefined) {
    if (payload.coverImage === null) notesPayload.cover = null;
    else if (typeof payload.coverImage === "string") {
      const isBase64 = payload.coverImage.startsWith("data:");
      notesPayload.cover = { type: isBase64 ? "base64" : "url", value: payload.coverImage };
    }
  }

  // Relationship links – send directly (backend now accepts these)
  const arrayFields = [
    "linkedProjects", "linkedTeams", "linkedPortfolios", "linkedDocuments",
    "pageLinkedProjects", "pageLinkedTeams", "pageLinkedPortfolios", "pageLinkedDocuments",
    "members",
  ] as const;
  for (const field of arrayFields) {
    if (payload[field] !== undefined) {
      notesPayload[field] = payload[field];
    }
  }

  // Favorite flag
  if (payload.isFavorite !== undefined) notesPayload.isFavorite = payload.isFavorite;

  const res = await axiosInstance.patch<any>(`${NOTES_GATEWAY_PREFIX}/notes/${docId}`, notesPayload);
  const note = unwrapApiData<any>(res);
  return normalizeNoteToDoc(note);
}

export async function deleteDocument(docId: string) {
  const res = await axiosInstance.delete<any>(`${NOTES_GATEWAY_PREFIX}/notes/${docId}`);
  const note = unwrapApiData<any>(res);
  return normalizeNoteToDoc(note);
}

/** Lock a note via backend. */
export async function lockDocument(docId: string) {
  const res = await axiosInstance.post<any>(`${NOTES_GATEWAY_PREFIX}/notes/${docId}/lock`);
  const note = unwrapApiData<any>(res);
  return normalizeNoteToDoc(note);
}

/** Unlock a note via backend. */
export async function unlockDocument(docId: string) {
  const res = await axiosInstance.post<any>(`${NOTES_GATEWAY_PREFIX}/notes/${docId}/unlock`);
  const note = unwrapApiData<any>(res);
  return normalizeNoteToDoc(note);
}

/** Share a note with users (backend share endpoint). */
export async function shareDocument(docId: string, userIds: string[]) {
  const res = await axiosInstance.post<any>(`${NOTES_GATEWAY_PREFIX}/notes/${docId}/share`, { userIds });
  const note = unwrapApiData<any>(res);
  return normalizeNoteToDoc(note);
}

/** Unshare a note from users (backend unshare endpoint). */
export async function unshareDocument(docId: string, userIds: string[]) {
  const res = await axiosInstance.post<any>(`${NOTES_GATEWAY_PREFIX}/notes/${docId}/unshare`, { userIds });
  const note = unwrapApiData<any>(res);
  return normalizeNoteToDoc(note);
}
