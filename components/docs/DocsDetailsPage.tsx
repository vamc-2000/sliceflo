


// @ts-nocheck
"use client";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, UserPlus, X, Smile, Image as ImageIcon, ChevronRight, Download, Globe, Hash, FileText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useDocStore } from "@/stores/useDoc-store";
import { toast } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/auth-store";
import DocMembersSection from "./DocMembersSection";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useProjectsStore } from "@/stores/projects-store";
import { iconLibrary } from "@/components/ColorIconPicker";
import { useTeamStore } from "@/stores/teams-store";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspaceStore } from "@/stores/workspace-store";
import EmojiPicker from "emoji-picker-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft } from "lucide-react";
import { useProfileStore } from "@/stores/profile-store";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { MdOutlineModeEdit } from "react-icons/md";
import Image from "next/image";
import * as Y from "yjs";
import { formatLocalDateTime } from "@/utils/timezone-utils";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Spinner } from "@/components/ui/spinner";
import { PDFExporter, pdfDefaultSchemaMappings } from "@blocknote/xl-pdf-exporter";
import * as ReactPDF from "@react-pdf/renderer";

// Predefined cover images
const COVER_IMAGES = {
  SOLID_COLORS: [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)",
  ],
  NATURE: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800",
  ],
};

interface DocsDetailsPageProps {
  docId?: string;
}

export default function DocsDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const activeDocId = useDocStore((state) => state.activeDocId);
  const getDocument = useDocStore((state) => state.getDocument);
  const updateDocument = useDocStore((state) => state.updateDocument);
  const addMemberToDocument = useDocStore((state) => state.addMemberToDocument);
  const removeMemberFromDocument = useDocStore((state) => state.removeMemberFromDocument);
  const shareDoc = useDocStore((state) => state.shareDoc);
  const unshareDoc = useDocStore((state) => state.unshareDoc);
  const isCommentsOpen = useDocStore((state) => state.isCommentsOpen);
  const createDoc = useDocStore((state) => state.createDoc);
  const documents = useDocStore((state) => state.documents);
  const editingTitleId = useDocStore((state) => state.editingTitleId);
  const clearTitleEdit = useDocStore((state) => state.clearTitleEdit);
  const setActiveDoc = useDocStore((state) => state.setActiveDoc);
  const addDocument = useDocStore((state) => state.addDocument);
  const exportRequest = useDocStore((state) => state.exportRequest);
  const clearExportRequest = useDocStore((state) => state.clearExportRequest);
  const triggerExport = useDocStore((state) => state.triggerExport);
  const addPageLinkProject = useDocStore((state) => state.addPageLinkProject);
  const removePageLinkProject = useDocStore((state) => state.removePageLinkProject);
  const addPageLinkTeam = useDocStore((state) => state.addPageLinkTeam);
  const removePageLinkTeam = useDocStore((state) => state.removePageLinkTeam);
  const addPageLinkPortfolio = useDocStore((state) => state.addPageLinkPortfolio);
  const removePageLinkPortfolio = useDocStore((state) => state.removePageLinkPortfolio);
  const addPageLinkDocument = useDocStore((state) => state.addPageLinkDocument);
  const removePageLinkDocument = useDocStore((state) => state.removePageLinkDocument);

  const { user } = useProfileStore();
  const { workspaceMembers, fetchWorkspaceMembers, currentWorkspace } = useWorkspaceStore();
  const { projects } = useProjectsStore();
  const { teams } = useTeamStore();
  const { portfolios, fetchPortfolios } = usePortfoliosStore();
  const { fetchProjects } = useProjectsStore();
  const { fetchTeams } = useTeamStore();
  const [currentTitle, setCurrentTitle] = useState("Untitled Page");
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [docMembers, setDocMembers] = useState([]);
  const [currentIcon, setCurrentIcon] = useState<string | undefined>(undefined);
  const [currentCover, setCurrentCover] = useState<string | null | undefined>(undefined);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [, forceUpdate] = useState({});

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const editorTheme = mounted && (resolvedTheme === "dark" || resolvedTheme === "dark-contrast") ? "dark" : "light";

  // Relationship linking state
  const [activeTab, setActiveTab] = useState<"project" | "team" | "portfolio" | "document">("project");
  const [showRelationshipTabs, setShowRelationshipTabs] = useState(false); // Toggle between list and tabs view
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const docList = Array.from(documents.values()).filter(doc => !doc.parentId && doc.id !== activeDocId);



  // Get the root document helper
  const getRootDocument = (docId: string | null): string | null => {
    if (!docId) return null;
    const doc = documents.get(docId);
    if (!doc) return null;
    if (!doc.parentId) return docId;
    return getRootDocument(doc.parentId);
  };

  const docId = params.id;
  const rootId = getRootDocument(activeDocId);
  const rootDoc = rootId ? documents.get(rootId) : null;

  const token = useAuthStore((state) => state.token);
  const notesWsUrl = process.env.NEXT_PUBLIC_NOTES_WS_URL || "ws://localhost:3010";
  const [isLockedByBackend, setIsLockedByBackend] = useState(false);

  const isValidDocId = useMemo(() => {
    if (!docId) return false;
    return /^[a-fA-F0-9]{24}$/.test(docId);
  }, [docId]);

  /** Single source of truth with the sidebar: read title from the store whenever we are not editing. */
  const titleFromStore = useMemo(() => {
    const d = docId && isValidDocId ? documents.get(docId) : undefined;
    const t = d?.title;
    if (t != null && String(t).trim() !== "") return String(t).trim();
    return "Untitled Page";
  }, [docId, isValidDocId, documents]);

  const displayTitle = isEditingTitle ? currentTitle : titleFromStore;

  // Use refs for Y.Doc and Provider to manage lifecycle properly
  const yDocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);

  const [syncStatus, setSyncStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'synced'>('disconnected');

  useEffect(() => {
    // Cleanup previous provider/yDoc if they exist
    if (providerRef.current) {
      try { providerRef.current.destroy(); } catch { /* noop */ }
      providerRef.current = null;
    }
    if (yDocRef.current) {
      try { yDocRef.current.destroy(); } catch { /* noop */ }
      yDocRef.current = null;
    }

    if (!docId || !isValidDocId || !token) {
      setSyncStatus("disconnected");
      if (process.env.NEXT_PUBLIC_NOTES_DEBUG === "true") {
        console.debug("[notes-yjs] hocuspocus:not-created", { docId, isValidDocId, hasToken: !!token });
      }
      return;
    }

    const newYDoc = new Y.Doc();
    yDocRef.current = newYDoc;

    const newProvider = new HocuspocusProvider({
      url: notesWsUrl,
      name: docId,
      token,
      document: newYDoc,
      onConnect: () => {
        if (process.env.NEXT_PUBLIC_NOTES_DEBUG === "true") {
          console.debug("[notes-yjs] hocuspocus:connected", { docId });
        }
      },
      onAuthenticationFailed: (data: any) => {
        if (process.env.NEXT_PUBLIC_NOTES_DEBUG === "true") {
          console.error("[notes-yjs] hocuspocus:auth-failed", data);
        }
      },
    } as any);
    providerRef.current = newProvider;

    const onStatus = (event: any) => {
      const s = event?.status;
      if (s === "connecting") setSyncStatus("connecting");
      else if (s === "connected") setSyncStatus("connected");
      else setSyncStatus("disconnected");
    };
    const onSynced = () => setSyncStatus("synced");

    (newProvider as any).on("status", onStatus);
    (newProvider as any).on("synced", onSynced);

    return () => {
      try {
        (newProvider as any).off("status", onStatus);
        (newProvider as any).off("synced", onSynced);
        newProvider.destroy();
      } catch { /* noop */ }
      try {
        newYDoc.destroy();
      } catch { /* noop */ }
      providerRef.current = null;
      yDocRef.current = null;
      setSyncStatus("disconnected");
    };
  }, [docId, isValidDocId, notesWsUrl, token, user?.id]);

  // Expose current values for the editor
  const yDoc = yDocRef.current;
  const provider = providerRef.current;

  // Lock handling: if backend reports locked, make editor read-only.
  // Uses the documents-api getDocument which goes through axiosInstance properly.
  useEffect(() => {
    if (!docId || !isValidDocId) return;
    import("@/lib/api/documents-api").then(({ getDocument: getDocApi }) => {
      getDocApi(docId).then((doc) => {
        setIsLockedByBackend(!!doc?.isLocked);
      }).catch(() => setIsLockedByBackend(false));
    });
  }, [docId, isValidDocId]);

  // When provider is available, BlockNote ignores initialContent (Yjs provides content).
  // When provider is NOT available (sync service down / no token), fall back to the
  // document's persisted contentJson so the user still sees their content on refresh.
  const storeDoc = docId ? documents.get(docId) : undefined;
  const fallbackContent = useMemo(() => {
    if (storeDoc?.content && Array.isArray(storeDoc.content) && storeDoc.content.length > 0) {
      return storeDoc.content;
    }
    return [{ type: "paragraph", content: [] }];
  }, [storeDoc?.content]);

  const editor = useCreateBlockNote(
    {
      initialContent: fallbackContent as any,
      collaboration: syncStatus === 'synced' && provider && yDoc ? {
        provider,
        fragment: yDoc.getXmlFragment("document-store"),
        user: {
          name: user?.name || "User",
          color: "#001F3F",
        },
        showCursorLabels: "activity",
      } : undefined,
      uploadFile: async (file: File) => {
        if (!docId) throw new Error("Missing docId");

        // 1. Upload using the standard file upload wrapper that handles presigned S3 URLs
        const { uploadFile: apiUploadFile, getUpload } = await import("@/lib/api/uploads-api");
        const uploadRes = await apiUploadFile(file);

        if (!uploadRes.url) throw new Error("Upload did not return s3Key");

        // Fetch the real presigned URL from the uploads-api GET endpoint before rendering
        const fullUpload = await getUpload(uploadRes.id) as any;
        if (fullUpload?.presignedUrl) {
          return fullUpload.presignedUrl; // Pass RAW presigned S3 URL
        }

        // 2. Store only s3Key in the document by using a stable app URL as a fallback.
        const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/$/, "");
        const s3Key = encodeURIComponent(uploadRes.url); // url is s3Key for file uploads
        return `${apiBaseUrl}/uploads/presigned?s3Key=${s3Key}`;
      },
    },
    // Ensure editor is recreated when collaboration binding changes.
    [docId, syncStatus === 'synced', user?.id]
  );

  const handleExport = async (format: 'html' | 'markdown' | 'pdf') => {
    if (!editor) return;

    const toastId = toast("info", { title: `Exporting as ${format.toUpperCase()}...` });
    try {
      let content = "";
      let fileName = (storeDoc?.title || "document").replace(/[/\\?%*:|"<>]/g, '-');
      let mimeType = "";

      if (format === 'html') {
        content = editor.blocksToFullHTML(editor.document);
        mimeType = "text/html";
        fileName += ".html";
      } else if (format === 'markdown') {
        content = editor.blocksToMarkdownLossy(editor.document);
        mimeType = "text/markdown";
        fileName += ".md";
      } else if (format === "pdf") {
        const { PDFExporter, pdfDefaultSchemaMappings } = await import("@blocknote/xl-pdf-exporter");
        const ReactPDF = await import("@react-pdf/renderer");


        const blocks = editor.document;

        const exporter = new PDFExporter(editor.schema, pdfDefaultSchemaMappings);
        const pdfDocument = await exporter.toReactPDFDocument(blocks);

        const blob = await ReactPDF.pdf(pdfDocument).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${storeDoc?.title ?? "document"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast("success", { title: "Exported as PDF" });
        return;
      }
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      toast("success", { title: `Exported as ${format.toUpperCase()}` });
    } catch (error) {
      console.error("Export failed", error);
      toast("error", { title: `Failed to export as ${format.toUpperCase()}` });
    }
  };

  useEffect(() => {
    if (exportRequest && exportRequest.scope === 'page') {
      handleExport(exportRequest.format);
      clearExportRequest();
    }
  }, [exportRequest]);

  useEffect(() => {
    if (!yDoc) return;
    if (process.env.NEXT_PUBLIC_NOTES_DEBUG !== "true") return;
    const onYUpdate = (update: Uint8Array, origin: any) => {
      let fragLen: number | undefined;
      try {
        // @ts-ignore
        fragLen = yDoc.getXmlFragment("document-store")?.length;
      } catch {
        fragLen = undefined;
      }
      console.debug("[notes-yjs] ydoc:update", {
        bytes: update.byteLength,
        origin,
        docId,
        fragmentLen: fragLen,
      });
    };
    yDoc.on("update", onYUpdate);
    return () => {
      yDoc.off("update", onYUpdate);
    };
  }, [docId, yDoc]);

  useEffect(() => {
    if (params.id) {
      if (params.id !== activeDocId) {
        setActiveDoc(params.id);
      }
    }
  }, [params.id, activeDocId, setActiveDoc]);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkspaceMembers(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchWorkspaceMembers]);

  // In the optimized model, the document body is owned by Yjs/Hocuspocus.
  // We only track UI "last updated" locally; server persists JSON on store.
  useEffect(() => {
    if (!editor) return;
    const unsubscribe = editor.onChange(() => {
      setLastUpdated(new Date());
    });
    return () => unsubscribe?.();
  }, [editor]);

  // Cover/icon/members from the route page (`docId`). Title is shown via `titleFromStore` / `displayTitle`
  // so it always matches the sidebar after renames without relying on local state sync.
  useEffect(() => {
    if (!docId || docId === "1-1" || !isValidDocId) return;
    const doc = getDocument(docId);
    if (!doc) return;
    setDocMembers(doc.members || []);
    setCurrentIcon(doc.icon);
    setCurrentCover(doc.coverImage);
  }, [docId, isValidDocId, documents, getDocument]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      // Use setTimeout to ensure the input is rendered before focusing
      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 0);
    }
  }, [isEditingTitle]);

  // Listen for title edit trigger from sidebar (match URL page so it works right after navigation)
  useEffect(() => {
    if (editingTitleId && editingTitleId === docId) {
      const timer = setTimeout(() => {
        const d = documents.get(docId);
        setCurrentTitle(
          d?.title != null && String(d.title).trim() !== ""
            ? String(d.title).trim()
            : "Untitled Page"
        );
        setIsEditingTitle(true);
        clearTitleEdit();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [editingTitleId, docId, documents, clearTitleEdit]);

  const handleTitleClick = () => {
    setCurrentTitle(titleFromStore);
    setIsEditingTitle(true);
  };
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => setCurrentTitle(e.target.value);

  const uniqueMembers = workspaceMembers.filter((member, index, self) =>
    index === self.findIndex((m) => (m.userId || m.id) === (member.userId || member.id))
  );

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    const newTitle = currentTitle.trim() || "Untitled Page";
    setCurrentTitle(newTitle);
    if (docId && isValidDocId) {
      updateDocument(docId, { title: newTitle });
      updateDocumentApi(docId, { title: newTitle })
        .then((updated) => { if (updated) updateDocument(docId, updated); })
        .catch((err) => console.error("Failed to save title", err));
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      titleInputRef.current?.blur();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

  const handleAddMember = (userId: string) => {
    if (!activeDocId || !userId || docMembers.includes(userId)) return;
    addMemberToDocument(activeDocId, userId);
    shareDoc(activeDocId, [userId]);
  };

  const handleRemoveMember = (userId: string) => {
    if (!activeDocId || !userId) return;
    removeMemberFromDocument(activeDocId, userId);
    unshareDoc(activeDocId, [userId]);
  };

  const handleEmojiSelect = (emojiObject: any) => {
    const emoji = emojiObject.emoji;
    setCurrentIcon(emoji);
    if (docId && isValidDocId) {
      updateDocument(docId, { icon: emoji });
    }
    setShowEmojiPicker(false);
  };

  const handleCoverSelect = (coverUrl: string) => {
    setCurrentCover(coverUrl);
    if (docId && isValidDocId) {
      updateDocument(docId, { coverImage: coverUrl });
    }
    setShowCoverPicker(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && docId && isValidDocId) {
      try {
        // Use the same upload functionality as the editor so it goes to S3
        const { uploadFile } = await import("@/lib/api/uploads-api");
        const uploadRes = await uploadFile(file);

        if (uploadRes.url) {
          handleCoverSelect(uploadRes.url); // This will be the s3Key or proxy URL
        }
      } catch (err) {
        console.error("Failed to upload cover", err);
      }
    }
  };

  const handleRemoveCover = () => {
    setCurrentCover(null);
    if (docId && isValidDocId) {
      updateDocument(docId, { coverImage: null });
    }
  };

  const handleCreateSubPage = async () => {
    if (!docId || !isValidDocId) return;
    const newId = await createDoc("Untitled Page", docId);
    if (newId) {
      router.push(`/docs/${newId}`);
    }
  };

  const getCoverStyle = (cover: string) => {
    if (cover.startsWith('linear-gradient') || cover.startsWith('#') || cover.startsWith('rgb')) {
      return { background: cover };
    }
    return {
      backgroundImage: `url(${cover})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  };

  const formatTime = (date: Date) => {
    return formatLocalDateTime(date);
  };

  const getUserInitials = (name?: string | null) => {
    if (!name) return "V";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 1).toUpperCase();
  };

  const getMemberDetails = (userId: string) => {
    return workspaceMembers.find(m => m.userId === userId || m.id === userId);
  };

  // Sync page metadata to API then store (for current page docId)
  const syncPageToApi = (payload: Parameters<typeof updateDocumentApi>[1]) => {
    if (!docId || !isValidDocId) return;
    updateDocument(docId, payload as any);
    updateDocumentApi(docId, payload)
      .then((updated) => { if (updated) updateDocument(docId, updated as any); })
      .catch((err) => console.error("Failed to save page", err));
  };

  const getProjectAvatar = (project: any) => {
    if (!project?.icon) return null;
    if (project.icon.type === "file") return { type: "image", src: project.icon.presignedUrl };
    if (project.icon.type === "icon") return { type: "icon", name: project.icon.name, color: project.icon.color ?? "#6B7280" };
    return null;
  };

  // Relationship handlers
  const handleAddProject = (projectId: string) => {
    const newProjects = [...selectedProjects, projectId];
    setSelectedProjects(newProjects);
    syncPageToApi({ pageLinkedProjects: newProjects });
    const totalSelected = newProjects.length + selectedTeams.length + selectedPortfolios.length + selectedDocuments.length;
    if (totalSelected >= 1 && showRelationshipTabs) setShowRelationshipTabs(false);
  };

  const handleRemoveProject = (projectId: string) => {
    const updatedProjects = selectedProjects.filter(id => id !== projectId);
    setSelectedProjects(updatedProjects);
    syncPageToApi({ pageLinkedProjects: updatedProjects });
  };

  const handleAddTeam = (teamId: string) => {
    const newTeams = [...selectedTeams, teamId];
    setSelectedTeams(newTeams);
    syncPageToApi({ pageLinkedTeams: newTeams });
    const totalSelected = selectedProjects.length + newTeams.length + selectedPortfolios.length + selectedDocuments.length;
    if (totalSelected >= 1 && showRelationshipTabs) setShowRelationshipTabs(false);
  };

  const handleRemoveTeam = (teamId: string) => {
    const updatedTeams = selectedTeams.filter(id => id !== teamId);
    setSelectedTeams(updatedTeams);
    syncPageToApi({ pageLinkedTeams: updatedTeams });
  };

  const handleAddPortfolio = (portfolioId: string) => {
    const newPortfolios = [...selectedPortfolios, portfolioId];
    setSelectedPortfolios(newPortfolios);
    syncPageToApi({ pageLinkedPortfolios: newPortfolios });
    const totalSelected = selectedProjects.length + selectedTeams.length + newPortfolios.length + selectedDocuments.length;
    if (totalSelected >= 1 && showRelationshipTabs) setShowRelationshipTabs(false);
  };

  const handleRemovePortfolio = (portfolioId: string) => {
    const updatedPortfolios = selectedPortfolios.filter(id => id !== portfolioId);
    setSelectedPortfolios(updatedPortfolios);
    syncPageToApi({ pageLinkedPortfolios: updatedPortfolios });
  };

  const handleAddDocument = (linkedDocId: string) => {
    const newDocs = [...selectedDocuments, linkedDocId];
    setSelectedDocuments(newDocs);
    syncPageToApi({ pageLinkedDocuments: newDocs });
    const totalSelected = selectedProjects.length + selectedTeams.length + selectedPortfolios.length + newDocs.length;
    if (totalSelected >= 1 && showRelationshipTabs) setShowRelationshipTabs(false);
  };

  const handleRemoveDocument = (linkedDocId: string) => {
    const updatedDocuments = selectedDocuments.filter(id => id !== linkedDocId);
    setSelectedDocuments(updatedDocuments);
    syncPageToApi({ pageLinkedDocuments: updatedDocuments });
  };


  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Main Content Area - Left Side */}
      <div className="flex-1 overflow-y-auto bg-background text-foreground">

        {/* Cover Image Section */}
        <div className="relative flex-shrink-0">
          {currentCover && typeof currentCover === 'string' && (
            <div className="w-full h-64 relative group" style={getCoverStyle(currentCover)} data-testid="cover-container">
              <Button onClick={handleRemoveCover} variant="secondary" size="sm" className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" data-testid="remove-cover-btn">
                <X className="w-4 h-4 mr-1" />
                Remove Cover
              </Button>
            </div>
          )}

          {currentIcon && currentCover && (
            <div className="absolute bottom-0 left-0 max-w-5xl w-full mx-auto px-16 transform translate-y-1/2 z-10">
              <div className="relative group inline-block">
                <div className="bg-card border border-border text-card-foreground rounded-lg p-3 shadow-lg">
                  <span className="text-6xl leading-none block">{currentIcon}</span>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="absolute -bottom-2 -right-2 rounded-full shadow-md hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 h-8 w-8" data-testid="edit-cover-icon-btn">
                      <MdOutlineModeEdit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <EmojiPicker onEmojiClick={handleEmojiSelect} theme={editorTheme} width={350} height={400} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="px-16 py-8 print-content" style={{ paddingTop: currentIcon && currentCover ? '4rem' : '2rem' }}>

          {/* User Info */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 no-print">
              <Avatar className="h-6 w-6" data-testid="user-avatar-trigger">
                <AvatarImage src={user?.profilePictureUrl || ""} alt={user?.name || "User"} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">{user?.name || "user"}</span>
                <span className="text-muted-foreground/60">•</span>
                <span data-testid="last-updated-text">Last updated {formatTime(lastUpdated)}</span>
                {docId && (
                  <>
                    <span className="text-muted-foreground/60">•</span>
                    <span title="Sync status" data-testid="sync-status-text">
                      {!token && "Sign in to sync"}
                      {token && syncStatus === "disconnected" && "Offline"}
                      {token && syncStatus === "connecting" && "Connecting…"}
                      {token && syncStatus === "connected" && "Syncing…"}
                      {token && syncStatus === "synced" && "Saved"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Icon WITHOUT Cover */}
          {currentIcon && !currentCover && (
            <div className="mb-4">
              <div className="relative group inline-block">
                <span className="text-6xl leading-none block">{currentIcon}</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="absolute -bottom-2 -right-2 rounded-full shadow-md hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 h-8 w-8" data-testid="edit-no-cover-icon-btn">
                      <MdOutlineModeEdit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <EmojiPicker onEmojiClick={handleEmojiSelect} theme={editorTheme} width={350} height={400} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            {isEditingTitle ? (
              <input ref={titleInputRef} type="text" value={currentTitle} onChange={handleTitleChange} onBlur={handleTitleBlur} onKeyDown={handleTitleKeyDown} className="text-4xl font-bold w-full border-none outline-none focus:ring-0 p-0 bg-transparent text-foreground" placeholder="Untitled" data-testid="doc-title-input" />
            ) : (
              <h1 onClick={handleTitleClick} className="text-4xl font-bold cursor-text hover:bg-muted/50 px-1 py-2 rounded" data-testid="doc-title-heading">
                {displayTitle}
              </h1>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap mb-8 no-print">
            <Button variant="outline" size="sm" className="gap-2 shadow-sm" onClick={handleCreateSubPage} data-testid="create-sub-page-btn">
              <Plus className="w-4 h-4 text-muted-foreground" />
              Create Sub-page
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 shadow-sm" data-testid="export-dropdown-btn">
                  <Download className="w-4 h-4 text-muted-foreground" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleExport('html')} className="gap-2" data-testid="export-html-option">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>HTML</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('markdown')} className="gap-2" data-testid="export-markdown-option">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span>Markdown</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2" data-testid="export-pdf-option">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span>PDF</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Member Avatars */}
            <div className="flex items-center -space-x-2">
              {docMembers.slice(0, 4).map((userId, index) => {
                const member = getMemberDetails(userId);
                const userName = member?.user?.name || member?.name || "Unknown";
                const userImage = member?.user?.profilePictureUrl || member?.profilePictureUrl;
                return (
                  <Avatar key={index} className="h-8 w-8 border-2 border-background">
                    {userImage && <AvatarImage src={userImage} />}
                    <AvatarFallback className="bg-purple-500 text-white text-xs">
                      {getUserInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
              {docMembers.length > 4 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                  +{docMembers.length - 4}
                </div>
              )}
            </div>

            {/* Members Button with Popover */}
            <Popover open={isMembersOpen} onOpenChange={setIsMembersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 shadow-sm" data-testid="members-popover-trigger">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Members
                  {docMembers.length > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-secondary text-secondary-foreground">
                      {docMembers.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-4 border border-b-[5px] border-b-primary" align="start">
                <DocMembersSection
                  docId={docId || ""}
                  members={docMembers}
                  onAddMember={async (userId) => {
                    await handleAddMember(userId);
                  }}
                  onRemoveMember={async (userId) => {
                    await handleRemoveMember(userId);
                  }}
                  onInviteClick={() => {
                    setIsMembersOpen(false);
                    setIsInviteDialogOpen(true);
                  }}
                />
              </PopoverContent>
            </Popover>

            {/* Add Emoji Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 shadow-sm" data-testid="add-emoji-action-btn">
                  <Smile className="w-4 h-4 text-muted-foreground" />
                  Add Emoji
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <EmojiPicker onEmojiClick={handleEmojiSelect} theme={editorTheme} width={350} height={400} />
              </PopoverContent>
            </Popover>

            {/* Add Cover Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 shadow-sm" data-testid="add-cover-action-btn">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  Add Cover
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-125 p-0" align="start">
                <Tabs defaultValue="gallery" className="w-full">
                  <div className="flex items-center justify-between px-3 py-2 border-b">
                    <TabsList className="grid grid-cols-4 bg-transparent p-0 h-auto gap-4">
                      <TabsTrigger
                        value="gallery"
                        className="relative rounded-none border-0 bg-transparent px-0 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-primary data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:transition-transform after:duration-300 after:ease-in-out after:scale-x-0 data-[state=active]:after:scale-x-100"
                      >
                        Gallery
                      </TabsTrigger>
                      <TabsTrigger
                        value="upload"
                        className="relative rounded-none border-0 bg-transparent px-0 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-primary data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:transition-transform after:duration-300 after:ease-in-out after:scale-x-0 data-[state=active]:after:scale-x-100"
                      >
                        Upload
                      </TabsTrigger>
                      <TabsTrigger
                        value="link"
                        className="relative rounded-none border-0 bg-transparent px-0 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-primary data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:transition-transform after:duration-300 after:ease-in-out after:scale-x-0 data-[state=active]:after:scale-x-100"
                      >
                        Link
                      </TabsTrigger>
                      <TabsTrigger
                        value="search"
                        className="relative rounded-none border-0 bg-transparent px-0 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-primary data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:transition-transform after:duration-300 after:ease-in-out after:scale-x-0 data-[state=active]:after:scale-x-100"
                      >
                        Search
                      </TabsTrigger>
                    </TabsList>
                    <Button variant="ghost" size="sm" className="text-muted-foreground text-xs h-auto p-1">
                      Remove
                    </Button>
                  </div>

                  {/* Gallery Tab */}
                  <TabsContent value="gallery" className="p-3 max-h-80 overflow-y-auto m-0">
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Gradients</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {COVER_IMAGES.SOLID_COLORS.map((gradient, index) => (
                          <Button
                            variant="ghost"
                            key={index}
                            onClick={() => handleCoverSelect(gradient)}
                            className="aspect-video p-0 rounded-md hover:ring-2 hover:ring-primary transition-all h-auto"
                            style={{ background: gradient }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Nature</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {COVER_IMAGES.NATURE.map((imageUrl, index) => (
                          <Button
                            variant="ghost"
                            key={index}
                            onClick={() => handleCoverSelect(imageUrl)}
                            className="aspect-video p-0 rounded-md hover:ring-2 hover:ring-primary transition-all overflow-hidden h-auto"
                          >
                            <img src={imageUrl} alt="Cover" className="w-full h-full object-cover" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Upload Tab */}
                  <TabsContent value="upload" className="p-4 m-0">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                        id="cover-upload"
                      />
                      <Label htmlFor="cover-upload" className="cursor-pointer flex flex-col items-center">
                        <div className="w-12 h-12 mb-3 flex items-center justify-center border-2 border-primary rounded-lg">
                          <ImageIcon className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Drop picture here or <span className="text-primary font-medium underline">Browse</span>
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                          Images wider than 1480px are recommended.
                        </p>
                      </Label>
                    </div>
                  </TabsContent>

                  {/* Link Tab */}
                  <TabsContent value="link" className="p-4 m-0">
                    <Input
                      type="text"
                      placeholder="Paste image link..."
                      className="w-full h-9 focus-visible:ring-primary"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const input = e.target as HTMLInputElement;
                          if (input.value.trim()) {
                            handleCoverSelect(input.value.trim());
                            input.value = "";
                          }
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Press Enter to add image from URL
                    </p>
                  </TabsContent>

                  {/* Search Images Tab */}
                  <TabsContent value="search" className="p-4 m-0">
                    <Input
                      type="text"
                      placeholder="Search for images..."
                      className="w-full h-9 focus-visible:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Search for images from Unsplash
                    </p>
                  </TabsContent>
                </Tabs>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Relationships Display */}
            {(() => {
              const currentDoc = documents.get(activeDocId || "");

              const linkedProjectsList = (currentDoc?.pageLinkedProjects || []).map(id =>
                projects.find(p => p.id === id)
              ).filter(Boolean) || [];
              const linkedTeamsList = (currentDoc?.pageLinkedTeams || []).map(id =>
                teams.find(t => t.id === id)
              ).filter(Boolean) || [];
              const linkedPortfoliosList = (currentDoc?.pageLinkedPortfolios || []).map(id =>
                portfolios.find(p => p.id === id)
              ).filter(Boolean) || [];
              const linkedDocumentsList = (currentDoc?.pageLinkedDocuments || []).map(linkedId =>
                documents.get(linkedId)
              ).filter(Boolean) || [];

              const totalRelationships = (currentDoc?.pageLinkedProjects?.length || 0) +
                (currentDoc?.pageLinkedTeams?.length || 0) +
                (currentDoc?.pageLinkedPortfolios?.length || 0) +
                (currentDoc?.pageLinkedDocuments?.length || 0);
              const hasRelationships = totalRelationships > 0;

              return (
                <div className="flex items-center gap-2">
                  {hasRelationships ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 shadow-sm" data-testid="linked-items-trigger">
                          <span className="font-medium text-foreground">Linked Items</span>
                          <span className="bg-orange-100 text-orange-600 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50 min-w-[18px] h-[18px] flex items-center justify-center rounded-sm text-[10px] font-bold px-1">
                            {totalRelationships}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96 p-0" align="start">
                        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                          {/* Page Links Section */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-foreground" data-testid="page-links-header">Page links</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setShowRelationshipTabs(!showRelationshipTabs)}
                                data-testid="plus-relationship-btn"
                              >
                                <Plus className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>

                            {/* Conditional: Show tabs or list */}
                            {showRelationshipTabs ? (
                              // Show tabs interface
                              <div className="space-y-2">
                                <div className="flex border-b border-border px-1 pt-1">
                                  <Button
                                    variant="ghost"
                                    onClick={() => setActiveTab("project")}
                                    className={`px-2 py-2 text-sm font-medium transition-colors rounded-none h-auto ${activeTab === "project"
                                      ? "text-foreground border-b-2 border-primary -mb-[2px]"
                                      : "text-muted-foreground hover:text-foreground"
                                      }`}
                                    data-testid="relationship-tab-project"
                                  >
                                    Project
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    onClick={() => setActiveTab("portfolio")}
                                    className={`px-2 py-2 text-sm font-medium transition-colors rounded-none h-auto ${activeTab === "portfolio"
                                      ? "text-foreground border-b-2 border-primary -mb-[2px]"
                                      : "text-muted-foreground hover:text-foreground"
                                      }`}
                                    data-testid="relationship-tab-portfolio"
                                  >
                                    Portfolio
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={() => setActiveTab("document")}
                                    className={`px-2 py-2 text-sm font-medium transition-colors rounded-none h-auto ${activeTab === "document"
                                      ? "text-foreground border-b-2 border-primary -mb-[2px]"
                                      : "text-muted-foreground hover:text-foreground"
                                      }`}
                                    data-testid="relationship-tab-document"
                                  >
                                    Documents
                                  </Button>
                                </div>

                                <div className="p-2">
                                  {activeTab === "project" && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-3">Recent Projects</p>
                                      <div className="max-h-60 overflow-y-auto">
                                        {projects.map((project) => {
                                          const isSelected = currentDoc?.pageLinkedProjects?.includes(project.id!);

                                          return (
                                            <div
                                              key={project.id}
                                              className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-muted" : "hover:bg-muted/50"
                                                }`}
                                              onClick={() => {
                                                if (isSelected) {
                                                  removePageLinkProject(activeDocId!, project.id!);
                                                } else {
                                                  addPageLinkProject(activeDocId!, project.id!);
                                                }
                                              }}
                                            >
                                              <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    addPageLinkProject(activeDocId!, project.id!);
                                                  } else {
                                                    removePageLinkProject(activeDocId!, project.id!);
                                                  }
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                data-testid={`checkbox-link-project-${project.id}`}
                                              />

                                              {(() => {
                                                const avatar = getProjectAvatar(project);
                                                return (
                                                  <div
                                                    className="w-5 h-5 rounded shrink-0 flex items-center justify-center overflow-hidden"
                                                    style={{ backgroundColor: avatar?.type === "icon" ? (avatar.color + "20") : (project?.color ? project.color + "20" : "#3B82F620") }}
                                                  >
                                                    {avatar?.type === "image" ? (
                                                      <img src={avatar.src} alt={project?.name} className="w-full h-full object-cover rounded" />
                                                    ) : avatar?.type === "icon" ? (
                                                      (() => {
                                                        const iconObj = iconLibrary.find((i: any) => i.name?.toLowerCase() === avatar.name?.toLowerCase());
                                                        if (iconObj) {
                                                          const IconComponent = iconObj.icon;
                                                          return <IconComponent size={10} color={avatar.color} />;
                                                        }
                                                        return <span className="text-[9px] font-bold" style={{ color: project?.color ?? "#3B82F6" }}>{project?.name?.charAt(0).toUpperCase()}</span>;
                                                      })()
                                                    ) : (
                                                      <span className="text-[9px] font-bold" style={{ color: project?.color ?? "#3B82F6" }}>{project?.name?.charAt(0).toUpperCase()}</span>
                                                    )}
                                                  </div>
                                                );
                                              })()}

                                              <span className="text-sm text-foreground flex-1">
                                                {project.name}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}



                                  {activeTab === "portfolio" && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-3">Recent Portfolios</p>
                                      <div className="space-y-1 max-h-60 overflow-y-auto">
                                        {portfolios.length > 0 ? (
                                          portfolios.map((portfolio) => {
                                            const isSelected = currentDoc?.pageLinkedPortfolios?.includes(portfolio.id);
                                            return (
                                              <div
                                                key={portfolio.id}
                                                className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-muted" : "hover:bg-muted/50"
                                                  }`}
                                                onClick={() => {
                                                  if (isSelected) {
                                                    removePageLinkPortfolio(activeDocId!, portfolio.id);
                                                  } else {
                                                    addPageLinkPortfolio(activeDocId!, portfolio.id);
                                                  }
                                                }}
                                              >
                                                {(() => {
                                                  const avatar = getProjectAvatar(portfolio);
                                                  return (
                                                    <div
                                                      className="w-5 h-5 rounded shrink-0 flex items-center justify-center overflow-hidden"
                                                      style={{ backgroundColor: avatar?.type === "icon" ? `${avatar.color}20` : portfolio?.color ? `${portfolio.color}20` : "#3B82F620" }}
                                                    >
                                                      {avatar?.type === "image" ? (
                                                        <img src={avatar.src} alt={portfolio?.name} className="w-full h-full object-cover rounded" />
                                                      ) : avatar?.type === "icon" ? (
                                                        (() => {
                                                          const iconObj = iconLibrary.find((i: any) => i.name?.toLowerCase() === avatar.name?.toLowerCase());
                                                          if (iconObj) {
                                                            const IconComponent = iconObj.icon;
                                                            return <IconComponent size={10} color={avatar.color} />;
                                                          }
                                                          return <span className="text-[9px] font-bold" style={{ color: portfolio?.color ?? "#3B82F6" }}>{portfolio?.name?.charAt(0).toUpperCase()}</span>;
                                                        })()
                                                      ) : (
                                                        <span className="text-[9px] font-bold" style={{ color: portfolio?.color ?? "#3B82F6" }}>{portfolio?.name?.charAt(0).toUpperCase()}</span>
                                                      )}
                                                    </div>
                                                  );
                                                })()}
                                                <span className="text-sm text-foreground flex-1">
                                                  {portfolio.name}
                                                </span>
                                                <Checkbox
                                                  checked={isSelected}
                                                  onCheckedChange={(checked) => {
                                                    if (checked) {
                                                      addPageLinkPortfolio(activeDocId!, portfolio.id);
                                                    } else {
                                                      removePageLinkPortfolio(activeDocId!, portfolio.id);
                                                    }
                                                  }}
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                  data-testid={`checkbox-link-portfolio-${portfolio.id}`}
                                                />
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <div className="text-sm text-muted-foreground py-8 text-center">
                                            No portfolios available
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {activeTab === "document" && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-3">Recent Documents</p>
                                      <div className="space-y-1 max-h-60 overflow-y-auto">
                                        {docList.map((docItem) => {
                                          const isSelected = rootDoc?.linkedDocuments?.includes(docItem.id);

                                          return (
                                            <div
                                              key={docItem.id}
                                              className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-muted" : "hover:bg-muted/50"
                                                }`}
                                              onClick={() => {
                                                if (isSelected) {
                                                  removeDocumentFromDocument(rootId, docItem.id);
                                                } else {
                                                  addDocumentToDocument(rootId, docItem.id);
                                                }
                                              }}
                                            >
                                              <img src="/images/docsidebar.svg" className="w-4 h-4 shrink-0 dark:brightness-200 dark:contrast-200" alt="Doc" />
                                              <span className="text-sm text-foreground flex-1">
                                                {docItem.title}
                                              </span>
                                              <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    addDocumentToDocument(rootId, docItem.id);
                                                  } else {
                                                    removeDocumentFromDocument(rootId, docItem.id);
                                                  }
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                data-testid={`checkbox-link-document-${docItem.id}`}
                                              />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              // Show list of linked
                              <div className="space-y-1 bg-muted/30 rounded-lg p-2">
                                {linkedProjectsList.map((project, idx) => {
                                  const avatar = getProjectAvatar(project);
                                  return (
                                    <div
                                      key={`project-${idx}`}
                                      className="flex items-center gap-2 py-1.5 px-2 bg-card border border-border rounded hover:bg-muted/50 group"
                                    >
                                      {/* Project Icon */}
                                      <div
                                        className="w-5 h-5 rounded shrink-0 flex items-center justify-center overflow-hidden"
                                        style={{ backgroundColor: avatar?.type === "icon" ? `${avatar.color}20` : project?.color ? `${project.color}20` : "#3B82F620" }}
                                      >
                                        {avatar?.type === "image" ? (
                                          <img src={avatar.src} alt={project?.name} className="w-full h-full object-cover rounded" />
                                        ) : avatar?.type === "icon" ? (
                                          (() => {
                                            const iconObj = iconLibrary.find((i: any) => i.name?.toLowerCase() === avatar.name?.toLowerCase());
                                            if (iconObj) {
                                              const IconComponent = iconObj.icon;
                                              return (
                                                <div className="w-full h-full flex items-center justify-center">
                                                  <IconComponent size={10} color={avatar.color} />
                                                </div>
                                              );
                                            }
                                            return (
                                              <span className="text-[9px] font-bold" style={{ color: project?.color ?? "#3B82F6" }}>
                                                {project?.name?.charAt(0)?.toUpperCase()}
                                              </span>
                                            );
                                          })()
                                        ) : (
                                          <span className="text-[9px] font-bold" style={{ color: project?.color ?? "#3B82F6" }}>
                                            {project?.name?.charAt(0)?.toUpperCase()}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-sm text-foreground flex-1">{project.name}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeProjectFromDocument(rootId, project.id!)}
                                      >
                                        <X className="w-3 h-3 text-muted-foreground" />
                                      </Button>
                                    </div>
                                  );
                                })}

                                {linkedTeamsList.map((team, idx) => (
                                  <div
                                    key={`team-${idx}`}
                                    className="flex items-center gap-2 py-1.5 px-2 bg-card border border-border rounded hover:bg-muted/50 group"
                                  >
                                    <span className="text-base">👥</span>
                                    <span className="text-sm text-foreground flex-1">{team.name}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => removeTeamFromDocument(rootId, team.id!)}
                                    >
                                      <X className="w-3 h-3 text-muted-foreground" />
                                    </Button>
                                  </div>
                                ))}

                                {linkedPortfoliosList.map(p => (
                                  <div key={p?.id} className="flex items-center gap-2 py-1.5 px-2 bg-card border border-border rounded hover:bg-muted group">
                                    <div
                                      className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                                      style={{ backgroundColor: p?.color || "#9333ea" }}
                                    >
                                      {p?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm text-foreground flex-1 truncate">{p?.name}</span>
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleRemovePortfolio(item.id, p?.id!); }}>
                                      <X className="w-3 h-3 text-muted-foreground" />
                                    </Button>
                                  </div>
                                ))}
                                {linkedDocumentsList.map((doc, idx) => (
                                  <div
                                    key={`doc-${idx}`}
                                    className="flex items-center gap-2 py-1.5 px-2 bg-card border border-border rounded hover:bg-muted/50 group"
                                  >
                                    <img src="/images/docsidebar.svg" className="w-4 h-4 shrink-0 dark:brightness-200 dark:contrast-200" alt="Doc" />
                                    <span className="text-sm text-foreground flex-1">{doc.title}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => removeDocumentFromDocument(rootId, doc.id)}
                                    >
                                      <X className="w-3 h-3 text-muted-foreground" />
                                    </Button>
                                  </div>
                                ))}

                                {/* Link Task or Doc - triggers tabs */}
                                <Button
                                  variant="ghost"
                                  className="flex items-center justify-start gap-2 py-1.5 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded w-full text-left h-auto font-normal"
                                  onClick={() => setShowRelationshipTabs(true)}
                                >
                                  <Plus className="w-4 h-4" />
                                  <span className="text-sm">Link Task or Doc</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    // Show Add Relationship button when no relationships exist
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 shadow-sm" data-testid="add-linked-items-trigger">
                          <Plus className="w-4 h-4 text-muted-foreground" />
                          Add Linked Items
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-80 p-0" align="start">
                        <div className="flex border-b border-border px-1 pt-1">
                          <div className="flex border-b border-border px-1 pt-1">
                            <Button
                              variant="ghost"
                              onClick={() => setActiveTab("project")}
                              className={`px-2 py-2 text-sm font-medium transition-colors rounded-none h-auto ${activeTab === "project"
                                ? "text-foreground border-b-2 border-primary -mb-[2px]"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                              data-testid="relationship-tab-project"
                            >
                              Project
                            </Button>

                            <Button
                              variant="ghost"
                              onClick={() => setActiveTab("portfolio")}
                              className={`px-2 py-2 text-sm font-medium transition-colors rounded-none h-auto ${activeTab === "portfolio"
                                ? "text-foreground border-b-2 border-primary -mb-[2px]"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                              data-testid="relationship-tab-portfolio"
                            >
                              Portfolio
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setActiveTab("document")}
                              className={`px-2 py-2 text-sm font-medium transition-colors rounded-none h-auto ${activeTab === "document"
                                ? "text-foreground border-b-2 border-primary -mb-[2px]"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                              data-testid="relationship-tab-document"
                            >
                              Documents
                            </Button>
                          </div>
                        </div>

                        <div className="p-2">
                          {/* Empty State Image Logic */}
                          {(() => {
                            const isEmpty = (activeTab === "project" && projects.length === 0) ||

                              (activeTab === "portfolio" && portfolios.length === 0) ||
                              (activeTab === "document" && docList.length === 0);

                            if (!isEmpty) return null;

                            const config = {
                              project: {
                                image: "/images/project.svg",
                                title: "No Project found",
                                desc: "Please create a project in the Project section first, then return here to link it."
                              },
                              portfolio: {
                                image: "/images/portfolio-image.svg",
                                title: "No Portfolio found",
                                desc: "Please create a portfolio in the Portfolio section first, then return here to link it."
                              },
                              team: {
                                image: "/images/TeamsEmpty.svg",
                                title: "No Team found",
                                desc: "Please create a team in the Team section first, then return here to link it."
                              },
                              document: {
                                image: "/images/docs-image.png",
                                title: "No Document found",
                                desc: "Please create a document in the Document section first, then return here to link it."
                              }
                            };

                            return (
                              <div className="py-8 flex flex-col items-center justify-center text-center px-4">
                                <img
                                  src={config[activeTab].image}
                                  alt={config[activeTab].title}
                                  className="w-60 h-32 mb-4 opacity-80"
                                />
                                <h3 className="text-lg font-semibold text-foreground mb-1 leading-tight">
                                  {config[activeTab].title}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-normal max-w-[240px]">
                                  {config[activeTab].desc}
                                </p>
                              </div>
                            );
                          })()}

                          {activeTab === "project" && projects.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-3">Recent Projects</p>
                              <div className="max-h-60 overflow-y-auto">
                                {projects.map((project) => {
                                  const isSelected = selectedProjects.includes(project.id!);

                                  return (
                                    <div
                                      key={project.id}
                                      className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-muted" : "hover:bg-muted/50"
                                        }`}
                                      onClick={() => {
                                        if (isSelected) {
                                          handleRemoveProject(project.id!);
                                        } else {
                                          handleAddProject(project.id!);
                                        }
                                      }}
                                    >

                                      {(() => {
                                        const avatar = getProjectAvatar(project);
                                        return (
                                          <div
                                            className="w-5 h-5 rounded shrink-0 flex items-center justify-center overflow-hidden"
                                            style={{ backgroundColor: avatar?.type === "icon" ? (avatar.color + "20") : (project?.color ? project.color + "20" : "#3B82F620") }}
                                          >
                                            {avatar?.type === "image" ? (
                                              <img src={avatar.src} alt={project?.name} className="w-full h-full object-cover rounded" />
                                            ) : avatar?.type === "icon" ? (
                                              (() => {
                                                const iconObj = iconLibrary.find((i: any) => i.name?.toLowerCase() === avatar.name?.toLowerCase());
                                                if (iconObj) {
                                                  const IconComponent = iconObj.icon;
                                                  return <IconComponent size={10} color={avatar.color} />;
                                                }
                                                return <span className="text-[9px] font-bold" style={{ color: project?.color ?? "#3B82F6" }}>{project?.name?.charAt(0).toUpperCase()}</span>;
                                              })()
                                            ) : (
                                              <span className="text-[9px] font-bold" style={{ color: project?.color ?? "#3B82F6" }}>{project?.name?.charAt(0).toUpperCase()}</span>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      <span className="text-sm text-foreground flex-1">
                                        {project.name}
                                      </span>
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            handleAddProject(project.id!);
                                          } else {
                                            handleRemoveProject(project.id!);
                                          }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        data-testid={`checkbox-link-project-${project.id}`}
                                      />

                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {activeTab === "portfolio" && portfolios.length > 0 && (
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {portfolios.map((p) => {
                                const isSelected = currentDoc?.pageLinkedPortfolios?.includes(p.id!);
                                return (
                                  <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted cursor-pointer" onClick={() => isSelected ? handleRemovePortfolio(item.id, p.id!) : handleAddPortfolio(item.id, p.id!)}>
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div
                                        className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                                        style={{ backgroundColor: p.color || "#9333ea" }}
                                      >
                                        {p.name?.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-xs text-foreground truncate">{p.name}</span>
                                    </div>
                                    <Checkbox checked={isSelected} className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary" data-testid={`doc-sidebar-link-checkbox-portfolio-${p.id}`} />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {activeTab === "document" && docList.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-3">Recent Documents</p>
                              <div className="space-y-1 max-h-60 overflow-y-auto">
                                {docList.map((doc) => {
                                  const isSelected = selectedDocuments.includes(doc.id);

                                  return (
                                    <div
                                      key={doc.id}
                                      className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-muted" : "hover:bg-muted/50"
                                        }`}
                                      onClick={() => {
                                        if (isSelected) {
                                          handleRemoveDocument(doc.id);
                                        } else {
                                          handleAddDocument(doc.id);
                                        }
                                      }}
                                    >

                                      <span className="text-sm text-foreground flex-1">
                                        {doc.title}
                                      </span>
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            handleAddDocument(doc.id);
                                          } else {
                                            handleRemoveDocument(doc.id);
                                          }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        data-testid={`checkbox-link-document-${doc.id}`}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })()}

          </div>



          {/* Editor */}
          <div className="pb-20 relative min-h-[400px]">
            {isValidDocId && token && (syncStatus === 'connecting' || syncStatus === 'connected' || syncStatus === 'disconnected') && syncStatus !== 'synced' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                <div className="flex flex-col items-center gap-2">
                  <Spinner className="w-8 h-8 text-primary" />
                  <span className="text-sm text-muted-foreground font-medium">Loading document...</span>
                </div>
              </div>
            ) : null}
            <BlockNoteView
              key={`${docId}-${syncStatus === 'synced' ? "synced" : "local"}-${editorTheme}`}
              editor={editor}
              theme={editorTheme}
              editable={!isLockedByBackend}
            />
          </div>
        </div>
      </div>
    </div>
  );
}