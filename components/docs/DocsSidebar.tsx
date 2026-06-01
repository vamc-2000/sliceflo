

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, ChevronLeft, MoreHorizontal, FileText, Link, Star, Copy, FileText as FileTemplate, Zap, ExternalLink, Archive, Trash2, Edit, Lock, ChevronDown, ChevronUp, X, BookText, PanelLeftClose, LayoutGrid } from "lucide-react";
import { useDocStore } from "@/stores/useDoc-store";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "../ui/separator";
import { useTeamStore } from "@/stores/teams-store";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useProjectsStore } from "@/stores/projects-store";
import toast from "react-hot-toast";
import { Checkbox } from "../ui/checkbox";
import { SidebarTrigger } from "../ui/sidebar";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useProfileStore } from "@/stores/profile-store";
import { createRootDocument, createChildDocument, updateDocument as updateDocumentApi, deleteDocument as deleteDocumentApi, lockDocument, unlockDocument } from "@/lib/api/documents-api";
import { iconLibrary } from "../ColorIconPicker";

interface DocItem {
  id: string;
  title: string;
  parentId?: string | null;
  children?: DocItem[];
  isOpen?: boolean;
}

interface DocsClickUpSidebarProps {
  onCollapse?: () => void;
  onExpandAll?: (expandFn: () => void) => void;
  onCollapseAll?: (collapseFn: () => void) => void;
}

export function DocsSidebar({ onCollapse, onExpandAll, onCollapseAll }: DocsClickUpSidebarProps) {
  const router = useRouter();
  const { teams, fetchTeams } = useTeamStore();
  const { projects, fetchProjects } = useProjectsStore();
  const { portfolios, fetchPortfolios } = usePortfoliosStore();

  const documents = useDocStore((state) => state.documents);
  const activeDocId = useDocStore((state) => state.activeDocId);
  const addDocument = useDocStore((state) => state.addDocument);
  const updateDocument = useDocStore((state) => state.updateDocument);
  const setActiveDoc = useDocStore((state) => state.setActiveDoc);
  const deleteDocument = useDocStore((state) => state.deleteDocument);
  const triggerTitleEdit = useDocStore((state) => state.triggerTitleEdit);

  const addPageLinkProject = useDocStore((state) => state.addPageLinkProject);
  const removePageLinkProject = useDocStore((state) => state.removePageLinkProject);
  const addPageLinkTeam = useDocStore((state) => state.addPageLinkTeam);
  const removePageLinkTeam = useDocStore((state) => state.removePageLinkTeam);
  const addPageLinkPortfolio = useDocStore((state) => state.addPageLinkPortfolio);
  const removePageLinkPortfolio = useDocStore((state) => state.removePageLinkPortfolio);
  const addPageLinkDocument = useDocStore((state) => state.addPageLinkDocument);
  const removePageLinkDocument = useDocStore((state) => state.removePageLinkDocument);
  const getDocument = useDocStore((state) => state.getDocument);
  const [childPages, setChildPages] = useState<DocItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isEditingRootTitle, setIsEditingRootTitle] = useState(false);
  const [rootTitleValue, setRootTitleValue] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootTitleInputRef = useRef<HTMLInputElement>(null);
  const [showLinkSection, setShowLinkSection] = useState(false);
  const [activeTab, setActiveTab] = useState<"portfolio" | "project" | "team" | "document">("project");
  const [showLinkTabs, setShowLinkTabs] = useState(false);
  const toggleFavorite = useDocStore((state) => state.toggleFavorite);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string } | null>(null);

  const getRootDocument = (docId: string | null): string | null => {
    if (!docId) return null;
    const doc = documents.get(docId);
    if (!doc) return null;
    if (!doc.parentId) return docId;
    return getRootDocument(doc.parentId);
  };

  const rootId = getRootDocument(activeDocId);
  const rootDoc = rootId ? documents.get(rootId) : null;

  // For the "Documents" tab in the "Link Page to" menu
  const docList = Array.from(documents.values()).filter(doc => !doc.parentId);

  // Helper function to find item in nested tree
  const findItemInTree = (items: DocItem[], id: string): DocItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemInTree(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Lazy-load projects/teams/portfolios when user opens "Link Page to" (see DropdownMenuSubTrigger onClick)
  const ensureLinkOptionsLoaded = useCallback(() => {
    fetchTeams();
    fetchProjects();
    fetchPortfolios();
  }, [fetchTeams, fetchProjects, fetchPortfolios]);

  useEffect(() => {
    const buildChildTree = () => {
      if (!rootId) return [];

      const itemsMap = new Map<string, DocItem>();

      const getAncestors = (id: string | null): Set<string> => {
        const ancestors = new Set<string>();
        let currentId = id;
        while (currentId) {
          const doc = documents.get(currentId);
          if (doc && doc.parentId) {
            ancestors.add(doc.parentId);
            currentId = doc.parentId;
          } else {
            break;
          }
        }
        return ancestors;
      };

      const activeAncestors = getAncestors(activeDocId);

      const getAllDescendants = (parentId: string) => {
        documents.forEach((doc) => {
          if (doc.parentId === parentId) {
            // We use the functional setter to access latest childPages if needed, 
            // but here we just need to preserve state. 
            // Actually, buildChildTree should probably be more robust.
            const existingItem = findItemInTree(childPages, doc.id);

            const shouldBeOpen = existingItem?.isOpen || activeAncestors.has(doc.id);

            itemsMap.set(doc.id, {
              id: doc.id,
              title: doc.title,
              parentId: doc.parentId,
              children: [],
              isOpen: shouldBeOpen,
            });
            getAllDescendants(doc.id);
          }
        });
      };

      getAllDescendants(rootId);

      const childItems: DocItem[] = [];
      itemsMap.forEach((item) => {
        if (item.parentId === rootId) {
          childItems.push(item);
        } else {
          const parent = itemsMap.get(item.parentId!);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(item);
          }
        }
      });

      return childItems;
    };

    setChildPages(buildChildTree());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, rootId, activeDocId]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (isEditingRootTitle && rootTitleInputRef.current) {
      rootTitleInputRef.current.focus();
      rootTitleInputRef.current.select();
    }
  }, [isEditingRootTitle]);

  const toggleFolder = (id: string) => {
    setChildPages(prevPages => {
      const updatePages = (items: DocItem[]): DocItem[] => {
        return items.map((item) => {
          if (item.id === id) {
            return { ...item, isOpen: !item.isOpen };
          }
          if (item.children) {
            return { ...item, children: updatePages(item.children) };
          }
          return item;
        });
      };
      return updatePages(prevPages);
    });
  };

  // Expand all folders
  const expandAll = useCallback(() => {
    setChildPages(prevPages => {
      const expandAllPages = (items: DocItem[]): DocItem[] => {
        return items.map((item) => ({
          ...item,
          isOpen: true,
          children: item.children ? expandAllPages(item.children) : item.children,
        }));
      };
      return expandAllPages(prevPages);
    });
  }, []);

  // Collapse all folders
  const collapseAll = useCallback(() => {
    setChildPages(prevPages => {
      const collapseAllPages = (items: DocItem[]): DocItem[] => {
        return items.map((item) => ({
          ...item,
          isOpen: false,
          children: item.children ? collapseAllPages(item.children) : item.children,
        }));
      };
      return collapseAllPages(prevPages);
    });
  }, []);

  useEffect(() => {
    if (onExpandAll) {
      onExpandAll(() => expandAll);
    }
  }, [onExpandAll, expandAll]);

  useEffect(() => {
    if (onCollapseAll) {
      onCollapseAll(() => collapseAll);
    }
  }, [onCollapseAll, collapseAll]);

  const addNewPage = async () => {
    const { user } = useProfileStore.getState();
    const createdByData = user ? {
      userId: user.id || "",
      name: user.name || "Unknown User",
      profilePictureUrl: user.profilePictureUrl,
    } : undefined;

    try {
      if (!rootId) {
        const rootCreated = await createRootDocument("Docs");
        const childCreated = await createChildDocument(rootCreated.id, "Untitled Page");
        addDocument({
          id: childCreated.id,
          title: childCreated.title || "Untitled Page",
          parentId: rootCreated.id,
          content: [{ type: "paragraph", content: [] }],
          createdBy: createdByData,
        });
        setActiveDoc(childCreated.id);
        router.push(`/docs/${childCreated.id}`);
        return;
      }

      const created = await createChildDocument(rootId, "Untitled Page");
      addDocument({
        id: created.id,
        title: created.title || "Untitled Page",
        parentId: rootId,
        content: [{ type: "paragraph", content: [] }],
        createdBy: createdByData,
      });
      setActiveDoc(created.id);
      router.push(`/docs/${created.id}`);
    } catch (err) {
      toast.error("Failed to create page");
    }
  };

  const addSubPage = async (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { user } = useProfileStore.getState();
    const createdByData = user ? {
      userId: user.id || "",
      name: user.name || "Unknown User",
      profilePictureUrl: user.profilePictureUrl,
    } : undefined;

    try {
      const created = await createChildDocument(parentId, "Untitled Page");
      addDocument({
        id: created.id,
        title: created.title || "Untitled Page",
        parentId,
        content: [{ type: "paragraph", content: [] }],
        createdBy: createdByData,
      });
      setActiveDoc(created.id);
      router.push(`/docs/${created.id}`);
    } catch (err) {
      toast.error("Failed to create sub-page");
    }
  };

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const saveTitle = async () => {
    if (editingId && editingTitle.trim()) {
      const newTitle = editingTitle.trim();
      try {
        const res = await updateDocumentApi(editingId, { title: newTitle });
        updateDocument(editingId, res ? (res as any) : { title: newTitle });
      } catch {
        toast.error("Failed to update title");
      }
    }
    setEditingId(null);
    setEditingTitle("");
  };



  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveTitle();
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditingTitle("");
    }
  };

  const selectDoc = (id: string) => {
    if (activeDocId !== id) {
      setActiveDoc(id);
    }
    router.push(`/docs/${id}`);
  };

  const startEditingRootTitle = () => {
    if (rootDoc) {
      setIsEditingRootTitle(true);
      setRootTitleValue(rootDoc.title);
    }
  };

  const saveRootTitle = async () => {
    if (rootId && rootTitleValue.trim()) {
      const newTitle = rootTitleValue.trim();
      try {
        const res = await updateDocumentApi(rootId, { title: newTitle });
        updateDocument(rootId, res ? (res as any) : { title: newTitle });
      } catch {
        toast.error("Failed to update title");
      }
    }
    setIsEditingRootTitle(false);
    setRootTitleValue("");
  };

  const handleRootTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveRootTitle();
    } else if (e.key === "Escape") {
      setIsEditingRootTitle(false);
      setRootTitleValue("");
    }
  };

  const handleMenuAction = (action: string, id: string, title: string) => {
    switch (action) {
      case "rename": {
        // const doc = documents.get(id);
        // if (doc && doc.parentId) {
        //   selectDoc(id);
        //   setTimeout(() => {
        //     triggerTitleEdit(id);
        //   }, 50);
        // } else {
        //   triggerTitleEdit(id);
        // }
        startEditing(id, title);
        break;
      }
      case "lock":
        {
          const newLocked = !isLocked;
          setIsLocked(newLocked);
          (newLocked ? lockDocument(id) : unlockDocument(id)).then((res) => {
            if (res) {
              updateDocument(id, res as any);
            }
          })
            .catch(() => {
              setIsLocked(!newLocked);
              toast.error("Failed to toggle lock");
            });
        }
        break;
      case "duplicate":
        {
          const doc = documents.get(id);
          if (doc) {
            const newTitle = `${doc.title} (Copy)`;
            const createPromise = doc.parentId
              ? createChildDocument(doc.parentId, newTitle)
              : createRootDocument(newTitle);

            createPromise
              .then((newDoc) => {
                if (newDoc) {
                  addDocument(newDoc as any)
                  router.push(`/docs/${newDoc.id}`);

                };
                toast.success("Document duplicated");
              })
              .catch(() => toast.error("Failed to duplicate document"));
          }
        }
        break;
      case "favorite":
        {
          const favDoc = documents.get(id);
          const newFav = !favDoc?.isFavorite;

          toggleFavorite(id);
          updateDocument(id, { isFavorite: newFav });
          updateDocumentApi(id, { isFavorite: newFav })
            .then((updated) => { if (updated) updateDocument(id, updated as any); })
            .catch(() => toast.error("Failed to toggle favorite"));
        }
        break;
      case "copy-link":
        navigator.clipboard.writeText(`${window.location.origin}/docs/${id}`);
        break;
      case "template":
        console.log("Save as template:", id);
        break;
      case "apply-template":
        console.log("Apply template:", id);
        break;
      case "new-tab":
        window.open(`/docs/${id}`, "_blank");
        break;
      case "archive":
        console.log("Archive:", id);
        break;
      case "delete":
        setItemToDelete({ id, title });
        setIsDeleteModalOpen(true);
        break;
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const isDeletingActive = itemToDelete.id === activeDocId;
    try {
      await deleteDocumentApi(itemToDelete.id);
      deleteDocument(itemToDelete.id);
      toast.success("Page deleted");
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      if (isDeletingActive) {
        router.push("/docs");
      }
    } catch {
      toast.error("Failed to delete page");
    }
  };

  const handleAddProject = (docId: string, projectId: string) => {
    const doc = getDocument(docId);
    const updatedProjects = [...(doc?.pageLinkedProjects || []), projectId];
    addPageLinkProject(docId, projectId);
    setShowLinkTabs(false);
    updateDocumentApi(docId, { pageLinkedProjects: updatedProjects })
      .then((res) => { if (res) updateDocument(docId, res as any); })
      .catch(() => toast.error("Failed to save links"));
  };

  const handleRemoveProject = (docId: string, projectId: string) => {
    const doc = getDocument(docId);
    const updatedProjects = (doc?.pageLinkedProjects || []).filter((id) => id !== projectId);
    removePageLinkProject(docId, projectId);
    updateDocumentApi(docId, { pageLinkedProjects: updatedProjects })
      .then((res) => { if (res) updateDocument(docId, res as any); })
      .catch(() => toast.error("Failed to save links"));
  };

  const handleAddTeam = (docId: string, teamId: string) => {
    const doc = getDocument(docId);
    const updatedTeams = [...(doc?.pageLinkedTeams || []), teamId];
    addPageLinkTeam(docId, teamId);
    setShowLinkTabs(false);
    updateDocumentApi(docId, { pageLinkedTeams: updatedTeams })
      .then((res) => { if (res) updateDocument(docId, res as any); })
      .catch(() => toast.error("Failed to save links"));
  };

  const handleRemoveTeam = (docId: string, teamId: string) => {
    const doc = getDocument(docId);
    const updatedTeams = (doc?.pageLinkedTeams || []).filter((id) => id !== teamId);
    removePageLinkTeam(docId, teamId);
    updateDocumentApi(docId, { pageLinkedTeams: updatedTeams })
      .then((res) => { if (res) updateDocument(docId, res as any); })
      .catch(() => toast.error("Failed to save links"));
  };

  const handleAddPortfolio = (docId: string, portfolioId: string) => {
    const doc = getDocument(docId);
    const updatedPortfolios = [...(doc?.pageLinkedPortfolios || []), portfolioId];
    addPageLinkPortfolio(docId, portfolioId);
    setShowLinkTabs(false);
    updateDocumentApi(docId, { pageLinkedPortfolios: updatedPortfolios })
      .then((res) => { if (res) updateDocument(docId, res as any); })
      .catch(() => toast.error("Failed to save links"));
  };

  const handleRemovePortfolio = (docId: string, portfolioId: string) => {
    const doc = getDocument(docId);
    const updatedPortfolios = (doc?.pageLinkedPortfolios || []).filter((id) => id !== portfolioId);
    removePageLinkPortfolio(docId, portfolioId);
    updateDocumentApi(docId, { pageLinkedPortfolios: updatedPortfolios })
      .then((res) => { if (res) updateDocument(docId, res as any); })
      .catch(() => toast.error("Failed to save links"));
  };

  const handleAddDocument = (docId: string, linkedDocId: string) => {
    const doc = getDocument(docId);
    const updatedDocs = [...(doc?.pageLinkedDocuments || []), linkedDocId];
    addPageLinkDocument(docId, linkedDocId);
    setShowLinkTabs(false);
    updateDocumentApi(docId, { pageLinkedDocuments: updatedDocs })
      .then((res) => { if (res) updateDocument(docId, res as any); })
      .catch(() => toast.error("Failed to save links"));
  };

  const handleRemoveDocument = (docId: string, linkedDocId: string) => {
    const doc = getDocument(docId);
    const updatedDocs = (doc?.pageLinkedDocuments || []).filter((id) => id !== linkedDocId);
    removePageLinkDocument(docId, linkedDocId);
    updateDocumentApi(docId, { pageLinkedDocuments: updatedDocs })
      .then((res) => { if (res) updateDocument(docId, res as any); })
      .catch(() => toast.error("Failed to save links"));
  };

  const getProjectAvatar = (project: any) => {
    if (!project?.icon) return null;
    if (project.icon.type === "file") return { type: "image", src: project.icon.presignedUrl };
    if (project.icon.type === "icon") return { type: "icon", name: project.icon.name, color: project.icon.color ?? "#6B7280" };
    return null;
  };

  const renderDocItem = (item: DocItem, level: number = 0) => {
    const isActive = activeDocId === item.id;
    const isEditing = editingId === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const paddingLeft = level * 20 + 12;

    // return (
    //   <div key={item.id} className="relative">
    //     <div
    //       className={`
    //         group flex items-center gap-2 px-2 py-1.5 rounded-md 
    //         transition-all duration-200 ease-in-out mx-1
    //         ${isActive
    //           ? "bg-[#001F3F] text-white shadow-sm"
    //           : "hover:bg-gray-100 text-gray-700"
    //         }
    //       `}
    //       style={{ paddingLeft: `${paddingLeft}px` }}
    //     >
    //       {hasChildren ? (
    //         <Button
    //           variant="ghost"
    //           size="icon"
    //           onClick={(e) => {
    //             e.stopPropagation();
    //             toggleFolder(item.id);
    //           }}
    //           className="w-4 h-4 p-0 flex items-center justify-center flex-shrink-0 hover:bg-transparent"
    //         >
    //           <ChevronRight
    //             className={`w-3.5 h-3.5 transition-transform duration-200 ${item.isOpen ? "rotate-90" : ""
    //               } ${isActive ? "text-white" : "text-gray-500"}`}
    //           />
    //         </Button>
    //       ) : (
    //         <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
    //           <FileText className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-gray-400"}`} />
    //         </div>
    //       )}

    //       {isEditing ? (
    //         <Input
    //           ref={inputRef}
    //           type="text"
    //           value={editingTitle}
    //           onChange={(e) => setEditingTitle(e.target.value)}
    //           onBlur={saveTitle}
    //           onKeyDown={handleKeyDown}
    //           className="text-sm flex-1 h-7 px-2 py-1 border-gray-300 focus-visible:ring-[#001F3F] focus-visible:border-[#001F3F]"
    //           onClick={(e) => e.stopPropagation()}
    //         />
    //       ) : (
    //         <div
    //           onClick={(e) => {
    //             e.stopPropagation();
    //             selectDoc(item.id);
    //           }}
    //           className="text-sm flex-1 truncate font-medium cursor-pointer"
    //         >
    //           {item.title}
    //         </div>
    //       )}


    //       {!isEditing && (
    //         <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
    //           <Button
    //             variant="ghost"
    //             size="icon"
    //             onClick={(e) => {
    //               e.stopPropagation();
    //               addSubPage(item.id, e);
    //             }}
    //             className={`group/add p-1 h-auto w-auto rounded transition-all ${isActive
    //               ? "hover:bg-white/20"
    //               : "hover:bg-[#001F3F]/10"
    //               }`}
    //             title="Add subpage"
    //           >
    //             <Plus
    //               className={`w-3.5 h-3.5 transition-colors ${isActive
    //                 ? "text-white group-hover/add:text-gray-200"
    //                 : "text-gray-600 group-hover/add:text-[#001F3F]"
    //                 }`}
    //             />
    //           </Button>

    //           <DropdownMenu>
    //             <DropdownMenuTrigger asChild>
    //               <Button
    //                 variant="ghost"
    //                 size="icon"
    //                 className={`group/more p-1 h-auto w-auto rounded transition-all ${isActive
    //                   ? "hover:bg-white/20"
    //                   : "hover:bg-[#001F3F]/10"
    //                   }`}
    //                 title="More options"
    //                 onClick={(e) => e.stopPropagation()}
    //               >
    //                 <MoreHorizontal
    //                   className={`w-3.5 h-3.5 transition-colors ${isActive
    //                     ? "text-white group-hover/more:text-gray-200"
    //                     : "text-gray-600 group-hover/more:text-[#001F3F]"
    //                     }`}
    //                 />
    //               </Button>
    //             </DropdownMenuTrigger>
    //             <DropdownMenuContent align="start" className="w-56">
    //               <DropdownMenuLabel className="text-xs font-semibold text-white text-center mx-1 mt-1 mb-2 px-8 py-2 rounded-lg bg-[#001F3F]">
    //                 Sharing & Permissions
    //               </DropdownMenuLabel>

    //               <DropdownMenuSeparator />

    //               <DropdownMenuItem onClick={() => handleMenuAction("rename", item.id, item.title)}>
    //                 <Edit className="w-4 h-4 mr-2" />
    //                 <span>Rename</span>
    //               </DropdownMenuItem>

    //               <DropdownMenuItem onClick={() => handleMenuAction("duplicate", item.id, item.title)}>
    //                 <Copy className="w-4 h-4 mr-2" />
    //                 <span>Duplicate</span>
    //               </DropdownMenuItem>

    //               <DropdownMenuItem onClick={() => handleMenuAction("favorite", item.id, item.title)}>
    //                 <Star className={`w-4 h-4 mr-2 ${documents.get(item.id)?.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
    //                 <span>{documents.get(item.id)?.isFavorite ? "Unfavourite" : "Mark as Favourite"}</span>
    //               </DropdownMenuItem>
    //               <DropdownMenuSeparator />
    //               <DropdownMenuSub>
    //                 <DropdownMenuSubTrigger>
    //                   <Link className="w-4 h-4 mr-2" />
    //                   <span>Link Page to</span>
    //                 </DropdownMenuSubTrigger>
    //                 <DropdownMenuSubContent className="w-80 p-0">
    //                   {(() => {
    //                     const currentDoc = documents.get(item.id);

    //                     const linkedProjectsList = currentDoc?.pageLinkedProjects?.map(id => projects.find(p => p.id === id)).filter(Boolean) || [];
    //                     const linkedTeamsList = currentDoc?.pageLinkedTeams?.map(id => teams.find(t => t.id === id)).filter(Boolean) || [];
    //                     const linkedPortfoliosList = currentDoc?.pageLinkedPortfolios?.map(id => portfolios.find(p => p.id === id)).filter(Boolean) || [];
    //                     const linkedDocumentsList = currentDoc?.pageLinkedDocuments?.map(id => documents.get(id)).filter(Boolean) || [];

    //                     const hasLinks = linkedProjectsList.length > 0 || linkedTeamsList.length > 0 || linkedPortfoliosList.length > 0 || linkedDocumentsList.length > 0;

    //                     if (hasLinks && !showLinkTabs) {
    //                       return (
    //                         <div className="p-2 space-y-1">
    //                           <div className="flex items-center justify-between px-2 py-1 mb-1">
    //                             <span className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Linked Items</span>
    //                             <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setShowLinkTabs(true); }}>
    //                               <Plus className="w-4 h-4 text-gray-500" />
    //                             </Button>
    //                           </div>
    //                           <div className="space-y-1 bg-gray-50 rounded-lg p-2">
    //                             {linkedProjectsList.map(p => {
    //                               const avatar = getProjectAvatar(p);
    //                               return (
    //                                 <div key={p?.id} className="flex items-center gap-2 py-1.5 px-2 bg-white rounded hover:bg-gray-50 group">
    //                                   {/* Project Icon */}
    //                                   <div
    //                                     className="w-5 h-5 rounded shrink-0 flex items-center justify-center overflow-hidden"
    //                                     style={{ backgroundColor: avatar?.type === "icon" ? (avatar.color + "20") : (p?.color ? p.color + "20" : "#3B82F620") }}
    //                                   >
    //                                     {avatar?.type === "image" ? (
    //                                       <img src={avatar.src} alt={p?.name} className="w-full h-full object-cover rounded" />
    //                                     ) : avatar?.type === "icon" ? (
    //                                       (() => {
    //                                         const iconObj = iconLibrary.find((i: any) => i.name === avatar.name);
    //                                         if (iconObj) {
    //                                           const IconComponent = iconObj.icon;
    //                                           return <IconComponent size={12} color={avatar.color} />;
    //                                         }
    //                                         return <span className="text-[10px] font-bold" style={{ color: p?.color ?? "#3B82F6" }}>{p?.name?.charAt(0).toUpperCase()}</span>;
    //                                       })()
    //                                     ) : (
    //                                       <span className="text-[10px] font-bold" style={{ color: p?.color ?? "#3B82F6" }}>{p?.name?.charAt(0).toUpperCase()}</span>
    //                                     )}
    //                                   </div>
    //                                   <span className="text-sm text-gray-700 flex-1 truncate">{p?.name}</span>
    //                                   <Button
    //                                     variant="ghost"
    //                                     size="sm"
    //                                     className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
    //                                     onClick={(e) => { e.stopPropagation(); handleRemoveProject(item.id, p?.id!); }}
    //                                   >
    //                                     <X className="w-3 h-3 text-gray-500" />
    //                                   </Button>
    //                                 </div>
    //                               );
    //                             })}
    //                             {/* {linkedTeamsList.map(t => (
    //                               <div key={t?.id} className="flex items-center gap-2 py-1.5 px-2 bg-white rounded hover:bg-gray-50 group">
    //                                 <span className="text-base">👥</span>
    //                                 <span className="text-sm text-gray-700 flex-1 truncate">{t?.name}</span>
    //                                 <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleRemoveTeam(item.id, t?.id!); }}>
    //                                   <X className="w-3 h-3 text-gray-500" />
    //                                 </Button>
    //                               </div>
    //                             ))} */}
    //                             {linkedPortfoliosList.map(p => (
    //                               <div key={p?.id} className="flex items-center gap-2 py-1.5 px-2 bg-white rounded hover:bg-gray-50 group">
    //                                 <span className="text-base">📂</span>
    //                                 <span className="text-sm text-gray-700 flex-1 truncate">{p?.name}</span>
    //                                 <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleRemovePortfolio(item.id, p?.id!); }}>
    //                                   <X className="w-3 h-3 text-gray-500" />
    //                                 </Button>
    //                               </div>
    //                             ))}
    //                             {linkedDocumentsList.map((d: any) => (
    //                               <div key={d.id} className="flex items-center gap-2 py-1.5 px-2 bg-white rounded hover:bg-gray-50 group">
    //                                 <span className="text-base">📄</span>
    //                                 <span className="text-sm text-gray-700 flex-1 truncate">{d.title}</span>
    //                                 <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleRemoveDocument(item.id, d.id); }}>
    //                                   <X className="w-3 h-3 text-gray-500" />
    //                                 </Button>
    //                               </div>
    //                             ))}
    //                             <Button
    //                               variant="ghost"
    //                               className="flex items-center justify-start gap-2 py-1 px-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded w-full text-left h-auto font-normal"
    //                               onClick={(e) => { e.stopPropagation(); setShowLinkTabs(true); }}
    //                             >
    //                               <Plus className="w-3 h-3" />
    //                               <span className="text-xs">Add Linked Items</span>
    //                             </Button>
    //                           </div>
    //                         </div>
    //                       );
    //                     }

    //                     // Otherwise show tabs
    //                     return (
    //                       <>
    //                         {/* Tabs Header */}
    //                         <div className="flex border-b border-gray-200 px-1 pt-1">
    //                           <Button
    //                             variant="ghost"
    //                             onClick={() => setActiveTab("project")}
    //                             className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "project" ? "text-gray-900 border-b-2 border-black -mb-[2px]" : "text-gray-500 hover:text-gray-700"}`}
    //                           >
    //                             Project
    //                           </Button>
    //                           <Button
    //                             variant="ghost"
    //                             onClick={() => setActiveTab("portfolio")}
    //                             className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "portfolio" ? "text-gray-900 border-b-2 border-black -mb-[2px]" : "text-gray-500 hover:text-gray-700"}`}
    //                           >
    //                             Portfolio
    //                           </Button>
    //                           {/* <Button
    //                             variant="ghost"
    //                             onClick={() => setActiveTab("team")}
    //                             className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "team" ? "text-gray-900 border-b-2 border-black -mb-[2px]" : "text-gray-500 hover:text-gray-700"}`}
    //                           >
    //                             Team
    //                           </Button> */}
    //                           <Button
    //                             variant="ghost"
    //                             onClick={() => setActiveTab("document")}
    //                             className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "document" ? "text-gray-900 border-b-2 border-black -mb-[2px]" : "text-gray-500 hover:text-gray-700"}`}
    //                           >
    //                             Documents
    //                           </Button>
    //                           {hasLinks && (
    //                             <Button variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setShowLinkTabs(false); }}>
    //                               <ChevronLeft className="w-3.5 h-3.5" />
    //                             </Button>
    //                           )}
    //                         </div>

    //                         {/* Tab Content */}
    //                         <div className="p-3">
    //                           {/* Empty State Logic */}
    //                           {(() => {
    //                             const config = {
    //                               project: { image: "/images/project.svg", title: "No Project found", list: projects },
    //                               portfolio: { image: "/images/portfolio-image.svg", title: "No Portfolio found", list: portfolios },
    //                               team: { image: "/images/TeamsEmpty.svg", title: "No Team found", list: teams },
    //                               document: { image: "/images/docs-image.png", title: "No Document found", list: docList }
    //                             };

    //                             const current = config[activeTab as keyof typeof config];

    //                             if (!current.list || current.list.length === 0) {
    //                               return (
    //                                 <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
    //                                   <img src={current.image} alt={current.title} className="w-16 h-16 mb-2 object-contain opacity-50" />
    //                                   <p className="text-[10px] text-gray-400 font-medium">{current.title}</p>
    //                                 </div>
    //                               );
    //                             }
    //                             return null;
    //                           })()}

    //                           {activeTab === "project" && projects.length > 0 && (
    //                             <div className="max-h-40 overflow-y-auto space-y-1">
    //                               {projects.map((p) => {
    //                                 const isSelected = currentDoc?.pageLinkedProjects?.includes(p.id!);
    //                                 const avatar = getProjectAvatar(p);
    //                                 return (
    //                                   <div
    //                                     key={p.id}
    //                                     className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer"
    //                                     onClick={() => isSelected ? handleRemoveProject(item.id, p.id!) : handleAddProject(item.id, p.id!)}
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
    //                             </div>
    //                           )}

    //                           {activeTab === "portfolio" && portfolios.length > 0 && (
    //                             <div className="max-h-40 overflow-y-auto space-y-1">
    //                               {portfolios.map((p) => {
    //                                 const isSelected = currentDoc?.pageLinkedPortfolios?.includes(p.id!);
    //                                 return (
    //                                   <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => isSelected ? handleRemovePortfolio(item.id, p.id!) : handleAddPortfolio(item.id, p.id!)}>
    //                                     <span className="text-xs text-gray-700 truncate">{p.name}</span>
    //                                     <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
    //                                   </div>
    //                                 );
    //                               })}
    //                             </div>
    //                           )}

    //                           {activeTab === "team" && teams.length > 0 && (
    //                             <div className="max-h-40 overflow-y-auto space-y-1">
    //                               {teams.map((t) => {
    //                                 const isSelected = currentDoc?.pageLinkedTeams?.includes(t.id!);
    //                                 return (
    //                                   <div key={t.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => isSelected ? handleRemoveTeam(item.id, t.id!) : handleAddTeam(item.id, t.id!)}>
    //                                     <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
    //                                     <span className="text-xs text-gray-700 truncate">{t.name}</span>
    //                                   </div>
    //                                 );
    //                               })}
    //                             </div>
    //                           )}

    //                           {activeTab === "document" && docList.length > 0 && (
    //                             <div className="max-h-40 overflow-y-auto space-y-1">
    //                               {docList.map((d) => {
    //                                 const isSelected = currentDoc?.pageLinkedDocuments?.includes(d.id);
    //                                 return (
    //                                   <div key={d.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer" onClick={() => isSelected ? handleRemoveDocument(item.id, d.id) : handleAddDocument(item.id, d.id)}>
    //                                     <span className="text-xs text-gray-700 truncate">{d.title}</span>
    //                                     <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
    //                                   </div>
    //                                 );
    //                               })}
    //                             </div>
    //                           )}
    //                         </div>
    //                       </>
    //                     );
    //                   })()}
    //                 </DropdownMenuSubContent>
    //               </DropdownMenuSub>
    //               <DropdownMenuSeparator />

    //               <DropdownMenuItem onClick={() => handleMenuAction("new-tab", item.id, item.title)}>
    //                 <ExternalLink className="w-4 h-4 mr-2" />
    //                 <span>Open in new tab</span>
    //               </DropdownMenuItem>

    //               <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
    //                 <Lock className="w-4 h-4 mr-2" />
    //                 <span>Lock page</span>
    //                 <Switch
    //                   checked={isLocked}
    //                   onCheckedChange={(checked) => {
    //                     setIsLocked(checked);
    //                     handleMenuAction("lock", item.id, item.title);
    //                   }}
    //                   onClick={(e) => e.stopPropagation()}
    //                   className="ml-auto data-[state=checked]:bg-[#001F3F]"
    //                 />
    //               </DropdownMenuItem>
    //               <DropdownMenuSeparator />








    //               <DropdownMenuItem onClick={() => handleMenuAction("template", item.id, item.title)}>
    //                 <FileTemplate className="w-4 h-4 mr-2" />
    //                 <span>Save as Template</span>
    //               </DropdownMenuItem>

    //               <DropdownMenuItem onClick={() => handleMenuAction("apply-template", item.id, item.title)}>
    //                 <Zap className="w-4 h-4 mr-2" />
    //                 <span>Apply Template</span>
    //               </DropdownMenuItem>





    //               <DropdownMenuSeparator />

    //               <DropdownMenuItem
    //                 onClick={() => handleMenuAction("delete", item.id, item.title)}
    //                 className="text-red-600 focus:text-red-600 focus:bg-red-50"
    //               >
    //                 <Trash2 className="w-4 h-4 mr-2" />
    //                 <span>Delete</span>
    //               </DropdownMenuItem>
    //             </DropdownMenuContent>
    //           </DropdownMenu>
    //         </div>
    //       )}
    //     </div>

    //     {hasChildren && item.isOpen && (
    //       <div className="overflow-hidden transition-all duration-300 ease-in-out">
    //         {item.children!.map((child) => renderDocItem(child, level + 1))}
    //       </div>
    //     )}
    //   </div>
    // );
  
     return (
      <div className="relative" key={item.id}>
        <div
          className={`
            group flex items-center gap-2 px-2 py-1.5 rounded-md 
            transition-all duration-200 ease-in-out mx-1
            ${isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "hover:bg-muted text-foreground"
            }
          `}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(item.id);
              }}
              className="w-4 h-4 p-0 flex items-center justify-center flex-shrink-0 hover:bg-transparent"
            >
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-200 ${item.isOpen ? "rotate-90" : ""
                  } ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}
              />
            </Button>
          ) : (
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              <FileText className={`w-3.5 h-3.5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </div>
          )}

          {isEditing ? (
            <Input
              ref={inputRef}
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={handleKeyDown}
              className="text-sm flex-1 h-7 px-2 py-1 border-border focus-visible:ring-primary focus-visible:border-primary text-foreground bg-background"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                selectDoc(item.id);
              }}
              className="text-sm flex-1 truncate font-medium cursor-pointer"
            >
              {item.title}
            </div>
          )}


          {!isEditing && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  addSubPage(item.id, e);
                }}
                className={`group/add p-1 h-auto w-auto rounded transition-all ${isActive
                  ? "hover:bg-primary-foreground/20"
                  : "hover:bg-primary/10"
                  }`}
                title="Add subpage"
              >
                <Plus
                  className={`w-3.5 h-3.5 transition-colors ${isActive
                    ? "text-primary-foreground group-hover/add:text-primary-foreground/80"
                    : "text-muted-foreground group-hover/add:text-primary"
                    }`}
                />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`group/more p-1 h-auto w-auto rounded transition-all ${isActive
                      ? "hover:bg-primary-foreground/20"
                      : "hover:bg-primary/10"
                      }`}
                    title="More options"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal
                      className={`w-3.5 h-3.5 transition-colors ${isActive
                        ? "text-primary-foreground group-hover/more:text-primary-foreground/80"
                        : "text-muted-foreground group-hover/more:text-primary"
                        }`}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-popover border border-border text-popover-foreground shadow-lg rounded-md">
                  <DropdownMenuLabel className="text-xs font-semibold text-primary-foreground text-center mx-1 mt-1 mb-2 px-8 py-2 rounded-lg bg-primary">
                    Sharing & Permissions
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => handleMenuAction("rename", item.id, item.title)}>
                    <Edit className="w-4 h-4 mr-2" />
                    <span>Rename</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => handleMenuAction("duplicate", item.id, item.title)}>
                    <Copy className="w-4 h-4 mr-2" />
                    <span>Duplicate</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => handleMenuAction("favorite", item.id, item.title)}>
                    <Star className={`w-4 h-4 mr-2 ${documents.get(item.id)?.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    <span>{documents.get(item.id)?.isFavorite ? "Unfavourite" : "Mark as Favourite"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Link className="w-4 h-4 mr-2" />
                      <span>Link Page to</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-80 p-0 bg-popover border border-border text-popover-foreground shadow-lg rounded-md">
                      {(() => {
                        const currentDoc = documents.get(item.id);

                        const linkedProjectsList = currentDoc?.pageLinkedProjects?.map(id => projects.find(p => p.id === id)).filter(Boolean) || [];
                        const linkedTeamsList = currentDoc?.pageLinkedTeams?.map(id => teams.find(t => t.id === id)).filter(Boolean) || [];
                        const linkedPortfoliosList = currentDoc?.pageLinkedPortfolios?.map(id => portfolios.find(p => p.id === id)).filter(Boolean) || [];
                        const linkedDocumentsList = currentDoc?.pageLinkedDocuments?.map(id => documents.get(id)).filter(Boolean) || [];

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
                              <div className="space-y-1 bg-muted/50 rounded-lg p-2">
                                {linkedProjectsList.map(p => {
                                  const avatar = getProjectAvatar(p);
                                  return (
                                    <div key={p?.id} className="flex items-center gap-2 py-1.5 px-2 bg-card border border-border rounded hover:bg-muted group">
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
                                              return <IconComponent size={12} color={avatar.color} />;
                                            }
                                            return <span className="text-[10px] font-bold" style={{ color: p?.color ?? "#3B82F6" }}>{p?.name?.charAt(0).toUpperCase()}</span>;
                                          })()
                                        ) : (
                                          <span className="text-[10px] font-bold" style={{ color: p?.color ?? "#3B82F6" }}>{p?.name?.charAt(0).toUpperCase()}</span>
                                        )}
                                      </div>
                                      <span className="text-sm text-foreground flex-1 truncate">{p?.name}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveProject(item.id, p?.id!); }}
                                      >
                                        <X className="w-3 h-3 text-muted-foreground" />
                                      </Button>
                                    </div>
                                  );
                                })}
                                {linkedPortfoliosList.map(p => (
                                  <div key={p?.id} className="flex items-center gap-2 py-1.5 px-2 bg-card border border-border rounded hover:bg-muted group">
                                    <span className="text-base">📂</span>
                                    <span className="text-sm text-foreground flex-1 truncate">{p?.name}</span>
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleRemovePortfolio(item.id, p?.id!); }}>
                                      <X className="w-3 h-3 text-muted-foreground" />
                                    </Button>
                                  </div>
                                ))}
                                {linkedDocumentsList.map((d: any) => (
                                  <div key={d.id} className="flex items-center gap-2 py-1.5 px-2 bg-card border border-border rounded hover:bg-muted group">
                                    <span className="text-base">📄</span>
                                    <span className="text-sm text-foreground flex-1 truncate">{d.title}</span>
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleRemoveDocument(item.id, d.id); }}>
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
                                className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "project" ? "text-foreground border-b-2 border-primary -mb-[2px]" : "text-muted-foreground hover:text-foreground"}`}
                              >
                                Project
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => setActiveTab("portfolio")}
                                className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "portfolio" ? "text-foreground border-b-2 border-primary -mb-[2px]" : "text-muted-foreground hover:text-foreground"}`}
                              >
                                Portfolio
                              </Button>
                              {/* <Button
                                variant="ghost"
                                onClick={() => setActiveTab("team")}
                                className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "team" ? "text-foreground border-b-2 border-primary -mb-[2px]" : "text-muted-foreground hover:text-foreground"}`}
                              >
                                Team
                              </Button> */}
                              <Button
                                variant="ghost"
                                onClick={() => setActiveTab("document")}
                                className={`px-2 py-2 text-xs font-medium transition-colors rounded-none h-auto ${activeTab === "document" ? "text-foreground border-b-2 border-primary -mb-[2px]" : "text-muted-foreground hover:text-foreground"}`}
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
                                const config = {
                                  project: { image: "/images/project.svg", title: "No Project found", list: projects },
                                  portfolio: { image: "/images/portfolio-image.svg", title: "No Portfolio found", list: portfolios },
                                  team: { image: "/images/TeamsEmpty.svg", title: "No Team found", list: teams },
                                  document: { image: "/images/docs-image.png", title: "No Document found", list: docList }
                                };

                                const current = config[activeTab as keyof typeof config];

                                if (!current.list || current.list.length === 0) {
                                  return (
                                    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                                      <img src={current.image} alt={current.title} className="w-16 h-16 mb-2 object-contain opacity-50 dark:brightness-90 dark:contrast-125" />
                                      <p className="text-[10px] text-muted-foreground font-medium">{current.title}</p>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {activeTab === "project" && projects.length > 0 && (
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                  {projects.map((p) => {
                                    const isSelected = currentDoc?.pageLinkedProjects?.includes(p.id!);
                                    const avatar = getProjectAvatar(p);
                                    return (
                                      <div
                                        key={p.id}
                                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted cursor-pointer"
                                        onClick={() => isSelected ? handleRemoveProject(item.id, p.id!) : handleAddProject(item.id, p.id!)}
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
                                </div>
                              )}

                              {activeTab === "portfolio" && portfolios.length > 0 && (
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                  {portfolios.map((p) => {
                                    const isSelected = currentDoc?.pageLinkedPortfolios?.includes(p.id!);
                                    return (
                                      <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted cursor-pointer" onClick={() => isSelected ? handleRemovePortfolio(item.id, p.id!) : handleAddPortfolio(item.id, p.id!)}>
                                        <span className="text-xs text-foreground truncate">{p.name}</span>
                                        <Checkbox checked={isSelected} className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {activeTab === "team" && teams.length > 0 && (
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                  {teams.map((t) => {
                                    const isSelected = currentDoc?.pageLinkedTeams?.includes(t.id!);
                                    return (
                                      <div key={t.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted cursor-pointer" onClick={() => isSelected ? handleRemoveTeam(item.id, t.id!) : handleAddTeam(item.id, t.id!)}>
                                        <span className="text-xs text-foreground truncate">{t.name}</span>
                                        <Checkbox checked={isSelected} className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {activeTab === "document" && docList.length > 0 && (
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                  {docList.map((d) => {
                                    const isSelected = currentDoc?.pageLinkedDocuments?.includes(d.id);
                                    return (
                                      <div key={d.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted cursor-pointer" onClick={() => isSelected ? handleRemoveDocument(item.id, d.id) : handleAddDocument(item.id, d.id)}>
                                        <span className="text-xs text-foreground truncate">{d.title}</span>
                                        <Checkbox checked={isSelected} className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
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

                  <DropdownMenuItem onClick={() => handleMenuAction("new-tab", item.id, item.title)}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    <span>Open in new tab</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Lock className="w-4 h-4 mr-2" />
                    <span>Lock page</span>
                    <Switch
                      checked={isLocked}
                      onCheckedChange={(checked) => {
                        setIsLocked(checked);
                        handleMenuAction("lock", item.id, item.title);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto data-[state=checked]:bg-primary"
                    />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />








                  <DropdownMenuItem onClick={() => handleMenuAction("template", item.id, item.title)}>
                    <FileTemplate className="w-4 h-4 mr-2" />
                    <span>Save as Template</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => handleMenuAction("apply-template", item.id, item.title)}>
                    <Zap className="w-4 h-4 mr-2" />
                    <span>Apply Template</span>
                  </DropdownMenuItem>





                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => handleMenuAction("delete", item.id, item.title)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {hasChildren && item.isOpen && (
          <div className="overflow-hidden transition-all duration-300 ease-in-out">
            {item.children!.map((child) => renderDocItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // return (
  //   <div className="h-full w-64 flex flex-col bg-[#F9F9F9] border-r border-gray-200">
  //     {/* Header */}
  //     {/* <div className="flex items-center justify-between p-2 border-b border-gray-50 flex-shrink-0 bg-white shadow-sm">
  //       {isEditingRootTitle ? (
  //         <Input
  //           ref={rootTitleInputRef}
  //           type="text"
  //           value={rootTitleValue}
  //           onChange={(e) => setRootTitleValue(e.target.value)}
  //           onBlur={saveRootTitle}
  //           onKeyDown={handleRootTitleKeyDown}
  //           className="text-sm font-semibold h-8 px-2 py-1 flex-1 focus-visible:ring-[#001F3F] focus-visible:border-[#001F3F]"
  //         />
  //       ) : (
  //         <Button
  //           variant="ghost"
  //           onDoubleClick={startEditingRootTitle}
  //           className="text-sm font-semibold h-auto px-2 py-1 justify-start hover:bg-gray-100 text-gray-800"
  //         >
  //           {rootDoc ? rootDoc.title : "Docs"}
  //         </Button>
  //       )}

  //       {onCollapse && (
  //         <Button
  //           variant="ghost"
  //           size="icon"
  //           onClick={onCollapse}
  //           className="h-8 w-8 hover:bg-gray-100"
  //         >
  //           <ChevronLeft className="w-4 h-4 text-gray-600" />
  //         </Button>
  //       )}
  //     </div> */}

  //     {/* Sidebar Header with Root Title */}
  //     <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0 bg-white">
  //       <div className="flex items-center gap-2 overflow-hidden flex-1">
  //         <DropdownMenu>
  //           <DropdownMenuTrigger asChild>
  //             {/* <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors group">
  //               <img
  //                 src="/images/DocsIcon.svg"
  //                 className="w-5 h-5 flex-shrink-0"
  //                 style={{ filter: "brightness(0.3)" }}
  //                 alt="Docs"
  //               />
  //               {isEditingRootTitle ? (
  //                 <Input
  //                   ref={rootTitleInputRef}
  //                   type="text"
  //                   value={rootTitleValue}
  //                   onChange={(e) => setRootTitleValue(e.target.value)}
  //                   onBlur={saveRootTitle}
  //                   onKeyDown={handleRootTitleKeyDown}
  //                   className="text-sm font-semibold h-7 px-2 py-1 focus-visible:ring-0 border-none bg-transparent shadow-none"
  //                   onClick={(e) => e.stopPropagation()}
  //                 />
  //               ) : (
  //                 <span className="text-sm font-semibold text-[#1C1C1E] truncate"
  //                   onDoubleClick={startEditingRootTitle}>
  //                   {rootDoc?.title || ""}
  //                 </span>
  //               )}
  //             </div> */}
  //             <div className="flex items-center gap-2 p-1">
  //               <span className="text-sm font-semibold text-[#1C1C1E]">Pages</span>
  //             </div>
  //           </DropdownMenuTrigger>
  //           <DropdownMenuContent align="start" className="w-56">
  //             {/* <DropdownMenuItem onClick={startEditingRootTitle}>
  //               <Edit className="w-4 h-4 mr-2" />
  //               Rename
  //             </DropdownMenuItem> */}
  //             <DropdownMenuItem onClick={() => rootId && triggerTitleEdit(rootId)}>
  //               <Edit className="w-4 h-4 mr-2" />
  //               Rename
  //             </DropdownMenuItem>
  //             <DropdownMenuItem onClick={() => rootId && handleMenuAction("duplicate", rootId, rootDoc?.title || "")}>
  //               <Copy className="w-4 h-4 mr-2" />
  //               Duplicate
  //             </DropdownMenuItem>
  //             <DropdownMenuItem onClick={() => rootId && handleMenuAction("delete", rootId, rootDoc?.title || "")}>
  //               <Trash2 className="w-4 h-4 mr-2 text-red-500" />
  //               <span className="text-red-500">Delete</span>
  //             </DropdownMenuItem>
  //           </DropdownMenuContent>
  //         </DropdownMenu>

  //         {/* Expand/Collapse Buttons next to Title */}
  //         {/* <div className="flex items-center gap-0.5 ml-1">
  //           <Button
  //             variant="ghost"
  //             size="icon"
  //             onClick={collapseAll}
  //             className="h-6 w-6 text-[#8E8E93] hover:bg-gray-100 p-1"
  //             title="Collapse all"
  //           >
  //             <img src="/images/docsChevronUp.svg" className="w-3 h-3" alt="Collapse all" />
  //           </Button>
  //           <Button
  //             variant="ghost"
  //             size="icon"
  //             onClick={expandAll}
  //             className="h-6 w-6 text-[#8E8E93] hover:bg-gray-100 p-1"
  //             title="Expand all"
  //           >
  //             <img src="/images/docsChevronDown.svg" className="w-3.5 h-3.5" alt="Expand all" />
  //           </Button>
  //         </div> */}
  //       </div>

  //       {onCollapse && (
  //         <Button
  //           variant="ghost"
  //           size="icon"
  //           onClick={onCollapse}
  //           className="h-8 w-8 text-[#8E8E93] hover:bg-gray-100"
  //           title="Collapse sidebar"
  //         >
  //           <PanelLeftClose className="w-4 h-4" />
  //         </Button>
  //       )}
  //     </div>



  //     <ScrollArea className="flex-1">
  //       <div className="py-2">
  //         {childPages.map((item) => renderDocItem(item))}

  //         <Button
  //           variant="ghost"
  //           onClick={addNewPage}
  //           className="w-full justify-start gap-2 px-4 py-2.5 mt-2 text-sm text-[#8E8E93] hover:bg-gray-50 font-medium h-auto relative before:absolute before:top-0 before:left-4 before:right-4 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gray-200 before:to-transparent"
  //         >
  //           <Plus className="w-4 h-4" />
  //           <span>Add page</span>
  //         </Button>
  //       </div>
  //       <ConfirmationModal
  //         open={isDeleteModalOpen}
  //         onClose={() => setIsDeleteModalOpen(false)}
  //         title="Delete Page"
  //         confirmLabel="Delete"
  //         onConfirm={handleConfirmDelete}
  //         description={`Are you sure you want to delete "${itemToDelete?.title}"? This action is permanent and cannot be undone.`}
  //       />
  //     </ScrollArea>
  //   </div>
  // );
 return (
    <div className="h-full w-64 flex flex-col bg-background border-r border-border">
      {/* Header */}
      {/* <div className="flex items-center justify-between p-2 border-b border-gray-50 flex-shrink-0 bg-white shadow-sm">
        {isEditingRootTitle ? (
          <Input
            ref={rootTitleInputRef}
            type="text"
            value={rootTitleValue}
            onChange={(e) => setRootTitleValue(e.target.value)}
            onBlur={saveRootTitle}
            onKeyDown={handleRootTitleKeyDown}
            className="text-sm font-semibold h-8 px-2 py-1 flex-1 focus-visible:ring-[#001F3F] focus-visible:border-[#001F3F]"
          />
        ) : (
          <Button
            variant="ghost"
            onDoubleClick={startEditingRootTitle}
            className="text-sm font-semibold h-auto px-2 py-1 justify-start hover:bg-gray-100 text-gray-800"
          >
            {rootDoc ? rootDoc.title : "Docs"}
          </Button>
        )}

        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            className="h-8 w-8 hover:bg-gray-100"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </Button>
        )}
      </div> */}

      {/* Sidebar Header with Root Title */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0 bg-background">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors group">
                <img
                  src="/images/DocsIcon.svg"
                  className="w-5 h-5 flex-shrink-0"
                  style={{ filter: "brightness(0.3)" }}
                  alt="Docs"
                />
                {isEditingRootTitle ? (
                  <Input
                    ref={rootTitleInputRef}
                    type="text"
                    value={rootTitleValue}
                    onChange={(e) => setRootTitleValue(e.target.value)}
                    onBlur={saveRootTitle}
                    onKeyDown={handleRootTitleKeyDown}
                    className="text-sm font-semibold h-7 px-2 py-1 focus-visible:ring-0 border-none bg-transparent shadow-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm font-semibold text-[#1C1C1E] truncate"
                    onDoubleClick={startEditingRootTitle}>
                    {rootDoc?.title || ""}
                  </span>
                )}
              </div> */}
              <div className="flex items-center gap-2 p-1">
                <span className="text-sm font-semibold text-foreground">Pages</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {/* <DropdownMenuItem onClick={startEditingRootTitle}>
                <Edit className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem> */}
              <DropdownMenuItem onClick={() => rootId && triggerTitleEdit(rootId)}>
                <Edit className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => rootId && handleMenuAction("duplicate", rootId, rootDoc?.title || "")}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => rootId && handleMenuAction("delete", rootId, rootDoc?.title || "")}>
                <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                <span className="text-red-500">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Expand/Collapse Buttons next to Title */}
          {/* <div className="flex items-center gap-0.5 ml-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={collapseAll}
              className="h-6 w-6 text-[#8E8E93] hover:bg-gray-100 p-1"
              title="Collapse all"
            >
              <img src="/images/docsChevronUp.svg" className="w-3 h-3" alt="Collapse all" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={expandAll}
              className="h-6 w-6 text-[#8E8E93] hover:bg-gray-100 p-1"
              title="Expand all"
            >
              <img src="/images/docsChevronDown.svg" className="w-3.5 h-3.5" alt="Expand all" />
            </Button>
          </div> */}
        </div>

        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            className="h-8 w-8 text-muted-foreground hover:bg-muted"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        )}
      </div>



      <ScrollArea className="flex-1">
        <div className="py-2">
          {childPages.map((item) => renderDocItem(item))}

          <Button
            variant="ghost"
            onClick={addNewPage}
            className="w-full justify-start gap-2 px-4 py-2.5 mt-2 text-sm text-muted-foreground hover:bg-muted font-medium h-auto relative before:absolute before:top-0 before:left-4 before:right-4 before:h-px before:bg-gradient-to-r before:from-transparent before:via-border before:to-transparent"
          >
            <Plus className="w-4 h-4" />
            <span>Add page</span>
          </Button>
        </div>
        <ConfirmationModal
          open={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Page"
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          description={`Are you sure you want to delete "${itemToDelete?.title}"? This action is permanent and cannot be undone.`}
        />
      </ScrollArea>
    </div>
  );

}
