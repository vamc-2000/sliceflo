

"use client";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import {
  Share2, Tag, MessageSquareText, SquareArrowOutUpRight,
  Expand, MoreHorizontal, X, Edit, Copy, Star, Link,
  FileText, Zap, Download, Upload, History, Activity,
  Bell, Lock, Globe, Archive, Trash2, Shield, ChevronLeft, ChevronRight,
  CopyPlus, Link as LinkIcon, Plus,
  MessageCircle,
  AtSign,
  Hash,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useDocStore } from "@/stores/useDoc-store";
import { useTeamStore } from "@/stores/teams-store";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useProjectsStore } from "@/stores/projects-store";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/sonner";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  type DocumentRecord,
} from "@/lib/api/documents-api";

import { use } from "react";
import { iconLibrary } from "@/components/ColorIconPicker";

export default function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const searchParams = useSearchParams();
  const fromProject = searchParams.get("from");
  const fromProjectId = searchParams.get("projectId");
  const resolvedParams = use(params);
  const docId = resolvedParams.id;

  const documents = useDocStore((state) => state.documents);
  const activeDocId = useDocStore((state) => state.activeDocId);
  const updateDocument = useDocStore((state) => state.updateDocument);
  const deleteDocument = useDocStore((state) => state.deleteDocument);
  const addProjectToDocument = useDocStore((state) => state.addProjectToDocument);
  const removeProjectFromDocument = useDocStore((state) => state.removeProjectFromDocument);
  const addTeamToDocument = useDocStore((state) => state.addTeamToDocument);
  const removeTeamFromDocument = useDocStore((state) => state.removeTeamFromDocument);
  const addPortfolioToDocument = useDocStore((state) => state.addPortfolioToDocument);
  const removePortfolioFromDocument = useDocStore((state) => state.removePortfolioFromDocument);
  const addDocumentToDocument = useDocStore((state) => state.addDocumentToDocument);
  const removeDocumentFromDocument = useDocStore((state) => state.removeDocumentFromDocument);
  const getDocument = useDocStore((state) => state.getDocument);
  const loadDocuments = useDocStore((state) => state.loadDocuments);
  const editingTitleId = useDocStore((state) => state.editingTitleId);
  const clearTitleEdit = useDocStore((state) => state.clearTitleEdit);
  const setActiveDoc = useDocStore((state) => state.setActiveDoc);
  const toggleComments = useDocStore((state) => state.toggleComments);
  const togglePageDetails = useDocStore((state) => state.togglePageDetails);
  const fetchDocument = useDocStore((state) => state.fetchDocument);
  const fetchChildren = useDocStore((state) => state.fetchChildren);
  const lockDoc = useDocStore((state) => state.lockDoc);
  const unlockDoc = useDocStore((state) => state.unlockDoc);
  const toggleFavorite = useDocStore((state) => state.toggleFavorite);
  const createDoc = useDocStore((state) => state.createDoc);

  const teams = useTeamStore((state) => state.teams);
  const fetchTeams = useTeamStore((state) => state.fetchTeams);
  const projects = useProjectsStore((state) => state.projects);
  const fetchProjects = useProjectsStore((state) => state.fetchProjects);
  const portfolios = usePortfoliosStore((state) => state.portfolios);
  const fetchPortfolios = usePortfoliosStore((state) => state.fetchPortfolios);



  const docList = Array.from(documents.values()).filter(doc => !doc.parentId && doc.id !== id);

  // Get the root document
  const getRootDocument = (docId: string | null): string | null => {
    if (!docId) return null;
    const doc = documents.get(docId);
    if (!doc) return null;
    if (!doc.parentId) return docId;
    return getRootDocument(doc.parentId);
  };

  const rootId = getRootDocument(id);
  const rootDoc = rootId ? documents.get(rootId) : null;
  /** The note/page actually open in the URL — navbar title must follow this, not always the root. */
  const currentPageDoc = id && /^[a-fA-F0-9]{24}$/.test(id) ? documents.get(id) : null;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isPublicSharing, setIsPublicSharing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  // Relationship linking state (kept showLinkTabs for UI toggle)
  const [activeTab, setActiveTab] = useState<"project" | "team" | "portfolio" | "document">("project");
  const [showLinkTabs, setShowLinkTabs] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [isPageLocked, setIsPageLocked] = useState(false);
  const [isDocumentLocked, setIsDocumentLocked] = useState(false);

  // Expand/Collapse functions from sidebar
  const [expandAllFn, setExpandAllFn] = useState<(() => void) | null>(null);
  const [collapseAllFn, setCollapseAllFn] = useState<(() => void) | null>(null);

  // Editable title state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleCollapseSidebar = useCallback(() => {
    setIsSidebarCollapsed(true);
  }, []);



  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string } | null>(null);

  // Load current doc and its tree into store when opening a doc page (so sidebar has data)
  // Teams/projects/portfolios are fetched only when user opens "Link Document to" or badge dropdown
  useEffect(() => {
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) return;
    let cancelled = false;

    const fetchFullSubtree = async (rootNoteId: string) => {
      const visited = new Set<string>();
      const queue: string[] = [rootNoteId];

      while (queue.length > 0) {
        const parentId = queue.shift()!;
        if (visited.has(parentId)) continue;
        visited.add(parentId);

        await fetchChildren(parentId);
        if (cancelled) return;
        
        const children = Array.from(documents.values()).filter(d => d.parentId === parentId);
        children.forEach((child) => {
          if (child?.id && !visited.has(child.id)) queue.push(child.id);
        });
      }
    };

    (async () => {
      try {
        const doc = await fetchDocument(id);
        if (cancelled || !doc) return;
        setActiveDoc(id);

        // Always load the complete tree for the selected root.
        let rootNoteId = doc.rootId || id;
        
        // If we don't have ancestors, we might need to fetch them, 
        // but for now let's assume rootId is enough or fallback to id.
        if (rootNoteId && rootNoteId !== id) {
          await fetchDocument(rootNoteId);
        }
        await fetchFullSubtree(rootNoteId);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, loadDocuments, setActiveDoc]);

  const triggerExport = useDocStore((state) => state.triggerExport);
  const handleExport = (scope: 'page' | 'all', format: 'pdf' | 'html' | 'markdown') => {
    if (scope === 'all') {
      toast("warning", { title: "Exporting all pages is coming soon!" });
      return;
    }
    triggerExport(scope, format);
  };

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showBadgeDropdown, setShowBadgeDropdown] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      const timeout = setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [isEditingTitle]);

  // Listen for title edit from store (e.g. sidebar rename for any page in this tree)
  // useEffect(() => {
  //   if (editingTitleId && id && editingTitleId === id) {
  //     setIsEditingTitle(true);
  //     const d = documents.get(id);
  //     if (d) setTitleValue(d.title);
  //     clearTitleEdit();
  //   }
  // }, [editingTitleId, id, documents, clearTitleEdit]);

  useEffect(() => {
    if (!editingTitleId) return;
    // Triggered when sidebar calls triggerTitleEdit(rootId)
    if (editingTitleId === rootId) {
      setIsEditingTitle(true);
      if (rootDoc) setTitleValue(rootDoc.title);
      clearTitleEdit();
    }
  }, [editingTitleId, rootId, rootDoc, documents, clearTitleEdit]);

  // const handleDragOver = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   setIsDragging(true);
  // };

  // const handleDragLeave = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   setIsDragging(false);
  // };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDragLeave = (e: React.DragEvent) => e.preventDefault();

  // const handleDrop = (e: React.DragEvent) => {
  //   e.preventDefault();
  //   setIsDragging(false);
  //   const files = Array.from(e.dataTransfer.files);
  //   const validFiles = files.filter(file =>
  //     ['.pdf', '.txt', '.md', '.html'].some(ext =>
  //       file.name.toLowerCase().endsWith(ext)
  //     )
  //   );
  //   setSelectedFiles(prev => [...prev, ...validFiles]);
  // };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleClose = () => {
    const from = searchParams.get("from");
    const portfolioId = searchParams.get("portfolioId");
    const projectId = searchParams.get("projectId");

    if (from === "project" && projectId) {
      router.push(`/project/${projectId}`);
    } else if (from === "portfolio" && portfolioId) {
      router.push(`/portfolio/${portfolioId}`);
    } else {
      router.push("/docs");
    }
  };

  // const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files) {
  //     const validFiles = Array.from(e.target.files).filter(file =>
  //       ['.pdf', '.txt', '.md', '.html'].some(ext =>
  //         file.name.toLowerCase().endsWith(ext)
  //       )
  //     );
  //     setSelectedFiles(prev => [...prev, ...validFiles]);
  //   }
  // };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // const handleUpload = () => {
  //   if (selectedFiles.length === 0) return;

  //   setIsUploading(true);

  //   // Simulate upload with UI feedback only
  //   setTimeout(() => {
  //     toast.success('Files imported successfully!');
  //     setSelectedFiles([]);
  //     setIsUploading(false);
  //   }, 2000);
  // };
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const toastId = toast("info", { title: `Uploading ${selectedFiles.length} files...` });

    try {
      // We map over each file and call your uploadFile function
      const uploadPromises = selectedFiles.map(async (file) => {
        // Calling your logic here
        if (!docId) throw new Error("Missing docId");

        const { uploadFile: apiUploadFile, getUpload } = await import("@/lib/api/uploads-api");
        const uploadRes = await apiUploadFile(file);

        if (!uploadRes.url) throw new Error("Upload did not return s3Key");

        const fullUpload = await getUpload(uploadRes.id) as any;
        if (fullUpload?.presignedUrl) {
          return fullUpload.presignedUrl;
        }

        const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/$/, "");
        const s3Key = encodeURIComponent(uploadRes.url);
        return `${apiBaseUrl}/uploads/presigned?s3Key=${s3Key}`;
      });

      const results = await Promise.all(uploadPromises);

      toast("success", { title: "All files imported successfully!" });
      setSelectedFiles([]); // Clear list after success
    } catch (error) {
      console.error(error);
      toast("error", { title: "Failed to upload some files" });
    } finally {
      setIsUploading(false);
    }
  };




  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const selectDoc = (id: string) => {
    setActiveDoc(id);
    router.push(`/docs/${id}`);
  };

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleAddProject = (projectId: string) => {
    if (!rootId) return;
    addProjectToDocument(rootId, projectId);
    setShowLinkTabs(false);
    setShowBadgeDropdown(false);
  };

  const handleRemoveProject = (projectId: string) => {
    if (!rootId) return;
    removeProjectFromDocument(rootId, projectId);
  };

  const handleAddTeam = (teamId: string) => {
    if (!rootId) return;
    addTeamToDocument(rootId, teamId);
    setShowLinkTabs(false);
    setShowBadgeDropdown(false);
  };

  const handleRemoveTeam = (teamId: string) => {
    if (!rootId) return;
    removeTeamFromDocument(rootId, teamId);
  };

  const handleAddPortfolio = (portfolioId: string) => {
    if (!rootId) return;
    addPortfolioToDocument(rootId, portfolioId);
    setShowLinkTabs(false);
    setShowBadgeDropdown(false);
  };

  const handleRemovePortfolio = (portfolioId: string) => {
    if (!rootId) return;
    removePortfolioFromDocument(rootId, portfolioId);
  };

  const handleAddDocument = (linkedDocId: string) => {
    if (!rootId) return;
    addDocumentToDocument(rootId, linkedDocId);
    setShowLinkTabs(false);
  };

  const handleRemoveDocument = (linkedDocId: string) => {
    if (!rootId) return;
    removeDocumentFromDocument(rootId, linkedDocId);
  };


  const handleMenuAction = (
    action: string,
    id: string,
    title: string,
    value?: boolean
  ) => {
    switch (action) {
      case "lock":
        {
          const newLocked = !!value;
          setIsLocked(newLocked);
          (newLocked ? lockDoc(id) : unlockDoc(id));
        }
        break;
      case "lock-document":
        {
          const newDocLocked = !!value;
          setIsDocumentLocked(newDocLocked);
          (newDocLocked ? lockDoc(id) : unlockDoc(id));
        }
        break;

      case "rename":
        startEditing(id, title);
        break;
      case "lock-page": {
        const newLocked = !!value;
        setIsPageLocked(newLocked);
        (newLocked ? lockDoc(id) : unlockDoc(id));
        break;
      }

      // case "duplicate":
      //   const newId = `${id}-copy-${Date.now()}`;
      //   const doc = documents.get(id);
      //   if (doc) {
      //     addDocument({
      //       ...doc,
      //       id: newId,
      //       title: `${doc.title} (Copy)`,
      //     });
      //   }
      //   break;

      case "copy-link":
        navigator.clipboard.writeText(
          `${window.location.origin}/docs/${id}`
        );
        break;
      case "delete":
        setItemToDelete({ id, title });
        setIsDeleteModalOpen(true);
        break;
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteDocument(itemToDelete.id);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
    router.push("/docs");
  };

  // Title editing handlers (edit the **current page** from the route, not always root)
  // const startEditingTitle = () => {
  //   if (currentPageDoc && id) {
  //     setIsEditingTitle(true);
  //     setTitleValue(currentPageDoc.title);
  //   }
  // };
  const startEditingTitle = () => {
    if (rootDoc && rootId) {
      setIsEditingTitle(true);
      setTitleValue(rootDoc.title);
    }
  };

  // const saveTitleEdit = async () => {
  //   if (!id || !/^[a-fA-F0-9]{24}$/.test(id) || !titleValue.trim()) {
  //     setIsEditingTitle(false);
  //     setTitleValue("");
  //     return;
  //   }
  //   const newTitle = titleValue.trim();
  //   try {
  //     const res = await updateDocumentApi(id, { title: newTitle });
  //     updateDocument(id, res ? (res as any) : { title: newTitle });
  //   } catch {
  //     toast.error("Failed to update title");
  //   }
  //   setIsEditingTitle(false);
  //   setTitleValue("");
  // };
  const saveTitleEdit = async () => {
    if (!rootId || !titleValue.trim()) {
      setIsEditingTitle(false);
      setTitleValue("");
      return;
    }
    const newTitle = titleValue.trim();
    await updateDocument(rootId, { title: newTitle });
    setIsEditingTitle(false);
    setTitleValue("");
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveTitleEdit();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
      setTitleValue("");
    }
  };

  const getProjectAvatar = (project: any) => {
    if (!project?.icon) return null;
    if (project.icon.type === "file") return { type: "image", src: project.icon.presignedUrl };
    if (project.icon.type === "icon") return { type: "icon", name: project.icon.name, color: project.icon.color ?? "#6B7280" };
    return null;
  };
  // return (
  //   <div className="h-screen flex flex-col overflow-hidden">
  //     {/* Fixed Breadcrumb */}
  //     <div className="border-b shrink-0 no-print">
  //       <Breadcrumbs />
  //     </div>

  //     {/* Fixed Top Navbar with Action Buttons */}
  //     <div className="h-14 border-b bg-background px-4 flex items-center justify-between shrink-0 no-print">
  //       <div className="flex items-center gap-2">

  //         {/* Title with icon */}
  //         <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
  //           <img
  //             src="/images/DocsIcon.svg"
  //             className="w-5 h-5 flex-shrink-0"
  //             style={{ filter: "brightness(0.3)" }}
  //             alt="Docs"
  //           />
  //           {isEditingTitle ? (
  //             <Input
  //               ref={titleInputRef}
  //               type="text"
  //               value={titleValue}
  //               onChange={(e) => setTitleValue(e.target.value)}
  //               onBlur={saveTitleEdit}
  //               onKeyDown={handleTitleKeyDown}
  //               className="text-sm font-semibold h-7 px-2 py-1 focus-visible:ring-0 border-none bg-transparent shadow-none"
  //               onClick={(e) => e.stopPropagation()}
  //             />
  //           ) : (
  //             <span
  //               className="text-sm font-semibold text-[#1C1C1E] truncate min-w-[20px]"
  //               onDoubleClick={startEditingTitle}
  //             >
  //               {rootDoc?.title || ""}
  //             </span>
  //           )}
  //         </div>

  //         {(() => {
  //           const totalLinks =
  //             (rootDoc?.linkedProjects?.length || 0) +
  //             (rootDoc?.linkedTeams?.length || 0) +
  //             (rootDoc?.linkedPortfolios?.length || 0) +
  //             (rootDoc?.linkedDocuments?.length || 0);
  //           if (totalLinks === 0) return null;
  //           return (
  //             <DropdownMenu open={showBadgeDropdown} onOpenChange={setShowBadgeDropdown}>
  //               <DropdownMenuTrigger asChild>
  //                 <button
  //                   className="flex items-center bg-[#fdf2e9] text-[#F68C1F] border border-[#F68C1F] min-w-[1.125rem] h-[1.125rem] px-1 rounded-sm text-[10px] font-bold justify-center hover:bg-[#fef5ed] transition-colors cursor-pointer"
  //                   title="View linked items"
  //                 >
  //                   {totalLinks}
  //                 </button>
  //               </DropdownMenuTrigger>
  //               <DropdownMenuContent align="start" className="w-80 p-0">
  //                 {(() => {
  //                   const doc = rootDoc;
  //                   const linkedProjectsList = doc?.linkedProjects?.map(id => projects.find(p => p.id === id)).filter(Boolean) || [];
  //                   // const linkedTeamsList = doc?.linkedTeams?.map(id => teams.find(t => t.id === id)).filter(Boolean) || [];
  //                   const linkedPortfoliosList = doc?.linkedPortfolios?.map(id => portfolios.find(p => p.id === id)).filter(Boolean) || [];
  //                   const linkedDocumentsList = doc?.linkedDocuments?.map(id => documents.get(id)).filter(Boolean) || [];
  //                   const hasLinks = linkedProjectsList.length > 0 || linkedPortfoliosList.length > 0 || linkedDocumentsList.length > 0;

  //                   if (hasLinks && !showLinkTabs) return (
  //                     <div className="p-2 space-y-1">
  //                       <div className="flex items-center justify-between px-2 py-1 mb-1">
  //                         <span className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Linked Items</span>
  //                         <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setShowLinkTabs(true); }}>
  //                           <Plus className="w-4 h-4 text-gray-500" />
  //                         </Button>
  //                       </div>
  //                       <div className="space-y-1 bg-gray-50 rounded-lg p-1.5">
  //                         {linkedProjectsList.map((p: any) => {
  //                           const avatar = getProjectAvatar(p);
  //                           return (
  //                             <div key={p?.id} className="flex items-center gap-2 py-1 px-2 bg-white rounded shadow-sm group">
  //                               {/* Project Icon */}
  //                               <div
  //                                 className="w-5 h-5 rounded shrink-0 flex items-center justify-center overflow-hidden"
  //                                 style={{ backgroundColor: avatar?.type === "icon" ? (avatar.color + "20") : (p?.color ? p.color + "20" : "#3B82F620") }}
  //                               >
  //                                 {avatar?.type === "image" ? (
  //                                   <img src={avatar.src} alt={p?.name} className="w-full h-full object-cover rounded" />
  //                                 ) : avatar?.type === "icon" ? (
  //                                   (() => {
  //                                     const iconObj = iconLibrary.find((i: any) => i.name === avatar.name);
  //                                     if (iconObj) {
  //                                       const IconComponent = iconObj.icon;
  //                                       return <IconComponent size={10} color={avatar.color} />;
  //                                     }
  //                                     return <span className="text-[9px] font-bold" style={{ color: p?.color ?? "#3B82F6" }}>{p?.name?.charAt(0).toUpperCase()}</span>;
  //                                   })()
  //                                 ) : (
  //                                   <span className="text-[9px] font-bold" style={{ color: p?.color ?? "#3B82F6" }}>{p?.name?.charAt(0).toUpperCase()}</span>
  //                                 )}
  //                               </div>
  //                               <span className="text-xs text-gray-700 flex-1 truncate">{p?.name}</span>
  //                               <Button
  //                                 variant="ghost"
  //                                 size="sm"
  //                                 className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
  //                                 onClick={(e) => { e.stopPropagation(); handleRemoveProject(p?.id!); }}
  //                               >
  //                                 <X className="w-3 h-3" />
  //                               </Button>
  //                             </div>
  //                           );
  //                         })}
  //                         {/* {linkedTeamsList.map((t: any) => (
  //                           <div key={t?.id} className="flex items-center gap-2 py-1 px-2 bg-white rounded shadow-sm group">
  //                             <span className="text-sm">👥</span>
  //                             <span className="text-xs text-gray-700 flex-1 truncate">{t?.name}</span>
  //                             <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemoveTeam(t?.id!); }}>
  //                               <X className="w-3 h-3" />
  //                             </Button>
  //                           </div>
  //                         ))} */}
  //                         {linkedPortfoliosList.map((p: any) => (
  //                           <div key={p?.id} className="flex items-center gap-2 py-1 px-2 bg-white rounded shadow-sm group">
  //                             <span className="text-sm">💼</span>
  //                             <span className="text-xs text-gray-700 flex-1 truncate">{p?.name}</span>
  //                             <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemovePortfolio(p?.id!); }}>
  //                               <X className="w-3 h-3" />
  //                             </Button>
  //                           </div>
  //                         ))}
  //                         {linkedDocumentsList.map((d: any) => (
  //                           <div key={d?.id} className="flex items-center gap-2 py-1 px-2 bg-white rounded shadow-sm group">
  //                             <span className="text-sm">📄</span>
  //                             <span className="text-xs text-gray-700 flex-1 truncate">{d?.title}</span>
  //                             <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemoveDocument(d?.id); }}>
  //                               <X className="w-3 h-3" />
  //                             </Button>
  //                           </div>
  //                         ))}
  //                       </div>
  //                       <Button variant="ghost" className="flex items-center justify-start gap-2 py-1 px-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded w-full text-left h-auto font-normal" onClick={(e) => { e.stopPropagation(); setShowLinkTabs(true); }}>
  //                         <Plus className="w-3 h-3" />
  //                         <span className="text-xs">Add Linked Items</span>
  //                       </Button>
  //                     </div>
  //                   );

  //                   // Tabs view
  //                   return (
  //                     <div>
  //                       <div className="flex border-b border-gray-200 px-1 pt-1">
  //                         {["project", "portfolio", "document"].map((tab) => (
  //                           <Button key={tab} variant="ghost" onClick={() => setActiveTab(tab as any)}
  //                             className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === tab ? "text-gray-900 border-b-2 border-black -mb-0.5" : "text-gray-500 hover:text-gray-700"}`}>
  //                             {tab.charAt(0).toUpperCase() + tab.slice(1)}
  //                           </Button>
  //                         ))}
  //                         {hasLinks && (
  //                           <Button variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setShowLinkTabs(false); }}>
  //                             <ChevronLeft className="w-3.5 h-3.5" />
  //                           </Button>
  //                         )}
  //                       </div>
  //                       <div className="p-3">
  //                         {(() => {
  //                           const config = {
  //                             project: { image: "/images/project.svg", title: "No Project found", list: projects },
  //                             portfolio: { image: "/images/portfolio-image.svg", title: "No Portfolio found", list: portfolios },
  //                             team: { image: "/images/TeamsEmpty.svg", title: "No Team found", list: teams },
  //                             document: { image: "/images/docs-image.png", title: "No Document found", list: docList }
  //                           };

  //                           const current = config[activeTab as keyof typeof config];

  //                           if (!current.list || current.list.length === 0) {
  //                             return (
  //                               <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
  //                                 <img src={current.image} alt={current.title} className="w-16 h-16 mb-3 object-contain opacity-50" />
  //                                 <p className="text-xs text-gray-400 font-medium">{current.title}</p>
  //                               </div>
  //                             );
  //                           }

  //                           return (
  //                             <div className="max-h-40 overflow-y-auto space-y-1">
  //                               {activeTab === "project" && projects.map(p => {
  //                                 const isSelected = doc?.linkedProjects?.includes(p.id!);
  //                                 const avatar = getProjectAvatar(p);
  //                                 return (
  //                                   <div
  //                                     key={p.id}
  //                                     className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer"
  //                                     onClick={() => isSelected ? handleRemoveProject(p.id!) : handleAddProject(p.id!)}
  //                                   >
  //                                     <div className="flex items-center gap-2 min-w-0">
  //                                       {/* Project Icon */}
  //                                       <div
  //                                         className="w-5 h-5 rounded shrink-0 flex items-center justify-center overflow-hidden"
  //                                         style={{ backgroundColor: avatar?.type === "icon" ? (avatar.color + "20") : (p.color ? p.color + "20" : "#3B82F620") }}
  //                                       >
  //                                         {avatar?.type === "image" ? (
  //                                           <img src={avatar.src} alt={p.name} className="w-full h-full object-cover rounded" />
  //                                         ) : avatar?.type === "icon" ? (
  //                                           (() => {
  //                                             const iconObj = iconLibrary.find((i: any) => i.name === avatar.name);
  //                                             if (iconObj) {
  //                                               const IconComponent = iconObj.icon;
  //                                               return <IconComponent size={12} color={avatar.color} />;
  //                                             }
  //                                             return <span className="text-[10px] font-bold" style={{ color: p.color ?? "#3B82F6" }}>{p.name?.charAt(0).toUpperCase()}</span>;
  //                                           })()
  //                                         ) : (
  //                                           <span className="text-[10px] font-bold" style={{ color: p.color ?? "#3B82F6" }}>{p.name?.charAt(0).toUpperCase()}</span>
  //                                         )}
  //                                       </div>
  //                                       <span className="text-xs text-gray-700 truncate">{p.name}</span>
  //                                     </div>
  //                                     <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
  //                                   </div>
  //                                 );
  //                               })}
  //                               {activeTab === "team" && teams.map(t => {
  //                                 const isSelected = doc?.linkedTeams?.includes(t.id!);
  //                                 return (
  //                                   <div key={t.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => isSelected ? handleRemoveTeam(t.id!) : handleAddTeam(t.id!)}>
  //                                     <span className="text-xs text-gray-700 truncate">{t.name}</span>
  //                                     <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
  //                                   </div>
  //                                 );
  //                               })}
  //                               {activeTab === "portfolio" && portfolios.map(p => {
  //                                 const isSelected = doc?.linkedPortfolios?.includes(p.id);
  //                                 return (
  //                                   <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => isSelected ? handleRemovePortfolio(p.id) : handleAddPortfolio(p.id)}>
  //                                     <span className="text-xs text-gray-700 truncate">{p.name}</span>
  //                                     <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
  //                                   </div>
  //                                 );
  //                               })}
  //                               {activeTab === "document" && docList.map(d => {
  //                                 const isSelected = doc?.linkedDocuments?.includes(d.id);
  //                                 return (
  //                                   <div key={d.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => isSelected ? handleRemoveDocument(d.id) : handleAddDocument(d.id)}>
  //                                     <span className="text-xs text-gray-700 truncate">{d.title}</span>
  //                                     <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
  //                                   </div>
  //                                 );
  //                               })}
  //                             </div>
  //                           );
  //                         })()}
  //                       </div>
  //                     </div>
  //                   );
  //                 })()}
  //               </DropdownMenuContent>
  //             </DropdownMenu>
  //           );
  //         })()}
  //         <div className="flex items-center gap-0.5 ml-1">
  //           <Button
  //             variant="ghost"
  //             size="icon"
  //             onClick={() => collapseAllFn?.()}
  //             className="h-6 w-6 text-[#8E8E93] hover:bg-gray-100 p-1"
  //             title="Collapse all"
  //             disabled={!collapseAllFn}
  //           >
  //             <img src="/images/docsChevronUp.svg" className="w-3 h-3" alt="Collapse all" />
  //           </Button>
  //           <Button
  //             variant="ghost"
  //             size="icon"
  //             onClick={() => expandAllFn?.()}
  //             className="h-6 w-6 text-[#8E8E93] hover:bg-gray-100 p-1"
  //             title="Expand all"
  //             disabled={!expandAllFn}
  //           >
  //             <img src="/images/docsChevronDown.svg" className="w-3 h-3" alt="Expand all" />
  //           </Button>
  //         </div>

  //       </div>

  //       {/* Action Buttons - Right Side */}
  //       <div className="flex items-center gap-2">
  
  //         {/* Open in new window */}
  //         <Button
  //           variant="ghost"
  //           size="icon"
  //           className="p-3"
  //           title="Open in new window"
  //           onClick={() => window.open(`/docs/${id}`, "_blank")}
  //         >
  //           <SquareArrowOutUpRight className="w-4 h-4 text-gray-600" />
  //         </Button>

  //         {/* Fullscreen Icon */}
  //         <Button
  //           variant="ghost"
  //           size="icon"
  //           onClick={toggleFullscreen}
  //           className="p-3"
  //           title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
  //         >
  //           <Expand className="w-4 h-4 text-gray-600" />
  //         </Button>

  //         {/* More Options Dropdown (3 dots) */}
  //         <DropdownMenu>
  //           <DropdownMenuTrigger asChild>
  //             <Button
  //               variant="ghost"
  //               size="icon"
  //               className="p-3"
  //               title="More options"
  //             >
  //               <MoreHorizontal className="w-4 h-4 text-gray-600" />
  //             </Button>
  //           </DropdownMenuTrigger>
  //           <DropdownMenuContent align="end" className="w-64">
  //             {/* Header */}
  //             <DropdownMenuLabel className="text-xs font-semibold text-white text-center mx-1 mt-1 mb-2 px-8 py-2 rounded-lg bg-[#001F3F]">
  //               Sharing & Permissions
  //             </DropdownMenuLabel>

  //             {/* Menu Items */}
  //             <DropdownMenuItem onClick={startEditingTitle}>
  //               <Edit className="w-4 h-4 mr-2" />
  //               <span>Rename</span>
  //             </DropdownMenuItem>

  //             <DropdownMenuItem
  //               onClick={() => {
  //                 const doc = documents.get(id);
  //                 if (!doc) return;
  //                 createDoc(`${doc.title} (Copy)`, doc.parentId)
  //                   .then((newId) => {
  //                     if (newId) {
  //                       router.push(`/docs/${newId}`);
  //                       toast("success", { title: "Document duplicated" });
  //                     }
  //                   })
  //                   .catch(() => toast("error", { title: "Failed to duplicate" }));
  //               }}
  //             >
  //               <Copy className="w-4 h-4 mr-2" />
  //               <span>Duplicate</span>
  //             </DropdownMenuItem>

  //             <DropdownMenuItem onClick={() => toggleFavorite(id)}>
  //               <Star className={`w-4 h-4 mr-2 ${currentPageDoc?.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
  //               <span>{currentPageDoc?.isFavorite ? "Remove from favorites" : "Add to favorites"}</span>
  //             </DropdownMenuItem>

  //             <DropdownMenuSeparator />



  //             <DropdownMenuSub>
  //               <DropdownMenuSubTrigger>
  //                 <Link className="w-4 h-4 mr-2" />
  //                 <span>Link Document to</span>
  //               </DropdownMenuSubTrigger>
  //               <DropdownMenuSubContent className="w-80 p-0">
  //                 {(() => {
  //                   const doc = rootDoc;
  //                   const linkedProjectsList = doc?.linkedProjects?.map(id => projects.find(p => p.id === id)).filter(Boolean) || [];
  //                   const linkedTeamsList = doc?.linkedTeams?.map(id => teams.find(t => t.id === id)).filter(Boolean) || [];
  //                   const linkedPortfoliosList = doc?.linkedPortfolios?.map(id => portfolios.find(p => p.id === id)).filter(Boolean) || [];
  //                   const linkedDocumentsList = doc?.linkedDocuments?.map(id => documents.get(id)).filter(Boolean) || [];

  //                   const hasLinks = linkedProjectsList.length > 0 || linkedTeamsList.length > 0 || linkedPortfoliosList.length > 0 || linkedDocumentsList.length > 0;

  //                   if (hasLinks && !showLinkTabs) {
  //                     return (
  //                       <div className="p-2 space-y-1">
  //                         <div className="flex items-center justify-between px-2 py-1 mb-1">
  //                           <span className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Linked Items</span>
  //                           <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setShowLinkTabs(true); }}>
  //                             <Plus className="w-4 h-4 text-gray-500" />
  //                           </Button>
  //                         </div>
  //                         <div className="space-y-1 bg-gray-50 rounded-lg p-1.5">
  //                           {linkedProjectsList.map((p: any) => {
  //                             const avatar = getProjectAvatar(p);
  //                             return (
  //                               <div key={p?.id} className="flex items-center gap-2 py-1 px-2 bg-white rounded shadow-sm group">
  //                                 {/* Project Icon */}
  //                                 <div
  //                                   className="w-5 h-5 rounded shrink-0 flex items-center justify-center overflow-hidden"
  //                                   style={{ backgroundColor: avatar?.type === "icon" ? (avatar.color + "20") : (p?.color ? p.color + "20" : "#3B82F620") }}
  //                                 >
  //                                   {avatar?.type === "image" ? (
  //                                     <img src={avatar.src} alt={p?.name} className="w-full h-full object-cover rounded" />
  //                                   ) : avatar?.type === "icon" ? (
  //                                     (() => {
  //                                       const iconObj = iconLibrary.find((i: any) => i.name?.toLowerCase() === avatar.name?.toLowerCase());
  //                                       if (iconObj) {
  //                                         const IconComponent = iconObj.icon;
  //                                         return (
  //                                           <div className="w-full h-full flex items-center justify-center">
  //                                             <IconComponent size={10} color={avatar.color} />
  //                                           </div>
  //                                         );
  //                                       }
  //                                       return <span className="text-[9px] font-bold" style={{ color: p?.color ?? "#3B82F6" }}>{p?.name?.charAt(0).toUpperCase()}</span>;
  //                                     })()
  //                                   ) : (
  //                                     <span className="text-[9px] font-bold" style={{ color: p?.color ?? "#3B82F6" }}>{p?.name?.charAt(0).toUpperCase()}</span>
  //                                   )}
  //                                 </div>
  //                                 <span className="text-xs text-gray-700 flex-1 truncate">{p?.name}</span>
  //                                 <Button
  //                                   variant="ghost"
  //                                   size="sm"
  //                                   className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
  //                                   onClick={(e) => { e.stopPropagation(); handleRemoveProject(p?.id!); }}
  //                                 >
  //                                   <X className="w-3 h-3" />
  //                                 </Button>
  //                               </div>
  //                             );
  //                           })}
  //                           {/* {linkedTeamsList.map(t => (
  //                             <div key={t?.id} className="flex items-center gap-2 py-1 px-2 bg-white rounded shadow-sm group">
  //                               <span className="text-sm">👥</span>
  //                               <span className="text-xs text-gray-700 flex-1 truncate">{t?.name}</span>
  //                               <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemoveTeam(t?.id!); }}>
  //                                 <X className="w-3 h-3" />
  //                               </Button>
  //                             </div>
  //                           ))} */}
  //                           {linkedPortfoliosList.map(p => (
  //                             <div key={p?.id} className="flex items-center gap-2 py-1 px-2 bg-white rounded shadow-sm group">
  //                               <span className="text-sm">📂</span>
  //                               <span className="text-xs text-gray-700 flex-1 truncate">{p?.name}</span>
  //                               <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemovePortfolio(p?.id!); }}>
  //                                 <X className="w-3 h-3" />
  //                               </Button>
  //                             </div>
  //                           ))}
  //                           {linkedDocumentsList.map((d: any) => (
  //                             <div key={d.id} className="flex items-center gap-2 py-1 px-2 bg-white rounded shadow-sm group">
  //                               <span className="text-sm">📄</span>
  //                               <span className="text-xs text-gray-700 flex-1 truncate">{d.title}</span>
  //                               <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemoveDocument(d.id); }}>
  //                                 <X className="w-3 h-3" />
  //                               </Button>
  //                             </div>
  //                           ))}
  //                           <Button
  //                             variant="ghost"
  //                             className="flex items-center justify-start gap-2 py-1 px-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded w-full text-left h-auto font-normal"
  //                             onClick={(e) => { e.stopPropagation(); setShowLinkTabs(true); }}
  //                           >
  //                             <Plus className="w-3 h-3" />
  //                             <span className="text-xs">Add Linked Items</span>
  //                           </Button>
  //                         </div>
  //                       </div>
  //                     );
  //                   }

  //                   // Otherwise show tabs
  //                   return (
  //                     <>
  //                       {/* Tabs Header */}
  //                       <div className="flex border-b border-gray-200 px-1 pt-1">
  //                         <Button
  //                           variant="ghost"
  //                           onClick={() => setActiveTab("project")}
  //                           className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "project" ? "text-gray-900 border-b-2 border-black -mb-0.5" : "text-gray-500 hover:text-gray-700"}`}
  //                         >
  //                           Project
  //                         </Button>
  //                         <Button
  //                           variant="ghost"
  //                           onClick={() => setActiveTab("portfolio")}
  //                           className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "portfolio" ? "text-gray-900 border-b-2 border-black -mb-0.5" : "text-gray-500 hover:text-gray-700"}`}
  //                         >
  //                           Portfolio
  //                         </Button>
  //                         {/* <Button
  //                           variant="ghost"
  //                           onClick={() => setActiveTab("team")}
  //                           className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "team" ? "text-gray-900 border-b-2 border-black -mb-0.5" : "text-gray-500 hover:text-gray-700"}`}
  //                         >
  //                           Team
  //                         </Button> */}
  //                         <Button
  //                           variant="ghost"
  //                           onClick={() => setActiveTab("document")}
  //                           className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "document" ? "text-gray-900 border-b-2 border-black -mb-0.5" : "text-gray-500 hover:text-gray-700"}`}
  //                         >
  //                           Documents
  //                         </Button>
  //                         {hasLinks && (
  //                           <Button variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setShowLinkTabs(false); }}>
  //                             <ChevronLeft className="w-3.5 h-3.5" />
  //                           </Button>
  //                         )}
  //                       </div>

  //                       {/* Tab Content */}
  //                       <div className="p-3">
  //                         {/* Empty State Logic */}
  //                         {(() => {
  //                           const isEmpty = (activeTab === "project" && projects.length === 0) ||
  //                             (activeTab === "team" && teams.length === 0) ||
  //                             (activeTab === "portfolio" && portfolios.length === 0) ||
  //                             (activeTab === "document" && docList.length === 0);

  //                           if (!isEmpty) return null;

  //                           const config = {
  //                             project: { image: "/images/project.svg", title: "No Project found" },
  //                             portfolio: { image: "/images/portfolio-image.svg", title: "No Portfolio found" },
  //                             team: { image: "/images/TeamsEmpty.svg", title: "No Team found" },
  //                             document: { image: "/images/docs-image.png", title: "No Document found" }
  //                           };

  //                           return (
  //                             <div className="py-2 flex flex-col items-center justify-center text-center px-4">
  //                               <img src={config[activeTab].image} alt={config[activeTab].title} className="w-40 h-24 mb-2 opacity-80" />
  //                               <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-tight">{config[activeTab].title}</h3>
  //                             </div>
  //                           );
  //                         })()}

  //                         {/* Project Tab */}
  //                         {activeTab === "project" && projects.length > 0 && (
  //                           <div className="max-h-40 overflow-y-auto space-y-1">
  //                             {projects.map((p) => {
  //                               const isSelected = doc?.linkedProjects?.includes(p.id!);
  //                               const avatar = getProjectAvatar(p);
  //                               return (
  //                                 <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer"
  //                                   onClick={() => isSelected ? handleRemoveProject(p.id!) : handleAddProject(p.id!)}>
  //                                   <div className="flex items-center gap-2 min-w-0">
  //                                     {/* Project Icon */}
  //                                     <div className="w-5 h-5 rounded shrink-0 flex items-center justify-center overflow-hidden"
  //                                       style={{ backgroundColor: avatar?.type === "icon" ? (avatar.color + "20") : (p.color ? p.color + "20" : "#3B82F620") }}
  //                                     >
  //                                       {avatar?.type === "image" ? (
  //                                         <img src={avatar.src} alt={p.name} className="w-full h-full object-cover rounded" />
  //                                       ) : avatar?.type === "icon" ? (
  //                                         (() => {
  //                                           const iconObj = iconLibrary.find((i: any) => i.name === avatar.name);
  //                                           if (iconObj) {
  //                                             const IconComponent = iconObj.icon;
  //                                             return <IconComponent size={12} color={avatar.color} />;
  //                                           }
  //                                           return <span className="text-[10px] font-bold" style={{ color: p.color ?? "#3B82F6" }}>{p.name?.charAt(0).toUpperCase()}</span>;
  //                                         })()
  //                                       ) : (
  //                                         <span className="text-[10px] font-bold" style={{ color: p.color ?? "#3B82F6" }}>{p.name?.charAt(0).toUpperCase()}</span>
  //                                       )}
  //                                     </div>

  //                                     <span className="text-xs text-gray-700 truncate">{p.name}</span>
  //                                   </div>
  //                                   <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
  //                                 </div>
  //                               );
  //                             })}
  //                           </div>
  //                         )}

  //                         {/* Portfolio Tab */}
  //                         {activeTab === "portfolio" && portfolios.length > 0 && (
  //                           <div className="max-h-40 overflow-y-auto space-y-1">
  //                             {portfolios.map((p) => {
  //                               const isSelected = doc?.linkedPortfolios?.includes(p.id);
  //                               return (
  //                                 <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => isSelected ? handleRemovePortfolio(p.id) : handleAddPortfolio(p.id)}>
  //                                   <span className="text-xs text-gray-700 truncate">{p.name}</span>
  //                                   <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
  //                                 </div>
  //                               );
  //                             })}
  //                           </div>
  //                         )}

  //                         {/* Team Tab */}
  //                         {activeTab === "team" && teams.length > 0 && (
  //                           <div className="max-h-40 overflow-y-auto space-y-1">
  //                             {teams.map((t) => {
  //                               const isSelected = doc?.linkedTeams?.includes(t.id!);
  //                               return (
  //                                 <div key={t.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => isSelected ? handleRemoveTeam(t.id!) : handleAddTeam(t.id!)}>
  //                                   <span className="text-xs text-gray-700 truncate">{t.name}</span>
  //                                   <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
  //                                 </div>
  //                               );
  //                             })}
  //                           </div>
  //                         )}

  //                         {/* Document Tab */}
  //                         {activeTab === "document" && docList.length > 0 && (
  //                           <div className="max-h-40 overflow-y-auto space-y-1">
  //                             {docList.map((d) => {
  //                               const isSelected = doc?.linkedDocuments?.includes(d.id);
  //                               return (
  //                                 <div key={d.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => isSelected ? handleRemoveDocument(d.id) : handleAddDocument(d.id)}>
  //                                   <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
  //                                   <span className="text-xs text-gray-700 truncate">{d.title}</span>
  //                                 </div>
  //                               );
  //                             })}
  //                           </div>
  //                         )}
  //                       </div>
  //                     </>
  //                   );
  //                 })()}
  //               </DropdownMenuSubContent>
  //             </DropdownMenuSub>
  //             <DropdownMenuSeparator />

  //             <DropdownMenuItem>
  //               <History className="w-4 h-4 mr-2" />
  //               <span>Version history</span>
  //             </DropdownMenuItem>
  //             <DropdownMenuSeparator />

  //             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
  //               <Lock className="w-4 h-4 mr-2" />
  //               <span>Lock page</span>
  //               <Switch
  //                 checked={isPageLocked}
  //                 onCheckedChange={(checked) => {
  //                   setIsPageLocked(checked);
  //                   handleMenuAction("lock-page", id, currentPageDoc?.title || "", checked);
  //                 }}
  //                 onClick={(e) => e.stopPropagation()}
  //                 className="ml-auto data-[state=checked]:bg-[#001F3F]"
  //               />
  //             </DropdownMenuItem>

  //             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
  //               <Lock className="w-4 h-4 mr-2" />
  //               <span>Lock Document</span>
  //               <Switch
  //                 checked={isDocumentLocked}
  //                 onCheckedChange={(checked) => {
  //                   setIsDocumentLocked(checked);
  //                   handleMenuAction("lock-document", rootId || id, rootDoc?.title || "", checked);
  //                 }}
  //                 onClick={(e) => e.stopPropagation()}
  //                 className="ml-auto data-[state=checked]:bg-[#001F3F]"
  //               />
  //             </DropdownMenuItem>

  //             <DropdownMenuSeparator />

  //             {/* <DropdownMenuSub>
  //               <DropdownMenuSubTrigger>
  //                 <Upload className="w-4 h-4 mr-2" />
  //                 <span>Import</span>
  //               </DropdownMenuSubTrigger>
  //               <DropdownMenuSubContent className="w-100  p-5">
                 
  //                 <div
  //                   className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
  //                   onClick={() => fileInputRef.current?.click()}
  //                   onDrop={handleDrop}
  //                   onDragOver={handleDragOver}
  //                   onDragLeave={handleDragLeave}
  //                 >
  //                   <div className="w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
  //                     <Upload className="w-6 h-6 text-orange-500" />
  //                   </div>
  //                   <p className="text-lg font-medium text-gray-900 mb-1">Drag & drop files here</p>
  //                   <p className="text-sm text-gray-500 mb-6">or choose files to upload</p>

  //                   <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-6 bg-gray-50 p-2 rounded-lg">
  //                     <span>Supported types:</span>
  //                     <span className="text-xs bg-white px-2 py-1 rounded border">PDF</span>
  //                     <span className="text-xs bg-white px-2 py-1 rounded border">TXT</span>
  //                     <span className="text-xs bg-white px-2 py-1 rounded border">MD</span>
  //                     <span className="text-xs bg-white px-2 py-1 rounded border">HTML</span>
  //                   </div>

               
  //                   <input
  //                     ref={fileInputRef}
  //                     type="file"
  //                     multiple
  //                     accept=".pdf,.txt,.md,.html"
  //                     className="hidden"
  //                     onChange={handleFileSelect}
  //                   />
  //                 </div>

               
  //                 {selectedFiles.length > 0 && (
  //                   <div className="mt-4 p-3 bg-gray-50 rounded-lg">
  //                     <p className="text-sm font-medium text-gray-900 mb-2">Selected files:</p>
  //                     <div className="space-y-1">
  //                       {selectedFiles.map((file, index) => (
  //                         <div key={index} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
  //                           <span>{file.name}</span>
  //                           <Button
  //                             variant="ghost"
  //                             size="icon"
  //                             onClick={() => removeFile(index)}
  //                             className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
  //                           >
  //                             <X className="w-3 h-3" />
  //                           </Button>
  //                         </div>
  //                       ))}
  //                     </div>
  //                     <Button
  //                       size="sm"
  //                       className="w-full mt-3 bg-[#001F3F] hover:bg-[#001F3F]/90"
  //                       onClick={handleUpload}
  //                       disabled={isUploading}
  //                     >
  //                       {isUploading ? "Uploading..." : "Upload Files"}
  //                     </Button>
  //                   </div>
  //                 )}
  //               </DropdownMenuSubContent>
  //             </DropdownMenuSub> */}

  //             <DropdownMenuSub>
  //               <DropdownMenuSubTrigger>
  //                 <Upload className="w-4 h-4 mr-2" />
  //                 <span>Import</span>
  //               </DropdownMenuSubTrigger>
  //               <DropdownMenuSubContent className="w-80 p-5"> {/* Adjusted width for better fit */}
  //                 <div
  //                   className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
  //                   onClick={() => fileInputRef.current?.click()}
  //                   onDrop={handleDrop}
  //                   onDragOver={handleDragOver}
  //                   onDragLeave={handleDragLeave}
  //                 >
  //                   <div className="w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
  //                     <Upload className="w-6 h-6 text-orange-500" />
  //                   </div>
  //                   <p className="text-sm font-medium text-gray-900 mb-1">Drag & drop files here</p>
  //                   <p className="text-xs text-gray-500">or choose files to upload</p>

  //                   <input
  //                     ref={fileInputRef}
  //                     type="file"
  //                     multiple
  //                     accept=".pdf,.txt,.md,.html"
  //                     className="hidden"
  //                     onChange={handleFileSelect}
  //                   />
  //                 </div>

  //                 {selectedFiles.length > 0 && (
  //                   <div className="mt-4 p-3 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
  //                     <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Selected files:</p>
  //                     <div className="space-y-1">
  //                       {selectedFiles.map((file, index) => (
  //                         <div key={index} className="flex items-center justify-between text-xs p-2 bg-white rounded border">
  //                           <span className="truncate max-w-[150px]">{file.name}</span>
  //                           <Button
  //                             variant="ghost"
  //                             size="icon"
  //                             onClick={(e) => {
  //                               e.stopPropagation(); // Prevent opening file dialog
  //                               removeFile(index);
  //                             }}
  //                             className="h-5 w-5 text-red-500 hover:bg-red-50"
  //                           >
  //                             <X className="w-3 h-3" />
  //                           </Button>
  //                         </div>
  //                       ))}
  //                     </div>
  //                     <Button
  //                       size="sm"
  //                       className="w-full mt-3 bg-[#001F3F] text-white hover:bg-[#001F3F]/90"
  //                       onClick={handleUpload}
  //                       disabled={isUploading}
  //                     >
  //                       {isUploading ? "Importing..." : "Import Files"}
  //                     </Button>
  //                   </div>
  //                 )}
  //               </DropdownMenuSubContent>
  //             </DropdownMenuSub>


  //             <DropdownMenuSub>
  //               <DropdownMenuSubTrigger>
  //                 <Download className="w-4 h-4 mr-2" />
  //                 <span>Export</span>
  //               </DropdownMenuSubTrigger>
  //               <DropdownMenuSubContent>
  //                 {/* First Level - Scope Selection */}
  //                 <DropdownMenuSub>
  //                   <DropdownMenuSubTrigger>
  //                     <span>This page</span>
  //                   </DropdownMenuSubTrigger>
  //                   <DropdownMenuSubContent>
  //                     <DropdownMenuItem onClick={() => handleExport('page', 'pdf')}>
  //                       <FileText className="w-4 h-4 mr-2" />
  //                       <span>PDF</span>
  //                     </DropdownMenuItem>
  //                     <DropdownMenuItem onClick={() => handleExport('page', 'html')}>
  //                       <Globe className="w-4 h-4 mr-2" />
  //                       <span>HTML</span>
  //                     </DropdownMenuItem>
  //                     <DropdownMenuItem onClick={() => handleExport('page', 'markdown')}>
  //                       <Hash className="w-4 h-4 mr-2" />
  //                       <span>Markdown</span>
  //                     </DropdownMenuItem>
  //                   </DropdownMenuSubContent>
  //                 </DropdownMenuSub>

  //                 <DropdownMenuSub>
  //                   <DropdownMenuSubTrigger>
  //                     <span>All pages</span>
  //                   </DropdownMenuSubTrigger>
  //                   <DropdownMenuSubContent>
  //                     <DropdownMenuItem onClick={() => handleExport('all', 'pdf')}>
  //                       <FileText className="w-4 h-4 mr-2" />
  //                       <span>PDF</span>
  //                     </DropdownMenuItem>
  //                     <DropdownMenuItem onClick={() => handleExport('all', 'html')}>
  //                       <Globe className="w-4 h-4 mr-2" />
  //                       <span>HTML</span>
  //                     </DropdownMenuItem>
  //                     <DropdownMenuItem onClick={() => handleExport('all', 'markdown')}>
  //                       <Hash className="w-4 h-4 mr-2" />
  //                       <span>Markdown</span>
  //                     </DropdownMenuItem>
  //                   </DropdownMenuSubContent>
  //                 </DropdownMenuSub>
  //               </DropdownMenuSubContent>
  //             </DropdownMenuSub>



  //             <DropdownMenuSeparator />

  //             <DropdownMenuItem
  //               onClick={() => handleMenuAction("delete", id || "", currentPageDoc?.title || "")}
  //               className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
  //             >
  //               <Trash2 className="w-4 h-4 mr-2" />
  //               <span>Delete</span>
  //             </DropdownMenuItem>
  //           </DropdownMenuContent>
  //         </DropdownMenu>

  //         {/* Close Icon */}
  //         <Button
  //           variant="ghost"
  //           size="icon"
  //           className="p-3"
  //           title="Close"
  //           onClick={handleClose}
  //         >
  //           <X className="w-4 h-4 text-gray-600" />
  //         </Button>
  //       </div>
  //     </div>

  //     {/* Fixed Sidebar + Scrollable Content Area */}
  //     <div className="flex-1 flex overflow-hidden">
  //       {/* Fixed Sidebar */}
  //       {!isSidebarCollapsed && (
  //         <div className="shrink-0 overflow-y-auto border-r no-print">
  //           <DocsSidebar
  //             onCollapse={handleCollapseSidebar}
  //             onExpandAll={setExpandAllFn}
  //             onCollapseAll={setCollapseAllFn}
  //           />
  //         </div>
  //       )}

  //       {/* Collapsed Sidebar Button */}
  //       {isSidebarCollapsed && (
  //         <Button
  //           variant="ghost"
  //           onClick={() => setIsSidebarCollapsed(false)}
  //           className="w-12 h-full border-r border-gray-200 flex items-start justify-center pt-4 hover:bg-gray-50 shrink-0 rounded-none bg-white no-print"
  //           title="Expand sidebar"
  //         >
  //           <ChevronRight className="w-5 h-5 text-gray-600" />
  //         </Button>
  //       )}


  //       {/* Scrollable Main Content */}
  //       <div className="flex-1 overflow-hidden ">
  //         {children}
  //       </div>
  //     </div>
  //     <ConfirmationModal
  //       open={isDeleteModalOpen}
  //       onClose={() => setIsDeleteModalOpen(false)}
  //       title="Delete Document"
  //       confirmLabel="Delete"
  //       onConfirm={handleConfirmDelete}
  //       description={`Are you sure you want to delete "${itemToDelete?.title}"? This action is permanent and cannot be undone.`}
  //     />
  //   </div >
  // );

 return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Fixed Breadcrumb */}
      <div className="border-b shrink-0 no-print">
        <Breadcrumbs />
      </div>

      {/* Fixed Top Navbar with Action Buttons */}
      <div className="h-14 border-b bg-background px-4 flex items-center justify-between shrink-0 no-print">
        <div className="flex items-center gap-2">

          {/* Title with icon */}
          <div className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded transition-colors">
            <img
              src="/images/DocsIcon.svg"
              className="w-5 h-5 flex-shrink-0 dark:brightness-0 dark:invert"
              style={{ filter: "brightness(0.3)" }}
              alt="Docs"
            />
            {isEditingTitle ? (
              <Input
                ref={titleInputRef}
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={saveTitleEdit}
                onKeyDown={handleTitleKeyDown}
                className="text-sm font-semibold h-7 px-2 py-1 focus-visible:ring-0 border-none bg-transparent shadow-none text-foreground"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="text-sm font-semibold text-foreground truncate min-w-[20px]"
                onDoubleClick={startEditingTitle}
              >
                {rootDoc?.title || ""}
              </span>
            )}
          </div>

          {(() => {
            const totalLinks =
              (rootDoc?.linkedProjects?.length || 0) +
              (rootDoc?.linkedTeams?.length || 0) +
              (rootDoc?.linkedPortfolios?.length || 0) +
              (rootDoc?.linkedDocuments?.length || 0);
            if (totalLinks === 0) return null;
            return (
              <DropdownMenu open={showBadgeDropdown} onOpenChange={setShowBadgeDropdown}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center bg-orange-500/10 dark:bg-orange-500/20 text-[#F68C1F] dark:text-orange-400 border border-[#F68C1F]/30 dark:border-orange-500/50 min-w-[1.125rem] h-[1.125rem] px-1 rounded-sm text-[10px] font-bold justify-center hover:bg-orange-500/20 transition-colors cursor-pointer"
                    title="View linked items"
                  >
                    {totalLinks}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80 p-0 bg-popover border border-border text-popover-foreground shadow-lg rounded-md">
                  {(() => {
                    const doc = rootDoc;
                    const linkedProjectsList = doc?.linkedProjects?.map(id => projects.find(p => p.id === id)).filter(Boolean) || [];
                    // const linkedTeamsList = doc?.linkedTeams?.map(id => teams.find(t => t.id === id)).filter(Boolean) || [];
                    const linkedPortfoliosList = doc?.linkedPortfolios?.map(id => portfolios.find(p => p.id === id)).filter(Boolean) || [];
                    const linkedDocumentsList = doc?.linkedDocuments?.map(id => documents.get(id)).filter(Boolean) || [];
                    const hasLinks = linkedProjectsList.length > 0 || linkedPortfoliosList.length > 0 || linkedDocumentsList.length > 0;

                    if (hasLinks && !showLinkTabs) return (
                      <div className="p-2 space-y-1">
                        <div className="flex items-center justify-between px-2 py-1 mb-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Linked Items</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setShowLinkTabs(true); }}>
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                        <div className="space-y-1 bg-muted/50 rounded-lg p-1.5">
                          {linkedProjectsList.map((p: any) => {
                            const avatar = getProjectAvatar(p);
                            return (
                              <div key={p?.id} className="flex items-center gap-2 py-1 px-2 bg-card border border-border rounded shadow-sm group">
                                {/* Project Icon */}
                                <div
                                  className="w-5 h-5 rounded shrink-0 flex items-center justify-center overflow-hidden"
                                  style={{ backgroundColor: avatar?.type === "icon" ? (avatar.color + "20") : (p?.color ? p.color + "20" : "#3B82F620") }}
                                >
                                  {avatar?.type === "image" ? (
                                    <img src={avatar.src} alt={p?.name} className="w-full h-full object-cover rounded" />
                                  ) : avatar?.type === "icon" ? (
                                    (() => {
                                      const iconObj = iconLibrary.find((i: any) => i.name === avatar.name);
                                      if (iconObj) {
                                        const IconComponent = iconObj.icon;
                                        return <IconComponent size={10} color={avatar.color} />;
                                      }
                                      return <span className="text-[9px] font-bold" style={{ color: p?.color ?? "#3B82F6" }}>{p?.name?.charAt(0).toUpperCase()}</span>;
                                    })()
                                  ) : (
                                    <span className="text-[9px] font-bold" style={{ color: p?.color ?? "#3B82F6" }}>{p?.name?.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <span className="text-xs text-foreground flex-1 truncate">{p?.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => { e.stopPropagation(); handleRemoveProject(p?.id!); }}
                                >
                                  <X className="w-3 h-3 text-muted-foreground" />
                                </Button>
                              </div>
                            );
                          })}
                          {/* {linkedTeamsList.map((t: any) => (
                            <div key={t?.id} className="flex items-center gap-2 py-1 px-2 bg-card border border-border rounded shadow-sm group">
                              <span className="text-sm">👥</span>
                              <span className="text-xs text-foreground flex-1 truncate">{t?.name}</span>
                              <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemoveTeam(t?.id!); }}>
                                <X className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            </div>
                          ))} */}
                          {linkedPortfoliosList.map((p: any) => (
                            <div key={p?.id} className="flex items-center gap-2 py-1 px-2 bg-card border border-border rounded shadow-sm group">
                              <span className="text-sm">💼</span>
                              <span className="text-xs text-foreground flex-1 truncate">{p?.name}</span>
                              <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemovePortfolio(p?.id!); }}>
                                <X className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            </div>
                          ))}
                          {linkedDocumentsList.map((d: any) => (
                            <div key={d?.id} className="flex items-center gap-2 py-1 px-2 bg-card border border-border rounded shadow-sm group">
                              <span className="text-sm">📄</span>
                              <span className="text-xs text-foreground flex-1 truncate">{d?.title}</span>
                              <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemoveDocument(d?.id); }}>
                                <X className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button variant="ghost" className="flex items-center justify-start gap-2 py-1 px-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded w-full text-left h-auto font-normal" onClick={(e) => { e.stopPropagation(); setShowLinkTabs(true); }}>
                          <Plus className="w-3 h-3" />
                          <span className="text-xs">Add Linked Items</span>
                        </Button>
                      </div>
                    );

                    // Tabs view
                    return (
                      <div>
                        <div className="flex border-b border-border px-1 pt-1">
                          {["project", "portfolio", "document"].map((tab) => (
                            <Button key={tab} variant="ghost" onClick={() => setActiveTab(tab as any)}
                              className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === tab ? "text-foreground border-b-2 border-primary -mb-0.5" : "text-muted-foreground hover:text-foreground"}`}>
                              {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Button>
                          ))}
                          {hasLinks && (
                            <Button variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setShowLinkTabs(false); }}>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                        <div className="p-3">
                          {(() => {
                            const config = {
                              project: { image: "/images/project.svg", title: "No Project found", list: projects },
                              portfolio: { image: "/images/portfolio-image.svg", title: "No Portfolio found", list: portfolios },
                              team: { image: "/images/TeamsEmpty.svg", title: "No Team found", list: teams },
                              document: { image: "/images/docs-image.png", title: "No Document found", list: docList }
                            };

                            const current = config[activeTab as keyof typeof config];

                            if (!current.list || current.list.length === 0) {
                              return (
                                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                  <img src={current.image} alt={current.title} className="w-16 h-16 mb-3 object-contain opacity-50 dark:brightness-90 dark:contrast-125" />
                                  <p className="text-xs text-muted-foreground font-medium">{current.title}</p>
                                </div>
                              );
                            }

                            return (
                              <div className="max-h-40 overflow-y-auto space-y-1">
                                {activeTab === "project" && projects.map(p => {
                                  const isSelected = doc?.linkedProjects?.includes(p.id!);
                                  const avatar = getProjectAvatar(p);
                                  return (
                                    <div
                                      key={p.id}
                                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted cursor-pointer"
                                      onClick={() => isSelected ? handleRemoveProject(p.id!) : handleAddProject(p.id!)}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        {/* Project Icon */}
                                        <div
                                          className="w-5 h-5 rounded shrink-0 flex items-center justify-center overflow-hidden"
                                          style={{ backgroundColor: avatar?.type === "icon" ? (avatar.color + "20") : (p.color ? p.color + "20" : "#3B82F620") }}
                                        >
                                          {avatar?.type === "image" ? (
                                            <img src={avatar.src} alt={p.name} className="w-full h-full object-cover rounded" />
                                          ) : avatar?.type === "icon" ? (
                                            (() => {
                                              const iconObj = iconLibrary.find((i: any) => i.name === avatar.name);
                                              if (iconObj) {
                                                const IconComponent = iconObj.icon;
                                                return <IconComponent size={12} color={avatar.color} />;
                                              }
                                              return <span className="text-[10px] font-bold" style={{ color: p.color ?? "#3B82F6" }}>{p.name?.charAt(0).toUpperCase()}</span>;
                                            })()
                                          ) : (
                                            <span className="text-[10px] font-bold" style={{ color: p.color ?? "#3B82F6" }}>{p.name?.charAt(0).toUpperCase()}</span>
                                          )}
                                        </div>
                                        <span className="text-xs text-foreground truncate">{p.name}</span>
                                      </div>
                                      <Checkbox checked={isSelected} className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                    </div>
                                  );
                                })}
                                {activeTab === "team" && teams.map(t => {
                                  const isSelected = doc?.linkedTeams?.includes(t.id!);
                                  return (
                                    <div key={t.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted cursor-pointer" onClick={() => isSelected ? handleRemoveTeam(t.id!) : handleAddTeam(t.id!)}>
                                      <span className="text-xs text-foreground truncate">{t.name}</span>
                                      <Checkbox checked={isSelected} className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                    </div>
                                  );
                                })}
                                {activeTab === "portfolio" && portfolios.map(p => {
                                  const isSelected = doc?.linkedPortfolios?.includes(p.id);
                                  return (
                                    <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted cursor-pointer" onClick={() => isSelected ? handleRemovePortfolio(p.id) : handleAddPortfolio(p.id)}>
                                      <span className="text-xs text-foreground truncate">{p.name}</span>
                                      <Checkbox checked={isSelected} className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                    </div>
                                  );
                                })}
                                {activeTab === "document" && docList.map(d => {
                                  const isSelected = doc?.linkedDocuments?.includes(d.id);
                                  return (
                                    <div key={d.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted cursor-pointer" onClick={() => isSelected ? handleRemoveDocument(d.id) : handleAddDocument(d.id)}>
                                      <span className="text-xs text-foreground truncate">{d.title}</span>
                                      <Checkbox checked={isSelected} className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })()}
          <div className="flex items-center gap-0.5 ml-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => collapseAllFn?.()}
              className="h-6 w-6 text-muted-foreground hover:bg-muted p-1"
              title="Collapse all"
              disabled={!collapseAllFn}
            >
              <img src="/images/docsChevronUp.svg" className="w-3 h-3 dark:brightness-200 dark:contrast-200" alt="Collapse all" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => expandAllFn?.()}
              className="h-6 w-6 text-muted-foreground hover:bg-muted p-1"
              title="Expand all"
              disabled={!expandAllFn}
            >
              <img src="/images/docsChevronDown.svg" className="w-3 h-3 dark:brightness-200 dark:contrast-200" alt="Expand all" />
            </Button>
          </div>

        </div>

        {/* Action Buttons - Right Side */}
        <div className="flex items-center gap-2">
  
          {/* Open in new window */}
          <Button
            variant="ghost"
            size="icon"
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Open in new window"
            onClick={() => window.open(`/docs/${id}`, "_blank")}
          >
            <SquareArrowOutUpRight className="w-4 h-4" />
          </Button>

          {/* Fullscreen Icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            <Expand className="w-4 h-4" />
          </Button>

          {/* More Options Dropdown (3 dots) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted"
                title="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-popover border border-border text-popover-foreground shadow-lg rounded-md">
              {/* Header */}
              <DropdownMenuLabel className="text-xs font-semibold text-primary-foreground text-center mx-1 mt-1 mb-2 px-8 py-2 rounded-lg bg-primary">
                Sharing & Permissions
              </DropdownMenuLabel>

              {/* Menu Items */}
              <DropdownMenuItem onClick={startEditingTitle}>
                <Edit className="w-4 h-4 mr-2" />
                <span>Rename</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  const doc = documents.get(id);
                  if (!doc) return;
                  createDoc(`${doc.title} (Copy)`, doc.parentId)
                    .then((newId) => {
                      if (newId) {
                        router.push(`/docs/${newId}`);
                        toast("success", { title: "Document duplicated" });
                      }
                    })
                    .catch(() => toast("error", { title: "Failed to duplicate" }));
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                <span>Duplicate</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => toggleFavorite(id)}>
                <Star className={`w-4 h-4 mr-2 ${currentPageDoc?.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                <span>{currentPageDoc?.isFavorite ? "Remove from favorites" : "Add to favorites"}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />



              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Link className="w-4 h-4 mr-2" />
                  <span>Link Document to</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-80 p-0 bg-popover border border-border text-popover-foreground shadow-lg rounded-md">
                  {(() => {
                    const doc = rootDoc;
                    const linkedProjectsList = doc?.linkedProjects?.map(id => projects.find(p => p.id === id)).filter(Boolean) || [];
                    const linkedTeamsList = doc?.linkedTeams?.map(id => teams.find(t => t.id === id)).filter(Boolean) || [];
                    const linkedPortfoliosList = doc?.linkedPortfolios?.map(id => portfolios.find(p => p.id === id)).filter(Boolean) || [];
                    const linkedDocumentsList = doc?.linkedDocuments?.map(id => documents.get(id)).filter(Boolean) || [];

                    const hasLinks = linkedProjectsList.length > 0 || linkedTeamsList.length > 0 || linkedPortfoliosList.length > 0 || linkedDocumentsList.length > 0;

                    if (hasLinks && !showLinkTabs) {
                      return (
                        <div className="p-2 space-y-1">
                          <div className="flex items-center justify-between px-2 py-1 mb-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Linked Items</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setShowLinkTabs(true); }}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-1 bg-muted/50 rounded-lg p-1.5">
                            {linkedProjectsList.map((p: any) => {
                              const avatar = getProjectAvatar(p);
                              return (
                                <div key={p?.id} className="flex items-center gap-2 py-1 px-2 bg-card border border-border rounded shadow-sm group">
                                  {/* Project Icon */}
                                  <div
                                    className="w-5 h-5 rounded shrink-0 flex items-center justify-center overflow-hidden"
                                    style={{ backgroundColor: avatar?.type === "icon" ? (avatar.color + "20") : (p?.color ? p.color + "20" : "#3B82F620") }}
                                  >
                                    {avatar?.type === "image" ? (
                                      <img src={avatar.src} alt={p?.name} className="w-full h-full object-cover rounded" />
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
                                        return <span className="text-[9px] font-bold" style={{ color: p?.color ?? "#3B82F6" }}>{p?.name?.charAt(0).toUpperCase()}</span>;
                                      })()
                                    ) : (
                                      <span className="text-[9px] font-bold" style={{ color: p?.color ?? "#3B82F6" }}>{p?.name?.charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-foreground flex-1 truncate">{p?.name}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveProject(p?.id!); }}
                                  >
                                    <X className="w-3 h-3 text-muted-foreground" />
                                  </Button>
                                </div>
                              );
                            })}
                            {/* {linkedTeamsList.map(t => (
                              <div key={t?.id} className="flex items-center gap-2 py-1 px-2 bg-card border border-border rounded shadow-sm group">
                                <span className="text-sm">👥</span>
                                <span className="text-xs text-foreground flex-1 truncate">{t?.name}</span>
                                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemoveTeam(t?.id!); }}>
                                  <X className="w-3 h-3 text-muted-foreground" />
                                </Button>
                              </div>
                            ))} */}
                            {linkedPortfoliosList.map(p => (
                              <div key={p?.id} className="flex items-center gap-2 py-1 px-2 bg-card border border-border rounded shadow-sm group">
                                <span className="text-sm">📂</span>
                                <span className="text-xs text-foreground flex-1 truncate">{p?.name}</span>
                                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemovePortfolio(p?.id!); }}>
                                  <X className="w-3 h-3 text-muted-foreground" />
                                </Button>
                              </div>
                            ))}
                            {linkedDocumentsList.map((d: any) => (
                              <div key={d.id} className="flex items-center gap-2 py-1 px-2 bg-card border border-border rounded shadow-sm group">
                                <span className="text-sm">📄</span>
                                <span className="text-xs text-foreground flex-1 truncate">{d.title}</span>
                                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemoveDocument(d.id); }}>
                                  <X className="w-3 h-3 text-muted-foreground" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="ghost"
                              className="flex items-center justify-start gap-2 py-1 px-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded w-full text-left h-auto font-normal"
                              onClick={(e) => { e.stopPropagation(); setShowLinkTabs(true); }}
                            >
                              <Plus className="w-3 h-3" />
                              <span className="text-xs">Add Linked Items</span>
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    // Otherwise show tabs
                    return (
                      <>
                        {/* Tabs Header */}
                        <div className="flex border-b border-border px-1 pt-1">
                          <Button
                            variant="ghost"
                            onClick={() => setActiveTab("project")}
                            className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "project" ? "text-foreground border-b-2 border-primary -mb-0.5" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            Project
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setActiveTab("portfolio")}
                            className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "portfolio" ? "text-foreground border-b-2 border-primary -mb-0.5" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            Portfolio
                          </Button>
                          {/* <Button
                            variant="ghost"
                            onClick={() => setActiveTab("team")}
                            className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "team" ? "text-foreground border-b-2 border-primary -mb-0.5" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            Team
                          </Button> */}
                          <Button
                            variant="ghost"
                            onClick={() => setActiveTab("document")}
                            className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "document" ? "text-foreground border-b-2 border-primary -mb-0.5" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            Documents
                          </Button>
                          {hasLinks && (
                            <Button variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setShowLinkTabs(false); }}>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>

                        {/* Tab Content */}
                        <div className="p-3">
                          {/* Empty State Logic */}
                          {(() => {
                            const isEmpty = (activeTab === "project" && projects.length === 0) ||
                              (activeTab === "team" && teams.length === 0) ||
                              (activeTab === "portfolio" && portfolios.length === 0) ||
                              (activeTab === "document" && docList.length === 0);

                            if (!isEmpty) return null;

                            const config = {
                              project: { image: "/images/project.svg", title: "No Project found" },
                              portfolio: { image: "/images/portfolio-image.svg", title: "No Portfolio found" },
                              team: { image: "/images/TeamsEmpty.svg", title: "No Team found" },
                              document: { image: "/images/docs-image.png", title: "No Document found" }
                            };

                            return (
                              <div className="py-2 flex flex-col items-center justify-center text-center px-4">
                                <img src={config[activeTab].image} alt={config[activeTab].title} className="w-40 h-24 mb-2 opacity-80 dark:brightness-90 dark:contrast-125" />
                                <h3 className="text-sm font-semibold text-foreground mb-1 leading-tight">{config[activeTab].title}</h3>
                              </div>
                            );
                          })()}

                          {/* Project Tab */}
                          {activeTab === "project" && projects.length > 0 && (
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {projects.map((p) => {
                                const isSelected = doc?.linkedProjects?.includes(p.id!);
                                const avatar = getProjectAvatar(p);
                                return (
                                  <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer"
                                    onClick={() => isSelected ? handleRemoveProject(p.id!) : handleAddProject(p.id!)}>
                                    <div className="flex items-center gap-2 min-w-0">
                                      {/* Project Icon */}
                                      <div className="w-5 h-5 rounded shrink-0 flex items-center justify-center overflow-hidden"
                                        style={{ backgroundColor: avatar?.type === "icon" ? (avatar.color + "20") : (p.color ? p.color + "20" : "#3B82F620") }}
                                      >
                                        {avatar?.type === "image" ? (
                                          <img src={avatar.src} alt={p.name} className="w-full h-full object-cover rounded" />
                                        ) : avatar?.type === "icon" ? (
                                          (() => {
                                            const iconObj = iconLibrary.find((i: any) => i.name === avatar.name);
                                            if (iconObj) {
                                              const IconComponent = iconObj.icon;
                                              return <IconComponent size={12} color={avatar.color} />;
                                            }
                                            return <span className="text-[10px] font-bold" style={{ color: p.color ?? "#3B82F6" }}>{p.name?.charAt(0).toUpperCase()}</span>;
                                          })()
                                        ) : (
                                          <span className="text-[10px] font-bold" style={{ color: p.color ?? "#3B82F6" }}>{p.name?.charAt(0).toUpperCase()}</span>
                                        )}
                                      </div>

                                      <span className="text-xs text-gray-700 truncate">{p.name}</span>
                                    </div>
                                    <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Portfolio Tab */}
                          {activeTab === "portfolio" && portfolios.length > 0 && (
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {portfolios.map((p) => {
                                const isSelected = doc?.linkedPortfolios?.includes(p.id);
                                return (
                                  <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => isSelected ? handleRemovePortfolio(p.id) : handleAddPortfolio(p.id)}>
                                    <span className="text-xs text-gray-700 truncate">{p.name}</span>
                                    <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Team Tab */}
                          {activeTab === "team" && teams.length > 0 && (
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {teams.map((t) => {
                                const isSelected = doc?.linkedTeams?.includes(t.id!);
                                return (
                                  <div key={t.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => isSelected ? handleRemoveTeam(t.id!) : handleAddTeam(t.id!)}>
                                    <span className="text-xs text-gray-700 truncate">{t.name}</span>
                                    <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Document Tab */}
                          {activeTab === "document" && docList.length > 0 && (
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {docList.map((d) => {
                                const isSelected = doc?.linkedDocuments?.includes(d.id);
                                return (
                                  <div key={d.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => isSelected ? handleRemoveDocument(d.id) : handleAddDocument(d.id)}>
                                    <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
                                    <span className="text-xs text-gray-700 truncate">{d.title}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <History className="w-4 h-4 mr-2" />
                <span>Version history</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Lock className="w-4 h-4 mr-2" />
                <span>Lock page</span>
                <Switch
                  checked={isPageLocked}
                  onCheckedChange={(checked) => {
                    setIsPageLocked(checked);
                    handleMenuAction("lock-page", id, currentPageDoc?.title || "", checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="ml-auto data-[state=checked]:bg-primary"
                />
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Lock className="w-4 h-4 mr-2" />
                <span>Lock Document</span>
                <Switch
                  checked={isDocumentLocked}
                  onCheckedChange={(checked) => {
                    setIsDocumentLocked(checked);
                    handleMenuAction("lock-document", rootId || id, rootDoc?.title || "", checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="ml-auto data-[state=checked]:bg-primary"
                />
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Upload className="w-4 h-4 mr-2" />
                  <span>Import</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-100  p-5">
                 
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-orange-500" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-1">Drag & drop files here</p>
                    <p className="text-sm text-gray-500 mb-6">or choose files to upload</p>

                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-6 bg-gray-50 p-2 rounded-lg">
                      <span>Supported types:</span>
                      <span className="text-xs bg-white px-2 py-1 rounded border">PDF</span>
                      <span className="text-xs bg-white px-2 py-1 rounded border">TXT</span>
                      <span className="text-xs bg-white px-2 py-1 rounded border">MD</span>
                      <span className="text-xs bg-white px-2 py-1 rounded border">HTML</span>
                    </div>

               
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.txt,.md,.html"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>

               
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-2">Selected files:</p>
                      <div className="space-y-1">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                            <span>{file.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(index)}
                              className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3 bg-[#001F3F] hover:bg-[#001F3F]/90"
                        onClick={handleUpload}
                        disabled={isUploading}
                      >
                        {isUploading ? "Uploading..." : "Upload Files"}
                      </Button>
                    </div>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub> */}

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Upload className="w-4 h-4 mr-2" />
                  <span>Import</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-80 p-5 bg-popover border border-border text-popover-foreground shadow-lg rounded-md"> {/* Adjusted width for better fit */}
                  <div
                    className="border-2 border-dashed border-border bg-card rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-orange-500" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Drag & drop files here</p>
                    <p className="text-xs text-muted-foreground">or choose files to upload</p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.txt,.md,.html"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg max-h-60 overflow-y-auto">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Selected files:</p>
                      <div className="space-y-1">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-xs p-2 bg-card rounded border border-border">
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening file dialog
                                removeFile(index);
                              }}
                              className="h-5 w-5 text-red-500 hover:bg-red-50"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleUpload}
                        disabled={isUploading}
                      >
                        {isUploading ? "Importing..." : "Import Files"}
                      </Button>
                    </div>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>


              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Download className="w-4 h-4 mr-2" />
                  <span>Export</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-popover border border-border text-popover-foreground shadow-lg rounded-md">
                  {/* First Level - Scope Selection */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span>This page</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-popover border border-border text-popover-foreground shadow-lg rounded-md">
                      <DropdownMenuItem onClick={() => handleExport('page', 'pdf')}>
                        <FileText className="w-4 h-4 mr-2" />
                        <span>PDF</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('page', 'html')}>
                        <Globe className="w-4 h-4 mr-2" />
                        <span>HTML</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('page', 'markdown')}>
                        <Hash className="w-4 h-4 mr-2" />
                        <span>Markdown</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span>All pages</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-popover border border-border text-popover-foreground shadow-lg rounded-md">
                      <DropdownMenuItem onClick={() => handleExport('all', 'pdf')}>
                        <FileText className="w-4 h-4 mr-2" />
                        <span>PDF</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('all', 'html')}>
                        <Globe className="w-4 h-4 mr-2" />
                        <span>HTML</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('all', 'markdown')}>
                        <Hash className="w-4 h-4 mr-2" />
                        <span>Markdown</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuSubContent>
              </DropdownMenuSub>



              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => handleMenuAction("delete", id || "", currentPageDoc?.title || "")}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Close Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Close"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Fixed Sidebar + Scrollable Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fixed Sidebar */}
        {!isSidebarCollapsed && (
          <div className="shrink-0 overflow-y-auto border-r no-print">
            <DocsSidebar
              onCollapse={handleCollapseSidebar}
              onExpandAll={setExpandAllFn}
              onCollapseAll={setCollapseAllFn}
            />
          </div>
        )}

        {/* Collapsed Sidebar Button */}
        {isSidebarCollapsed && (
          <Button
            variant="ghost"
            onClick={() => setIsSidebarCollapsed(false)}
            className="w-12 h-full border-r border-border flex items-start justify-center pt-4 hover:bg-muted shrink-0 rounded-none bg-background no-print"
            title="Expand sidebar"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Button>
        )}


        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-hidden ">
          {children}
        </div>
      </div>
      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Document"
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        description={`Are you sure you want to delete "${itemToDelete?.title}"? This action is permanent and cannot be undone.`}
      />
    </div >
  );
}


