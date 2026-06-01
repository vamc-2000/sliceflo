"use client";

import * as React from "react";
import { FileText, Plus, Table2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useDocStore } from "@/stores/useDoc-store";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, ChevronDown, ChevronDownIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateDocument as updateDocumentApi } from "@/lib/api/documents-api";
import toast from "react-hot-toast";

interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  portfolioId?: string;
}

export function CreateDocumentDialog({ open, onOpenChange, projectId, portfolioId }: CreateDocumentDialogProps) {
  const router = useRouter();
  const { documents, addProjectToDocument, addPageLinkProject, removeProjectFromDocument, addPortfolioToDocument,
    addPageLinkPortfolio, } = useDocStore();
  const [selectedDocs, setSelectedDocs] = React.useState<Set<string>>(new Set());
  const [expandedDocs, setExpandedDocs] = React.useState<Set<string>>(new Set());

  const allDocs = Array.from(documents.values());
  const rootDocs = allDocs.filter(doc => !doc.parentId);

  const toggleExpand = (docId: string) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocs(newExpanded);
  };

  const toggleSelect = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    const doc = documents.get(docId);
    if (!doc) return;

    const isSelecting = !newSelected.has(docId);

    if (!doc.parentId) {
      const selectRecursive = (id: string, select: boolean) => {
        if (select) {
          newSelected.add(id);
        } else {
          newSelected.delete(id);
        }
        const children = allDocs.filter(d => d.parentId === id);
        children.forEach(child => selectRecursive(child.id, select));
      };

      selectRecursive(docId, isSelecting);
    } else {

      if (isSelecting) {
        newSelected.add(docId);
      } else {
        newSelected.delete(docId);
      }
    }

    setSelectedDocs(newSelected);
  };

  const handleAddSelected = async (parentDocId: string) => {
    if (!projectId && !portfolioId) return;

    const getSelectionForHiearchy = (docId: string): string[] => {
      const selections: string[] = [docId];
      const children = Array.from(documents.values()).filter(d => d.parentId === docId);
      children.forEach(child => {
        selections.push(...getSelectionForHiearchy(child.id));
      });
      return selections;
    };

    const selections = getSelectionForHiearchy(parentDocId);

    // Use Promise.all to handle multiple API calls efficiently
    const updatePromises = selections.map(async (docId) => {
      const doc = documents.get(docId);
      if (doc) {
        const updates: any = {};
        
        if (projectId) {
          if (!doc.parentId) {
            addProjectToDocument(docId, projectId);
            updates.linkedProjects = [...(doc.linkedProjects || []), projectId];
          } else {
            addPageLinkProject(docId, projectId);
            updates.pageLinkedProjects = [...(doc.pageLinkedProjects || []), projectId];
          }
        }
        
        if (portfolioId) {
          if (!doc.parentId) {
            addPortfolioToDocument(docId, portfolioId);
            updates.linkedPortfolios = [...(doc.linkedPortfolios || []), portfolioId];
          } else {
            addPageLinkPortfolio(docId, portfolioId);
            updates.pageLinkedPortfolios = [...(doc.pageLinkedPortfolios || []), portfolioId];
          }
        }

        if (Object.keys(updates).length > 0) {
          try {
            await updateDocumentApi(docId, updates);
          } catch (error) {
            console.error(`Failed to update document ${docId}:`, error);
          }
        }
      }
    });

    await Promise.all(updatePromises);

    const newSelected = new Set(selectedDocs);
    selections.forEach(id => newSelected.delete(id));
    setSelectedDocs(newSelected);

    if (newSelected.size === 0) {
      onOpenChange(false);
      toast.success("Documents linked successfully");
    }
  };

  const getSubPageCount = React.useCallback((docId: string): number => {
    const children = allDocs.filter(d => d.parentId === docId);
    let count = children.length;
    children.forEach(child => {
      count += getSubPageCount(child.id);
    });
    return count;
  }, [allDocs]);

  const getDocCreator = React.useCallback((docId: string) => {
    const doc = documents.get(docId);
    if (!doc) return null;
    if (doc.createdBy) return doc.createdBy;
    if (doc.parentId) return getDocCreator(doc.parentId);
    return null;
  }, [documents]);

  const renderDocTree = (doc: any, level = 0) => {
    const children = allDocs.filter(d => d.parentId === doc.id);
    const isExpanded = expandedDocs.has(doc.id);
    const isSelected = selectedDocs.has(doc.id);
    const hasChildren = children.length > 0;
    const isLinked = projectId
      ? (doc.linkedProjects?.includes(projectId) || doc.pageLinkedProjects?.includes(projectId))
      : (doc.linkedPortfolios?.includes(portfolioId) || doc.pageLinkedPortfolios?.includes(portfolioId));
    const creator = getDocCreator(doc.id);

    return (
      <div key={doc.id} className="w-full">
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-50 transition-colors group cursor-pointer",
            level === 0 ? "text-[13px] font-semibold text-gray-800" : "text-[12px] text-gray-500"
          )}
          onClick={() => level === 0 && toggleExpand(doc.id)}
        >
          {level === 0 && (
            <div className="p-0.5 rounded text-gray-400">
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          )}
          <div className={cn("flex items-center gap-2 flex-1 min-w-0", level > 0 && "pl-6")}>
            {!doc.parentId ? (
              <img src="/images/docsidebar.svg" alt="doc" className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <FileText className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            )}
            <span className={cn("truncate", isLinked && "text-gray-400 font-normal")}>
              {doc.title}
            </span>
            {!doc.parentId && (
              <span className="text-[10px] text-gray-400 font-normal shrink-0 ml-1">
                ({getSubPageCount(doc.id)} Pages)
              </span>
            )}
            {isLinked && (
              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-1">
                Linked
              </span>
            )}
          </div>
          <Checkbox
            checked={isLinked || isSelected}
            disabled={isLinked}
            onCheckedChange={() => {
              if (!isLinked) toggleSelect(doc.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "border-gray-300 data-[state=checked]:bg-[#0b213e] data-[state=checked]:border-[#0b213e] h-5 w-5 rounded",
              isLinked && "opacity-50 cursor-not-allowed data-[state=checked]:bg-gray-300 data-[state=checked]:border-gray-300"
            )}
          />
        </div>

        {isExpanded && hasChildren && (
          <div className="w-full">
            {children.map(child => renderDocTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleCreateEmptyDocument = () => {
    onOpenChange(false);
    let url = `/docs/create`;
    if (projectId) url = `/docs/create?projectId=${projectId}&from=project`;
    else if (portfolioId) url = `/docs/create?portfolioId=${portfolioId}&from=portfolio`;
    router.push(url);
  };

  const handleUseTemplates = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-8 gap-0 bg-gray-50">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-semibold text-center">
            Create a new Document?
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            How would you like to start?
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 px-6 mb-6 mt-2">
          {/* Use Templates Card */}
          <div className="p-3 bg-white border border-gray-100 rounded-[24px] shadow-sm aspect-square overflow-hidden hover:shadow-md hover:border-blue-100 transition-all group">
            <button
              onClick={handleUseTemplates}
              className="w-full h-full flex flex-col items-center justify-center p-6 rounded-[20px] bg-[#eef5ff] hover:bg-[#e5f1ff] transition-all cursor-pointer gap-6"
            >
              <div className="w-28 h-28 rounded-full bg-[#ffcd3c] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                <div className="relative">
                  <FileText className="w-12 h-12 text-white fill-white/20" />
                  <FileText className="w-10 h-10 text-white fill-white absolute -top-1.5 -right-1.5 border-2 border-[#ffcd3c] rounded" />
                </div>
              </div>
              <span className="text-[15px] font-bold text-[#0b213e]">
                Use templates
              </span>
            </button>
          </div>

          {/* Create Empty Document Card */}
          <div className="p-3 bg-white border border-gray-100 rounded-[24px] shadow-sm aspect-square overflow-hidden hover:shadow-lg hover:border-blue-100 transition-all group">
            <button
              onClick={handleCreateEmptyDocument}
              className="w-full h-full flex flex-col items-center justify-center p-6 rounded-[20px] bg-white transition-all cursor-pointer gap-6"
            >
              <div className="w-28 h-28 rounded-full bg-[#f1f4f9] flex items-center justify-center group-hover:scale-105 transition-transform duration-300 relative shadow-inner">
                <FileText className="w-12 h-12 text-gray-400" />
                <div className="absolute top-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-sm -mr-3 -mt-3">
                  <div className="w-full h-full rounded-full bg-[#eef5ff] flex items-center justify-center">
                    <Plus className="w-5 h-5 text-[#0b213e] stroke-[3px]" />
                  </div>
                </div>
              </div>
              <span className="text-[15px] font-bold text-[#0b213e]">
                Create empty document
              </span>
            </button>
          </div>
        </div>

        {/* Add from existing section */}
        {(projectId || portfolioId) && (
          <div className="px-6 pb-8 mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Add from existing Doc</h3>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-10 w-fit min-w-[140px] items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-2 text-sm text-gray-400 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all hover:border-gray-200 outline-none gap-2">
                  <span>Select Doc</span>
                  <ChevronDownIcon className="h-4 w-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-80 p-0 bg-white border border-gray-100 shadow-xl rounded-xl"
                align="start"
                onCloseAutoFocus={(e) => e.preventDefault()} // Prevent closing on selection if desired, or handle appropriately
              >
                <div className="p-4 border-b">
                  <h3 className="text-sm font-semibold">Select Document</h3>
                </div>
                <ScrollArea className="h-[300px] p-4">
                  <div className="space-y-1">
                    {rootDocs.length > 0 ? (
                      rootDocs.map(doc => renderDocTree(doc))
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-sm italic">
                        No documents found
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <Button
                    onClick={() => {
                      // Call handleAddSelected for each rootDoc that has selections in its hierarchy
                      rootDocs.forEach(root => handleAddSelected(root.id));
                    }}
                    disabled={selectedDocs.size === 0}
                    className="w-full h-8 bg-[#0b213e] text-white rounded-lg text-sm font-semibold hover:bg-[#162e4d] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center"
                  >
                    Add Selected
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}



// "use client";

// import { useState } from "react";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Card, CardContent } from "@/components/ui/card";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Input } from "@/components/ui/input";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   ChevronDown,
//   ChevronRight,
//   Plus,
//   Search,
//   MoreHorizontal,
//   Info,
//   FileText,
//   Star,
// } from "lucide-react";
// import { cn } from "@/lib/utils";

// // ─────────────────────────────────────────────
// // DATA
// // ─────────────────────────────────────────────

// const WORKLOAD_STATUSES = [
//   { label: "Backlog", count: 0, bg: "bg-orange-400" },
//   { label: "Not started", count: 0, bg: "bg-gray-300" },
//   { label: "Working on", count: 0, bg: "bg-blue-500" },
//   { label: "Completed", count: 0, bg: "bg-green-500" },
//   { label: "Canceled", count: 0, bg: "bg-red-500" },
// ];

// const STANDUPS = [
//   { id: 1, title: "Standup 1" },
//   { id: 2, title: "Standup 2" },
//   { id: 3, title: "Standup 3" },
//   { id: 4, title: "Standup 4" },
//   { id: 5, title: "Standup 5" },
//   { id: 6, title: "Standup 6" },
//   { id: 7, title: "Standup 7" },
// ];

// const STANDUP_TEXT =
//   "In the last 7 days, I've focused on completing design and approval tasks, preparing for upcoming high-priority launches, and ensuring...";

// const MY_WORK_TASKS: Record<
//   string,
//   { id: string; name: string; project: string }[]
// > = {
//   overdue: [],
//   todo: [
//     { id: "1", name: "Task Aaa", project: "Project A" },
//     { id: "2", name: "Task C", project: "Project CC" },
//     { id: "3", name: "Task D", project: "Project A" },
//     { id: "4", name: "Task E", project: "Project A" },
//     { id: "5", name: "Task F", project: "Project K" },
//   ],
//   inprogress: [],
//   done: [],
// };

// const TASK_GROUPS = [
//   {
//     key: "todo",
//     label: "To Do",
//     labelColor: "text-blue-600",
//     borderColor: "border-l-blue-500",
//     dotColor: "bg-blue-500",
//     taskCount: 3,
//     subtaskCount: 2,
//     tasks: [
//       {
//         id: "t1",
//         name: "Changes for Account Settings",
//         assignee: "BM",
//         date: "10 Dec",
//         priority: "high",
//         hasChild: true,
//       },
//     ],
//   },
//   {
//     key: "done",
//     label: "Done",
//     labelColor: "text-green-600",
//     borderColor: "border-l-green-500",
//     dotColor: "bg-green-500",
//     taskCount: 3,
//     subtaskCount: 2,
//     tasks: [] as {
//       id: string;
//       name: string;
//       assignee: string;
//       date: string;
//       priority: string;
//       hasChild: boolean;
//     }[],
//   },
// ];

// const PERSONAL_ITEMS = [
//   { id: "1", name: "Task Aaa", project: "Project A" },
//   { id: "2", name: "Task C", project: "Project CC" },
//   { id: "3", name: "Task D", project: "Project A" },
//   { id: "4", name: "Task E", project: "Project A" },
//   { id: "5", name: "Task F", project: "Project K" },
// ];

// const STARRED_ITEMS = [
//   { id: "1", name: "D-Link", project: "Docs", starred: false },
//   { id: "2", name: "Task F", project: "Project K", starred: false },
//   { id: "3", name: "Task Aaa", project: "Project A", starred: true },
//   { id: "4", name: "Platinum Tier", project: "Docs", starred: false },
//   { id: "5", name: "Task Q", project: "Project D", starred: false },
// ];

// const PROJECTS = [
//   { id: "pb", name: "Project B", color: "bg-purple-500" },
//   { id: "p2", name: "Project 2", color: "bg-red-500" },
//   { id: "p3", name: "Project 3", color: "bg-green-500" },
//   { id: "p4", name: "Project 4", color: "bg-blue-600" },
//   { id: "p5", name: "Project 5", color: "bg-yellow-400" },
//   { id: "p6", name: "Project 6", color: "bg-teal-500" },
//   { id: "p7", name: "Project 7", color: "bg-pink-500" },
//   { id: "p8", name: "Project 8", color: "bg-orange-400" },
//   { id: "p9", name: "Project 9", color: "bg-emerald-500" },
// ];

// const RECENTS = [
//   { name: "Task Aaa", sub: "Project A" },
//   { name: "D-Link", sub: "Docs" },
//   { name: "Task B", sub: "Project B" },
//   { name: "Task C", sub: "Project CC" },
//   { name: "Task D", sub: "Project A" },
//   { name: "Task E", sub: "Project A" },
//   { name: "Task F", sub: "Project K" },
//   { name: "Platinum Tier", sub: "Docs" },
//   { name: "Task G", sub: "Project A" },
//   { name: "Task Aaa", sub: "Project W" },
//   { name: "Task Q", sub: "Project D" },
// ];

// // ─────────────────────────────────────────────
// // PRIORITY BADGE
// // ─────────────────────────────────────────────

// function PriorityBadge({ priority }: { priority: string }) {
//   const map: Record<string, { label: string; className: string }> = {
//     urgent: {
//       label: "Urgent",
//       className: "bg-red-100 text-red-600 border-red-200",
//     },
//     high: {
//       label: "High",
//       className: "bg-orange-100 text-orange-600 border-orange-200",
//     },
//     medium: {
//       label: "Medium",
//       className: "bg-yellow-100 text-yellow-600 border-yellow-200",
//     },
//     low: {
//       label: "Low",
//       className: "bg-blue-100 text-blue-600 border-blue-200",
//     },
//   };
//   const p = map[priority] ?? map.low;
//   return (
//     <span
//       className={cn(
//         "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
//         p.className
//       )}
//     >
//       <span className="h-1.5 w-1.5 rounded-full bg-current" />
//       {p.label}
//     </span>
//   );
// }

// // ─────────────────────────────────────────────
// // WORKLOAD BAR
// // ─────────────────────────────────────────────

// function WorkloadBar() {
//   return (
//     <div className="flex flex-col gap-3">
//       {/* Title row */}
//       <div className="flex items-center justify-between">
//         <h1 className="text-base font-bold tracking-tight">Workload</h1>
//         <Select defaultValue="all">
//           <SelectTrigger className="h-8 w-24 text-xs">
//             <SelectValue placeholder="All" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>
//       {/* 5 status cards */}
//       <div className="grid grid-cols-5 gap-3">
//         {WORKLOAD_STATUSES.map((s) => (
//           <Card
//             key={s.label}
//             className="cursor-pointer rounded-xl border shadow-none transition-shadow hover:shadow-sm"
//           >
//             <CardContent className="flex items-center gap-3 p-4">
//               <span
//                 className={cn("h-10 w-10 shrink-0 rounded-lg", s.bg)}
//               />
//               <div className="flex flex-col gap-0.5">
//                 <span className="text-2xl font-bold leading-none">
//                   {s.count}
//                 </span>
//                 <span className="text-[11px] text-muted-foreground">
//                   {s.label}
//                 </span>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// // STANDUPS
// // ─────────────────────────────────────────────

// function StandupsPanel() {
//   return (
//     <div className="flex flex-col gap-3">
//       <h2 className="text-sm font-semibold tracking-tight">Standups</h2>
//       {STANDUPS.map((s) => (
//         <Card
//           key={s.id}
//           className="flex flex-col gap-2 rounded-xl border p-4 shadow-none transition-shadow hover:shadow-sm"
//         >
//           <p className="text-sm font-semibold">{s.title}</p>
//           <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
//             {STANDUP_TEXT}
//           </p>
//           <button className="self-end text-[11px] font-medium text-blue-500 hover:underline">
//             Details
//           </button>
//         </Card>
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// // MY WORK
// // ─────────────────────────────────────────────

// const TAB_CONFIG = [
//   { value: "overdue", label: "Overdue" },
//   { value: "todo", label: "To Do" },
//   { value: "inprogress", label: "In Progress" },
//   { value: "done", label: "Done" },
// ] as const;

// function MyWorkPanel() {
//   return (
//     <div className="flex flex-col gap-3">
//       <h2 className="text-sm font-semibold tracking-tight">My work</h2>
//       <Card className="rounded-xl border shadow-none">
//         <Tabs defaultValue="todo">
//           {/* Tab header */}
//           <div className="border-b px-4">
//             <TabsList className="h-10 gap-0 bg-transparent p-0">
//               {TAB_CONFIG.map((t) => (
//                 <TabsTrigger
//                   key={t.value}
//                   value={t.value}
//                   className="h-10 border-b-2 border-transparent px-4 text-xs font-medium text-muted-foreground transition-none data-[state=active]:border-gray-800 data-[state=active]:bg-transparent data-[state=active]:text-gray-800 data-[state=active]:shadow-none"
//                 >
//                   {t.label}
//                 </TabsTrigger>
//               ))}
//             </TabsList>
//           </div>
//           {TAB_CONFIG.map(({ value }) => (
//             <TabsContent key={value} value={value} className="m-0">
//               <ScrollArea className="h-[200px]">
//                 {MY_WORK_TASKS[value].length === 0 ? (
//                   <div className="flex h-[180px] flex-col items-center justify-center gap-2 text-muted-foreground">
//                     <FileText className="h-8 w-8 opacity-30" />
//                     <p className="text-xs">No tasks here</p>
//                   </div>
//                 ) : (
//                   <div className="flex flex-col py-1">
//                     {MY_WORK_TASKS[value].map((task) => (
//                       <div
//                         key={task.id}
//                         className="group flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted/50"
//                       >
//                         <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
//                         <span className="flex-1 truncate text-sm font-medium">
//                           {task.name}
//                         </span>
//                         <span className="text-xs text-muted-foreground">
//                           {task.project}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </ScrollArea>
//             </TabsContent>
//           ))}
//         </Tabs>
//       </Card>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// // PERSONAL LIST
// // ─────────────────────────────────────────────

// const PERSONAL_TABS = [
//   { value: "overdue", label: "Overdue" },
//   { value: "todo", label: "To Do" },
//   { value: "done", label: "Done" },
// ] as const;

// function PersonalListPanel() {
//   return (
//     <div className="flex flex-col gap-3">
//       <div className="flex items-center justify-between">
//         <h2 className="text-sm font-semibold tracking-tight">Personal list</h2>
//         <div className="flex items-center gap-1">
//           <div className="flex items-center gap-1 rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-500">
//             <Search className="h-3 w-3" />
//             <span>Search</span>
//           </div>
//           <button className="rounded p-1 hover:bg-gray-100">
//             <MoreHorizontal className="h-4 w-4 text-gray-400" />
//           </button>
//         </div>
//       </div>
//       <Card className="rounded-xl border shadow-none">
//         <Tabs defaultValue="todo">
//           <div className="border-b px-4">
//             <TabsList className="h-10 gap-0 bg-transparent p-0">
//               {PERSONAL_TABS.map((t) => (
//                 <TabsTrigger
//                   key={t.value}
//                   value={t.value}
//                   className="h-10 border-b-2 border-transparent px-4 text-xs font-medium text-muted-foreground transition-none data-[state=active]:border-gray-800 data-[state=active]:bg-transparent data-[state=active]:text-gray-800 data-[state=active]:shadow-none"
//                 >
//                   {t.label}
//                 </TabsTrigger>
//               ))}
//             </TabsList>
//           </div>
//           {PERSONAL_TABS.map(({ value }) => (
//             <TabsContent key={value} value={value} className="m-0">
//               <ScrollArea className="h-[200px]">
//                 {value === "todo" ? (
//                   <div className="flex flex-col py-1">
//                     {PERSONAL_ITEMS.map((item) => (
//                       <div
//                         key={item.id}
//                         className="group flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted/50"
//                       >
//                         <div className="h-3 w-3 shrink-0 rounded-sm border border-gray-300" />
//                         <span className="flex-1 truncate text-sm font-medium">
//                           {item.name}
//                         </span>
//                         <span className="text-xs text-muted-foreground">
//                           {item.project}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="flex h-[180px] flex-col items-center justify-center gap-2 text-muted-foreground">
//                     <FileText className="h-8 w-8 opacity-30" />
//                     <p className="text-xs">No tasks here</p>
//                   </div>
//                 )}
//               </ScrollArea>
//             </TabsContent>
//           ))}
//         </Tabs>
//       </Card>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// // STARRED
// // ─────────────────────────────────────────────

// function StarredPanel() {
//   return (
//     <div className="flex flex-col gap-3">
//       <h2 className="text-sm font-semibold tracking-tight">Starred</h2>
//       <Card className="overflow-hidden rounded-xl border shadow-none">
//         {STARRED_ITEMS.map((item, i) => (
//           <div
//             key={item.id}
//             className={cn(
//               "flex items-center justify-between px-3 py-2 text-xs hover:bg-gray-50",
//               i < STARRED_ITEMS.length - 1 && "border-b border-gray-100",
//               item.starred && "bg-yellow-50"
//             )}
//           >
//             <div className="flex items-center gap-2">
//               <div className="h-3 w-3 rounded-sm border border-gray-300" />
//               <span className="text-gray-700">{item.name}</span>
//               <span className="text-gray-400">·</span>
//               <span className="text-gray-400">{item.project}</span>
//             </div>
//             {item.starred && (
//               <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
//             )}
//           </div>
//         ))}
//       </Card>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// // ASSIGNED TO ME
// // ─────────────────────────────────────────────

// function AssignedToMe() {
//   const [open, setOpen] = useState<Record<string, boolean>>({
//     todo: true,
//     done: true,
//   });

//   return (
//     <div className="flex flex-col gap-3">
//       <h2 className="text-sm font-semibold tracking-tight">Assigned to me</h2>
//       {TASK_GROUPS.map((group) => (
//         <div
//           key={group.key}
//           className={cn(
//             "overflow-hidden rounded-xl border border-l-4 shadow-none",
//             group.borderColor
//           )}
//         >
//           {/* Group header */}
//           <button
//             onClick={() =>
//               setOpen((prev) => ({ ...prev, [group.key]: !prev[group.key] }))
//             }
//             className="flex w-full items-center gap-2 bg-muted/30 px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
//           >
//             <ChevronDown
//               className={cn(
//                 "h-4 w-4 shrink-0 transition-transform duration-200",
//                 group.labelColor,
//                 !open[group.key] && "-rotate-90"
//               )}
//             />
//             <span className={cn("text-sm font-semibold", group.labelColor)}>
//               {group.label}
//             </span>
//             <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
//             <Badge
//               variant="secondary"
//               className="h-5 rounded-full px-2 text-[10px]"
//             >
//               {group.taskCount} Tasks · {group.subtaskCount} subtasks
//             </Badge>
//           </button>

//           {/* Collapsible table */}
//           {open[group.key] && (
//             <div className="overflow-x-auto">
//               <Table>
//                 <TableHeader>
//                   <TableRow className="bg-muted/10 hover:bg-muted/10">
//                     <TableHead className="w-10 py-2.5" />
//                     <TableHead className="w-6 py-2.5" />
//                     <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
//                       Task
//                     </TableHead>
//                     <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
//                       Assignee
//                     </TableHead>
//                     <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
//                       <div className="flex items-center gap-1">
//                         Date
//                         <Info className="h-3 w-3 opacity-50" />
//                       </div>
//                     </TableHead>
//                     <TableHead className="py-2.5 text-xs font-semibold text-muted-foreground">
//                       Priority
//                     </TableHead>
//                     <TableHead className="w-10 py-2.5">
//                       <Plus className="h-3.5 w-3.5 text-muted-foreground" />
//                     </TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {group.tasks.map((task) => (
//                     <TableRow
//                       key={task.id}
//                       className="hover:bg-muted/30"
//                     >
//                       <TableCell className="py-2.5">
//                         <Checkbox className="h-3.5 w-3.5" />
//                       </TableCell>
//                       <TableCell className="py-2.5">
//                         <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
//                       </TableCell>
//                       <TableCell className="py-2.5 text-sm font-medium">
//                         {task.name}
//                       </TableCell>
//                       <TableCell className="py-2.5">
//                         <Avatar className="h-7 w-7 ring-2 ring-background">
//                           <AvatarFallback className="bg-blue-500 text-[10px] font-bold text-white">
//                             {task.assignee}
//                           </AvatarFallback>
//                         </Avatar>
//                       </TableCell>
//                       <TableCell className="py-2.5 text-xs text-muted-foreground">
//                         {task.date}
//                       </TableCell>
//                       <TableCell className="py-2.5">
//                         <PriorityBadge priority={task.priority} />
//                       </TableCell>
//                       <TableCell className="py-2.5" />
//                     </TableRow>
//                   ))}
//                   {/* Add Task row */}
//                   <TableRow className="hover:bg-transparent">
//                     <TableCell className="py-2" colSpan={2} />
//                     <TableCell className="py-2" colSpan={5}>
//                       <button className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
//                         <Plus className="h-3.5 w-3.5" />
//                         Add Task
//                       </button>
//                     </TableCell>
//                   </TableRow>
//                 </TableBody>
//               </Table>
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// // RIGHT SIDEBAR
// // ─────────────────────────────────────────────

// function RightSidebar() {
//   return (
//     <div className="flex flex-col gap-5">
//       {/* Banner */}
//       <div className="h-[100px] w-full rounded-xl bg-gradient-to-br from-muted to-muted/60" />

//       {/* My Projects */}
//       <div className="flex flex-col gap-2">
//         <h3 className="text-sm font-semibold tracking-tight">My projects</h3>
//         <div className="relative">
//           <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
//           <Input
//             className="h-8 pl-8 text-xs"
//             placeholder="Search projects..."
//           />
//         </div>
//         <div className="flex flex-col">
//           {PROJECTS.map((p) => (
//             <div
//               key={p.id}
//               className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60"
//             >
//               <div className="flex items-center gap-2.5">
//                 <span
//                   className={cn("h-2.5 w-2.5 rounded-full", p.color)}
//                 />
//                 <span className="text-sm">{p.name}</span>
//               </div>
//               <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Recents */}
//       <div className="flex flex-col gap-2">
//         <h3 className="text-sm font-semibold tracking-tight">Recents</h3>
//         <div className="flex flex-col">
//           {RECENTS.map((r, i) => (
//             <div
//               key={i}
//               className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60"
//             >
//               <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
//               <span className="text-xs font-medium">{r.name}</span>
//               <span className="text-xs text-muted-foreground">{r.sub}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// // PAGE ROOT
// // ─────────────────────────────────────────────

// export default function WorkloadPage() {
//   return (
//     <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
//       <div className="grid flex-1 min-h-0 grid-cols-[300px_1fr_260px] gap-0 p-0">
//         {/* LEFT + CENTER (col-span-2) */}
//         <div className="col-span-2 flex min-h-0 flex-col gap-0 border-r">
//           {/* Workload bar — top of left+center */}
//           <div className="shrink-0 border-b px-5 py-4">
//             <WorkloadBar />
//           </div>

//           {/* Left + Center split */}
//           <div className="grid min-h-0 flex-1 grid-cols-[300px_1fr]">
//             {/* LEFT — Standups */}
//             <div className="min-h-0 border-r">
//               <ScrollArea className="h-full">
//                 <div className="px-4 py-4">
//                   <StandupsPanel />
//                 </div>
//               </ScrollArea>
//             </div>

//             {/* CENTER — My Work + Assigned to me + Personal + Starred */}
//             <div className="min-h-0">
//               <ScrollArea className="h-full">
//                 <div className="flex flex-col gap-6 px-5 py-4">
//                   <MyWorkPanel />
//                   <AssignedToMe />
//                   {/* Personal List + Starred side by side */}
//                   <div className="grid grid-cols-2 gap-4">
//                     <PersonalListPanel />
//                     <StarredPanel />
//                   </div>
//                 </div>
//               </ScrollArea>
//             </div>
//           </div>
//         </div>

//         {/* RIGHT — Sidebar */}
//         <div className="min-h-0">
//           <ScrollArea className="h-full">
//             <div className="px-4 py-4">
//               <RightSidebar />
//             </div>
//           </ScrollArea>
//         </div>
//       </div>
//     </div>
//   );
// }
