

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { 
  listRootDocuments, 
  getDocument as getDocumentApi, 
  listChildren, 
  createRootDocument, 
  createChildDocument, 
  updateDocument as updateDocumentApi, 
  deleteDocument as deleteDocumentApi,
  lockDocument as lockDocumentApi,
  unlockDocument as unlockDocumentApi,
  shareDocument as shareDocumentApi,
  unshareDocument as unshareDocumentApi,
  type DocumentRecord,
  type DocumentUpdatePayload
} from "@/lib/api/documents-api";
import { toast } from "@/components/ui/sonner";

interface Block {
  type: string;
  content: any;
  props?: any;
}

interface Document {
  id: string;
  title: string;
  parentId?: string | null;
  rootId?: string;
  ancestors?: string[];
  icon?: string;
  coverImage?: string | null;
  content: Block[];
  createdAt?: number;
  updatedAt?: number;
  viewedAt?: number;
  members?: string[];
  isFavorite?: boolean;
  isLocked?: boolean;
  lockedBy?: string | null;
  isOpen?: boolean;
  linkedProjects?: string[];
  linkedTeams?: string[];
  linkedPortfolios?: string[];
  linkedDocuments?: string[];
  pageLinkedProjects?: string[];
  pageLinkedTeams?: string[];
  pageLinkedPortfolios?: string[];
  pageLinkedDocuments?: string[];
  createdBy?: {
    userId: string;
    name: string;
    profilePictureUrl?: string;
  };
}

interface DocStore {
  documents: Map<string, Document>;
  activeDocId: string | null;
  isLoading: boolean;
  error: string | null;
  isCommentsOpen: boolean;
  editingTitleId: string | null;

  // Fetch actions
  fetchRootDocuments: () => Promise<void>;
  fetchDocument: (id: string) => Promise<Document | undefined>;
  fetchChildren: (parentId: string) => Promise<void>;

  // Mutation actions
  addDocument: (doc: Document) => void;
  loadDocuments: (docs: (Partial<Document> | DocumentRecord)[]) => void;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  createDoc: (title?: string, parentId?: string | null) => Promise<string | undefined>;
  
  getDocument: (id: string) => Document | undefined;
  setActiveDoc: (id: string) => void;
  triggerTitleEdit: (id: string) => void;
  clearTitleEdit: () => void;

  addMemberToDocument: (docId: string, userId: string) => Promise<void>;
  removeMemberFromDocument: (docId: string, userId: string) => Promise<void>;
  shareDoc: (docId: string, userIds: string[]) => Promise<void>;
  unshareDoc: (docId: string, userIds: string[]) => Promise<void>;

  lockDoc: (docId: string) => Promise<void>;
  unlockDoc: (docId: string) => Promise<void>;

  toggleComments: () => void;
  closeComments: () => void;

  isPageDetailsOpen: boolean;
  activeDetailsTab: string;
  togglePageDetails: (tab?: string) => void;
  closePageDetails: () => void;
  setDetailsTab: (tab: string) => void;
  reset: () => void;

  toggleFavorite: (id: string) => Promise<void>;

  addProjectToDocument: (docId: string, projectId: string) => Promise<void>;
  removeProjectFromDocument: (docId: string, projectId: string) => Promise<void>;
  addPortfolioToDocument: (docId: string, portfolioId: string) => Promise<void>;
  removePortfolioFromDocument: (docId: string, portfolioId: string) => Promise<void>;
  addTeamToDocument: (docId: string, teamId: string) => Promise<void>;
  removeTeamFromDocument: (docId: string, teamId: string) => Promise<void>;
  addDocumentToDocument: (docId: string, linkedDocId: string) => Promise<void>;
  removeDocumentFromDocument: (docId: string, linkedDocId: string) => Promise<void>;
  
  // Page links methods
  addPageLinkProject: (docId: string, projectId: string) => Promise<void>;
  removePageLinkProject: (docId: string, projectId: string) => Promise<void>;
  addPageLinkTeam: (docId: string, teamId: string) => Promise<void>;
  removePageLinkTeam: (docId: string, teamId: string) => Promise<void>;
  addPageLinkPortfolio: (docId: string, portfolioId: string) => Promise<void>;
  removePageLinkPortfolio: (docId: string, portfolioId: string) => Promise<void>;
  addPageLinkDocument: (docId: string, linkedDocId: string) => Promise<void>;
  removePageLinkDocument: (docId: string, linkedDocId: string) => Promise<void>;

  exportRequest: { scope: 'page' | 'all', format: 'pdf' | 'html' | 'markdown', timestamp: number } | null;
  triggerExport: (scope: 'page' | 'all', format: 'pdf' | 'html' | 'markdown') => void;
  clearExportRequest: () => void;
}

export const useDocStore = create<DocStore>()(
  persist(
    (set, get) => ({
      documents: new Map(),
      activeDocId: null,
      isLoading: false,
      error: null,
      isCommentsOpen: false,
      editingTitleId: null,
      isPageDetailsOpen: false,
      activeDetailsTab: "settings",
      exportRequest: null,

      triggerExport: (scope, format) => set({ exportRequest: { scope, format, timestamp: Date.now() } }),
      clearExportRequest: () => set({ exportRequest: null }),

      triggerTitleEdit: (id) => set({ editingTitleId: id }),
      clearTitleEdit: () => set({ editingTitleId: null }),

      fetchRootDocuments: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await listRootDocuments();
          get().loadDocuments(data.documents);
          set({ isLoading: false });
        } catch (error: any) {
          set({ isLoading: false, error: error.message || "Failed to fetch root documents" });
          toast("error", { title: "Failed to load documents" });
        }
      },

      fetchDocument: async (id) => {
        if (!id) return;
        set({ isLoading: true, error: null });
        try {
          const doc = await getDocumentApi(id);
          get().loadDocuments([doc]);
          set({ isLoading: false });
          return get().documents.get(id);
        } catch (error: any) {
          set({ isLoading: false, error: error.message || "Failed to fetch document" });
          return undefined;
        }
      },

      fetchChildren: async (parentId) => {
        if (!parentId) return;
        set({ isLoading: true, error: null });
        try {
          const data = await listChildren(parentId);
          get().loadDocuments(data.documents);
          set({ isLoading: false });
        } catch (error: any) {
          set({ isLoading: false, error: error.message || "Failed to fetch children" });
        }
      },

      addDocument: (doc) =>
        set((state) => {
          const newDocs = new Map(state.documents);
          newDocs.set(doc.id, {
            ...doc,
            content: doc.content ?? (doc as any).contentJson ?? [{ type: "paragraph", content: [] }],
            createdAt: doc.createdAt || Date.now(),
            updatedAt: Date.now(),
            viewedAt: Date.now(),
          });
          return {
            documents: newDocs,
            activeDocId: doc.id,
          };
        }),

      loadDocuments: (docs) =>
        set((state) => {
          const newDocs = new Map(state.documents);
          const arrayFields = [
            "linkedProjects", "linkedTeams", "linkedPortfolios", "linkedDocuments",
            "pageLinkedProjects", "pageLinkedTeams", "pageLinkedPortfolios", "pageLinkedDocuments",
            "members"
          ] as const;

          for (const d of docs) {
            if (!d.id) continue;
            const existing = newDocs.get(d.id);
            const apiTitle = d.title || (d as any).title;
            const finalTitle = (apiTitle && apiTitle !== "Untitled" && apiTitle !== "Untitled Page")
              ? apiTitle
              : (existing?.title || apiTitle || "Untitled");

            const toTs = (val: any) => {
              if (!val) return 0;
              if (typeof val === 'number') return val;
              const dd = new Date(val);
              return isNaN(dd.getTime()) ? 0 : dd.getTime();
            };

            const merged: Document = {
              ...existing,
              ...(d as any),
              id: d.id,
              title: finalTitle,
              parentId: (d.parentId || (d as any).parentNoteId) || (existing?.parentId ?? null),
              content: (d as any).content ?? (d as any).contentJson ?? existing?.content ?? [{ type: "paragraph", content: [] }],
              createdAt: toTs(d.createdAt) || toTs(existing?.createdAt) || Date.now(),
              updatedAt: toTs(d.updatedAt) || toTs(existing?.updatedAt) || Date.now(),
              viewedAt: existing?.viewedAt ?? (d as any).viewedAt ?? 0,
            } as Document;

            for (const field of arrayFields) {
              const incoming = (d as any)[field] as string[] | undefined;
              const current = (existing as any)?.[field] as string[] | undefined;

              if (Array.isArray(incoming) && incoming.length > 0) {
                (merged as any)[field] = [...new Set([...(current ?? []), ...incoming])];
              } else if (Array.isArray(current) && current.length > 0) {
                (merged as any)[field] = current;
              } else {
                (merged as any)[field] = (merged as any)[field] || [];
              }
            }

            newDocs.set(d.id, merged);
          }
          return { documents: newDocs };
        }),

      createDoc: async (title, parentId) => {
        try {
          const newDoc = parentId 
            ? await createChildDocument(parentId, title)
            : await createRootDocument(title);
          
          if (newDoc) {
            get().loadDocuments([newDoc]);
            get().setActiveDoc(newDoc.id);
            return newDoc.id;
          }
        } catch (error) {
          toast("error", { title: "Failed to create document" });
          return undefined;
        }
      },

      updateDocument: async (id, updates) => {
        // Optimistic update
        const existing = get().documents.get(id);
        if (!existing) return;

        set((state) => {
          const newDocs = new Map(state.documents);
          newDocs.set(id, { ...existing, ...updates, updatedAt: Date.now() });
          return { documents: newDocs };
        });

        try {
          // Prepare API payload
          const payload: DocumentUpdatePayload = {};
          if (updates.title !== undefined) payload.title = updates.title;
          if (updates.icon !== undefined) payload.icon = updates.icon;
          if (updates.coverImage !== undefined) payload.coverImage = updates.coverImage;
          if (updates.isFavorite !== undefined) payload.isFavorite = updates.isFavorite;
          if (updates.members !== undefined) payload.members = updates.members;
          
          const arrayFields = [
            "linkedProjects", "linkedTeams", "linkedPortfolios", "linkedDocuments",
            "pageLinkedProjects", "pageLinkedTeams", "pageLinkedPortfolios", "pageLinkedDocuments"
          ] as const;

          for (const field of arrayFields) {
            if ((updates as any)[field] !== undefined) {
              (payload as any)[field] = (updates as any)[field];
            }
          }

          if (Object.keys(payload).length > 0) {
            const updated = await updateDocumentApi(id, payload);
            if (updated) get().loadDocuments([updated]);
          }
        } catch (error) {
          // Rollback on error
          set((state) => {
            const newDocs = new Map(state.documents);
            newDocs.set(id, existing);
            return { documents: newDocs };
          });
          toast("error", { title: "Failed to update document" });
        }
      },

      getDocument: (id) => get().documents.get(id),

      setActiveDoc: (id) =>
        set((state) => {
          const doc = state.documents.get(id);
          if (doc) {
            const newDocs = new Map(state.documents);
            newDocs.set(id, {
              ...doc,
              viewedAt: Date.now(),
            });
            return { documents: newDocs, activeDocId: id };
          }
          return { activeDocId: id };
        }),

      deleteDocument: async (id: string) => {
        const existing = get().documents.get(id);
        if (!existing) return;

        // Optimistic delete
        set((state) => {
          const newDocs = new Map(state.documents);
          const deleteRecursive = (docId: string) => {
            const allDocs = Array.from(newDocs.values());
            const children = allDocs.filter((doc) => doc.parentId === docId);
            children.forEach((child) => deleteRecursive(child.id));
            newDocs.delete(docId);
          };
          deleteRecursive(id);
          return {
            documents: newDocs,
            activeDocId: state.activeDocId === id ? null : state.activeDocId,
          };
        });

        try {
          await deleteDocumentApi(id);
        } catch (error) {
          // Rollback - complex for recursive delete, but we try to restore the main doc
          set((state) => {
            const newDocs = new Map(state.documents);
            newDocs.set(id, existing);
            return { documents: newDocs };
          });
          toast("error", { title: "Failed to delete document" });
        }
      },

      addMemberToDocument: async (docId, userId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        const newMembers = [...(doc.members || []), userId];
        await get().updateDocument(docId, { members: newMembers });
      },

      removeMemberFromDocument: async (docId, userId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        const newMembers = (doc.members || []).filter((id) => id !== userId);
        await get().updateDocument(docId, { members: newMembers });
      },

      shareDoc: async (docId, userIds) => {
        try {
          const updated = await shareDocumentApi(docId, userIds);
          if (updated) get().loadDocuments([updated]);
        } catch (error) {
          toast("error", { title: "Failed to share document" });
        }
      },

      unshareDoc: async (docId, userIds) => {
        try {
          const updated = await unshareDocumentApi(docId, userIds);
          if (updated) get().loadDocuments([updated]);
        } catch (error) {
          toast("error", { title: "Failed to unshare document" });
        }
      },

      lockDoc: async (docId) => {
        try {
          const updated = await lockDocumentApi(docId);
          if (updated) get().loadDocuments([updated]);
        } catch (error) {
          toast("error", { title: "Failed to lock document" });
        }
      },

      unlockDoc: async (docId) => {
        try {
          const updated = await unlockDocumentApi(docId);
          if (updated) get().loadDocuments([updated]);
        } catch (error) {
          toast("error", { title: "Failed to unlock document" });
        }
      },

      toggleComments: () =>
        set((state) => ({ isCommentsOpen: !state.isCommentsOpen })),

      closeComments: () =>
        set({ isCommentsOpen: false }),

      togglePageDetails: (tab) =>
        set((state) => ({
          isPageDetailsOpen: tab ? true : !state.isPageDetailsOpen,
          activeDetailsTab: tab || state.activeDetailsTab
        })),

      closePageDetails: () =>
        set({ isPageDetailsOpen: false }),

      setDetailsTab: (tab) =>
        set({ activeDetailsTab: tab }),

      reset: () => {
        localStorage.removeItem('doc-storage');
        set({
          documents: new Map(),
          activeDocId: null,
          isLoading: false,
          error: null,
          isCommentsOpen: false,
          editingTitleId: null,
          isPageDetailsOpen: false,
          activeDetailsTab: "settings",
          exportRequest: null,
        });
      },

      toggleFavorite: async (id) => {
        const doc = get().documents.get(id);
        if (doc) {
          await get().updateDocument(id, { isFavorite: !doc.isFavorite });
        }
      },

      // Project relationship actions
      addProjectToDocument: async (docId, projectId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        const currentProjects = doc.linkedProjects || [];
        if (!currentProjects.includes(projectId)) {
          await get().updateDocument(docId, { linkedProjects: [...currentProjects, projectId] });
        }
      },

      removeProjectFromDocument: async (docId, projectId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        await get().updateDocument(docId, {
          linkedProjects: (doc.linkedProjects || []).filter((id) => id !== projectId),
          pageLinkedProjects: (doc.pageLinkedProjects || []).filter((id) => id !== projectId),
        });
      },

      addTeamToDocument: async (docId: string, teamId: string) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        const currentTeams = doc.linkedTeams || [];
        if (!currentTeams.includes(teamId)) {
          await get().updateDocument(docId, { linkedTeams: [...currentTeams, teamId] });
        }
      },

      removeTeamFromDocument: async (docId: string, teamId: string) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        await get().updateDocument(docId, {
          linkedTeams: (doc.linkedTeams || []).filter((id) => id !== teamId),
          pageLinkedTeams: (doc.pageLinkedTeams || []).filter((id) => id !== teamId),
        });
      },

      addPortfolioToDocument: async (docId, portfolioId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        const currentPortfolios = doc.linkedPortfolios || [];
        if (!currentPortfolios.includes(portfolioId)) {
          await get().updateDocument(docId, { linkedPortfolios: [...currentPortfolios, portfolioId] });
        }
      },

      removePortfolioFromDocument: async (docId, portfolioId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        await get().updateDocument(docId, {
          linkedPortfolios: (doc.linkedPortfolios || []).filter((id) => id !== portfolioId),
          pageLinkedPortfolios: (doc.pageLinkedPortfolios || []).filter((id) => id !== portfolioId),
        });
      },

      addDocumentToDocument: async (docId, linkedDocId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        const currentDocs = doc.linkedDocuments || [];
        if (!currentDocs.includes(linkedDocId)) {
          await get().updateDocument(docId, { linkedDocuments: [...currentDocs, linkedDocId] });
        }
      },

      removeDocumentFromDocument: async (docId, linkedDocId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        await get().updateDocument(docId, {
          linkedDocuments: (doc.linkedDocuments || []).filter((id) => id !== linkedDocId),
          pageLinkedDocuments: (doc.pageLinkedDocuments || []).filter((id) => id !== linkedDocId),
        });
      },

      addPageLinkProject: async (docId, projectId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        const currentProjects = doc.pageLinkedProjects || [];
        if (!currentProjects.includes(projectId)) {
          await get().updateDocument(docId, { pageLinkedProjects: [...currentProjects, projectId] });
        }
      },

      removePageLinkProject: async (docId, projectId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        await get().updateDocument(docId, {
          pageLinkedProjects: (doc.pageLinkedProjects || []).filter((id) => id !== projectId),
        });
      },

      addPageLinkTeam: async (docId, teamId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        const currentTeams = doc.pageLinkedTeams || [];
        if (!currentTeams.includes(teamId)) {
          await get().updateDocument(docId, { pageLinkedTeams: [...currentTeams, teamId] });
        }
      },

      removePageLinkTeam: async (docId, teamId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        await get().updateDocument(docId, {
          pageLinkedTeams: (doc.pageLinkedTeams || []).filter((id) => id !== teamId),
        });
      },

      addPageLinkPortfolio: async (docId, portfolioId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        const currentPortfolios = doc.pageLinkedPortfolios || [];
        if (!currentPortfolios.includes(portfolioId)) {
          await get().updateDocument(docId, { pageLinkedPortfolios: [...currentPortfolios, portfolioId] });
        }
      },

      removePageLinkPortfolio: async (docId, portfolioId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        await get().updateDocument(docId, {
          pageLinkedPortfolios: (doc.pageLinkedPortfolios || []).filter((id) => id !== portfolioId),
        });
      },

      addPageLinkDocument: async (docId, linkedDocId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        const currentDocs = doc.pageLinkedDocuments || [];
        if (!currentDocs.includes(linkedDocId)) {
          await get().updateDocument(docId, { pageLinkedDocuments: [...currentDocs, linkedDocId] });
        }
      },

      removePageLinkDocument: async (docId, linkedDocId) => {
        const doc = get().documents.get(docId);
        if (!doc) return;
        await get().updateDocument(docId, {
          pageLinkedDocuments: (doc.pageLinkedDocuments || []).filter((id) => id !== linkedDocId),
        });
      },
    }),

    {
      name: "doc-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        documents: Array.from(state.documents.entries()),
        activeDocId: state.activeDocId,
        isCommentsOpen: state.isCommentsOpen,
        isPageDetailsOpen: state.isPageDetailsOpen,
        activeDetailsTab: state.activeDetailsTab,
        exportRequest: state.exportRequest,
      }),
      merge: (persistedState: any, currentState) => {
        return {
          ...currentState,
          ...persistedState,
          documents: new Map(persistedState?.documents || []),
          activeDocId: persistedState?.activeDocId ?? currentState.activeDocId,
          isCommentsOpen: persistedState?.isCommentsOpen ?? currentState.isCommentsOpen,
          isPageDetailsOpen: persistedState?.isPageDetailsOpen ?? currentState.isPageDetailsOpen,
          activeDetailsTab: persistedState?.activeDetailsTab ?? currentState.activeDetailsTab,
          exportRequest: persistedState?.exportRequest ?? currentState.exportRequest,
        };
      },
    }
  )
);
