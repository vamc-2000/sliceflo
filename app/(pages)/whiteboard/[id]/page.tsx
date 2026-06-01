// app/(pages)/whiteboard/[id]/page.tsx
"use client";

export default function WhiteboardViewPage() {
    return (
        <div>
          <h1>Page coming soon</h1>
        </div>
    );
}


// "use client";

// import { useEffect, useState, useRef, Activity } from "react";
// import { useParams, useRouter } from "next/navigation";
// import dynamic from "next/dynamic";
// import { useWhiteboardStore } from "@/stores/useWhiteboard-store";
// import {
//   Pencil,
//   Share2,
//   Star,
//   Maximize2,
//   Settings,
//   MoreHorizontal,
//   MessageSquare,
//   X,
//   Check,
//   Save,
//   Edit,
//   Copy,
//   Link,
//   Lock,
//   Upload,
//   Trash2,
//   CopyPlus,
//   Bell,
//   MessageCircle,
//   AtSign,
//   History,
//   Activity as ActivityIcon,
//   Globe,
//   Hash,
//   FileText,
//   Download,
// } from "lucide-react";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
//   DropdownMenuSub,
//   DropdownMenuSubTrigger,
//   DropdownMenuSubContent,
// } from "@/components/ui/dropdown-menu";
// import { Switch } from "@/components/ui/switch";
// import { Checkbox } from "@/components/ui/checkbox";
// import "@excalidraw/excalidraw/index.css";
// import { useProfileStore } from "@/stores/profile-store";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
// import { useProjectsStore } from "@/stores/projects-store";
// import toast from "react-hot-toast";
// import { useTeamStore } from "@/stores/teams-store";

// const Excalidraw = dynamic(
//   async () => {
//     const mod = await import("@excalidraw/excalidraw");
//     return mod.Excalidraw;
//   },
//   {
//     ssr: false,
//     loading: () => (
//       <div className="h-screen flex items-center justify-center bg-white">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
//           <p className="text-sm text-gray-600">Loading whiteboard...</p>
//         </div>
//       </div>
//     ),
//   }
// );

// export default function WhiteboardViewPage() {
//   const { id } = useParams();
//   const router = useRouter();
//   const { user } = useProfileStore();
//   const { teams, fetchTeams } = useTeamStore();
//   const { projects, fetchProjects } = useProjectsStore();
//   const { getWhiteboardById, updateWhiteboard } = useWhiteboardStore();
//   const [whiteboard, setWhiteboard] = useState<any>(null);
//   const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
//   const [isEditingTitle, setIsEditingTitle] = useState(false);
//   const [tempTitle, setTempTitle] = useState("");
//   const [isSaving, setIsSaving] = useState(false);
//   const [showSaved, setShowSaved] = useState(false);
//   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
//   const lastSavedContent = useRef<string>("");
//   const [activeTab, setActiveTab] = useState("project");
//   const [isPageLocked, setIsPageLocked] = useState(false);
//   const [isDocumentLocked, setIsDocumentLocked] = useState(false);
//   const [isUploading, setIsUploading] = useState(false);
//   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
//   const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

//   useEffect(() => {
//     const current = getWhiteboardById(id as string);
//     if (current) {
//       setWhiteboard(current);
//       setTempTitle(current.title);
//       lastSavedContent.current = JSON.stringify(current.content);
//     } else {
//       router.push("/whiteboard");
//     }
//   }, [id, getWhiteboardById, router]);

//   // Track changes without auto-saving
//   useEffect(() => {
//     if (!excalidrawAPI) return;

//     const checkChanges = () => {
//       try {
//         const elements = excalidrawAPI.getSceneElements();
//         const appState = excalidrawAPI.getAppState();
//         const currentContent = JSON.stringify({ elements, appState });

//         if (currentContent !== lastSavedContent.current) {
//           setHasUnsavedChanges(true);
//         }
//       } catch (error) {
//         console.error("Error checking changes:", error);
//       }
//     };

//     const interval = setInterval(checkChanges, 1000);
//     return () => clearInterval(interval);
//   }, [excalidrawAPI]);

//   // Manual save function
//   const handleSave = async () => {
//     if (!excalidrawAPI || isSaving) return;

//     try {
//       setIsSaving(true);
//       const elements = excalidrawAPI.getSceneElements();
//       const appState = excalidrawAPI.getAppState();
//       const currentContent = JSON.stringify({ elements, appState });

//       updateWhiteboard(id as string, {
//         content: { elements, appState },
//         lastModified: new Date().toISOString()
//       });

//       lastSavedContent.current = currentContent;
//       setHasUnsavedChanges(false);
//       setShowSaved(true);

//       setTimeout(() => {
//         setShowSaved(false);
//       }, 2000);
//     } catch (error) {
//       console.error("Save failed:", error);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//    const handleExport = (scope: 'page' | 'all', format: 'pdf' | 'html' | 'markdown') => {
//     console.log(`Exporting ${scope} as ${format}`);
//     // Add your export logic here
//   };
//   const handleRemoveProject = (projectId: string) => {
//     setSelectedProjects(selectedProjects.filter(id => id !== projectId));
//   };
//   const handleRemoveTeam = (teamId: string) => {
//     setSelectedTeams(selectedTeams.filter(id => id !== teamId));
//   };

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) {
//       const validFiles = Array.from(e.target.files).filter(file =>
//         ['.pdf', '.txt', '.md', '.html'].some(ext =>
//           file.name.toLowerCase().endsWith(ext)
//         )
//       );
//       setSelectedFiles(prev => [...prev, ...validFiles]);
//     }
//   };
//   const handleUpload = () => {
//     if (selectedFiles.length === 0) return;

//     setIsUploading(true);

//     // Simulate upload with UI feedback only
//     setTimeout(() => {
//       toast.success('Files imported successfully!');
//       setSelectedFiles([]);
//       setIsUploading(false);
//     }, 2000);
//   };

//   const handleTitleUpdate = () => {
//     if (tempTitle.trim() && tempTitle !== whiteboard.title) {
//       updateWhiteboard(id as string, { title: tempTitle });
//       setWhiteboard({ ...whiteboard, title: tempTitle });
//     }
//     setIsEditingTitle(false);
//   };
//   const handleAddProject = (projectId: string) => {
//     if (!selectedProjects.includes(projectId)) {
//       setSelectedProjects([...selectedProjects, projectId]);
//     }
//   };


//   const handleAddTeam = (teamId: string) => {
//     if (!selectedTeams.includes(teamId)) {
//       setSelectedTeams([...selectedTeams, teamId]);
//     }
//   };

//   const handleTitleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter") {
//       handleTitleUpdate();
//     } else if (e.key === "Escape") {
//       setTempTitle(whiteboard?.title || "");
//       setIsEditingTitle(false);
//     }
//   };



//   if (!whiteboard) {
//     return (
//       <div className="h-screen flex items-center justify-center bg-white">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
//           <p className="text-sm text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen w-full flex flex-col">
//       <div className="border-b">
//         <Breadcrumbs />
//       </div>
//       {/* Header with Profile & Icons */}
//       <div className="bg-white border-b px-4 py-2 flex items-center justify-between z-50">
//         {/* Left - Profile & Title */}
//         <div className="flex items-center gap-3">
//           <Avatar className="h-8 w-8 ring-2 ring-gray-100">
//             <AvatarImage src={user?.profilePictureUrl || ""} alt={user?.name || "User"} />
//             <AvatarFallback className="bg-[#001F3F] text-white text-sm font-semibold">
//               {user?.name?.charAt(0)?.toUpperCase() || "U"}
//             </AvatarFallback>
//           </Avatar>

//           <div className="flex items-center gap-2">
//             {isEditingTitle ? (
//               <input
//                 type="text"
//                 value={tempTitle}
//                 onChange={(e) => setTempTitle(e.target.value)}
//                 onBlur={handleTitleUpdate}
//                 onKeyDown={handleTitleKeyDown}
//                 className="text-base font-semibold text-gray-900 border-b-2 border-indigo-600 outline-none focus:ring-0 bg-transparent px-1 py-0.5"
//                 autoFocus
//               />
//             ) : (
//               <div
//                 onClick={() => setIsEditingTitle(true)}
//                 className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-50 cursor-pointer transition-colors group"
//               >
//                 <span className="text-base font-semibold text-gray-900">
//                   {whiteboard.title}
//                 </span>
//                 <Pencil className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Right - Collaborators & Actions */}
//         <div className="flex items-center gap-2">
//           {/* Collaborators Avatars */}
//           <div className="flex -space-x-2 mr-2">
//             <Avatar className="h-8 w-8 ring-2 ring-white hover:z-10 transition-transform hover:scale-110 cursor-pointer">
//               <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs font-medium">
//                 A
//               </AvatarFallback>
//             </Avatar>
//             <Avatar className="h-8 w-8 ring-2 ring-white hover:z-10 transition-transform hover:scale-110 cursor-pointer">
//               <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white text-xs font-medium">
//                 B
//               </AvatarFallback>
//             </Avatar>
//             <Avatar className="h-8 w-8 ring-2 ring-white hover:z-10 transition-transform hover:scale-110 cursor-pointer">
//               <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white text-xs font-medium">
//                 C
//               </AvatarFallback>
//             </Avatar>
//             <Avatar className="h-8 w-8 ring-2 ring-white hover:z-10 transition-transform hover:scale-110 cursor-pointer">
//               <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-xs font-medium">
//                 +2
//               </AvatarFallback>
//             </Avatar>
//           </div>

//           <div className="h-6 w-px bg-gray-200" />

//           {/* Save Button */}
//           <Button
//             onClick={handleSave}
//             disabled={isSaving || !hasUnsavedChanges}
//             variant={showSaved ? "ghost" : "default"}
//             size="sm"
//             className={`h-8 px-3 ${showSaved ? "text-green-600" : ""}`}
//             title="Save whiteboard"
//           >
//             {isSaving ? (
//               <>
//                 <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent mr-1.5" />
//                 Saving...
//               </>
//             ) : showSaved ? (
//               <>
//                 <Check className="h-3.5 w-3.5 mr-1.5" />
//                 Saved
//               </>
//             ) : (
//               <>
//                 <Save className="h-3.5 w-3.5 mr-1.5" />
//                 Save
//               </>
//             )}
//           </Button>

//           <div className="h-6 w-px bg-gray-200" />

//           {/* Action Buttons */}
//           <Button variant="ghost" size="icon" className="h-8 w-8" title="Comments">
//             <MessageSquare className="h-4 w-4 text-gray-600" />
//           </Button>

//           {/* <Button variant="ghost" size="icon" className="h-8 w-8" title="Share">
//             <Share2 className="h-4 w-4 text-gray-600" />
//           </Button>
//            */}
//           {/* <Button variant="ghost" size="icon" className="h-8 w-8" title="Favorite">
//             <Star className="h-4 w-4 text-gray-600" />
//           </Button>
//            */}
//           <Button variant="ghost" size="icon" className="h-8 w-8" title="Fullscreen">
//             <Maximize2 className="h-4 w-4 text-gray-600" />
//           </Button>

//           <Button variant="ghost" size="icon" className="h-8 w-8" title="Settings">
//             <Settings className="h-4 w-4 text-gray-600" />
//           </Button>

//           {/* Replace your old MoreHorizontal button with this */}
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="h-8 w-8"
//                 title="More options"
//               >
//                 <MoreHorizontal className="w-4 h-4 text-gray-600" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-64 max-h-[80vh] overflow-y-auto">
//               {/* Header */}
//               <DropdownMenuLabel className="text-xs font-semibold text-white text-center mx-1 mt-1 mb-2 px-8 py-2 rounded-lg bg-[#001F3F]">
//                 Sharing & Permissions
//               </DropdownMenuLabel>

//               {/* Menu Items */}
//               <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
//                 <Edit className="w-4 h-4 mr-2" />
//                 <span>Rename</span>
//               </DropdownMenuItem>

//               <DropdownMenuItem>
//                 <Copy className="w-4 h-4 mr-2" />
//                 <span>Duplicate</span>
//               </DropdownMenuItem>

//               <DropdownMenuItem>
//                 <Star className="w-4 h-4 mr-2" />
//                 <span>Mark as Favourite</span>
//               </DropdownMenuItem>

//               <DropdownMenuSeparator />

//               {/* Link Submenu */}
//               <DropdownMenuSub>
//                 <DropdownMenuSubTrigger>
//                   <Link className="w-4 h-4 mr-2" />
//                   <span>Link Document to</span>
//                 </DropdownMenuSubTrigger>
//                 <DropdownMenuSubContent className="w-80 p-0">
//                   {/* Tabs Header */}
//                   <div className="flex border-b border-gray-200 px-1 pt-1">
//                     <button
//                       onClick={() => setActiveTab("project")}
//                       className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "project"
//                         ? "text-gray-900 border-b-2 border-black -mb-[2px]"
//                         : "text-gray-500 hover:text-gray-700"
//                         }`}
//                     >
//                       Project
//                     </button>
//                     <button
//                       onClick={() => setActiveTab("portfolio")}
//                       className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "portfolio"
//                         ? "text-gray-900 border-b-2 border-black -mb-[2px]"
//                         : "text-gray-500 hover:text-gray-700"
//                         }`}
//                     >
//                       Portfolio
//                     </button>
//                     <button
//                       onClick={() => setActiveTab("team")}
//                       className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "team"
//                         ? "text-gray-900 border-b-2 border-black -mb-[2px]"
//                         : "text-gray-500 hover:text-gray-700"
//                         }`}
//                     >
//                       Team
//                     </button>
//                     <button
//                       onClick={() => setActiveTab("document")}
//                       className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "document"
//                         ? "text-gray-900 border-b-2 border-black -mb-[2px]"
//                         : "text-gray-500 hover:text-gray-700"
//                         }`}
//                     >
//                       Documents
//                     </button>
//                   </div>

//                   {/* Tab Content */}
//                   <div className="p-2">
//                     {/* Project Tab */}
//                     {activeTab === "project" && (
//                       <div>
//                         <p className="text-xs text-gray-500 mb-3">Recent Projects</p>
//                         <div className="max-h-60 overflow-y-auto">
//                           {projects.map((project) => {
//                             const isSelected = selectedProjects.includes(project.id!);

//                             return (
//                               <div
//                                 key={project.id}
//                                 className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-gray-100" : "hover:bg-gray-50"
//                                   }`}
//                                 onClick={() => {
//                                   if (isSelected) {
//                                     handleRemoveProject(project.id!);
//                                   } else {
//                                     handleAddProject(project.id!);
//                                   }
//                                 }}
//                               >
//                                 <Checkbox
//                                   checked={isSelected}
//                                   onCheckedChange={(checked) => {
//                                     if (checked) {
//                                       handleAddProject(project.id!);
//                                     } else {
//                                       handleRemoveProject(project.id!);
//                                     }
//                                   }}
//                                   onClick={(e) => e.stopPropagation()}
//                                   className="data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#001F3F]"
//                                 />
//                                 <span className="text-sm text-gray-900 flex-1">
//                                   {project.name}
//                                 </span>
//                               </div>
//                             );
//                           })}
//                         </div>
//                       </div>
//                     )}


//                     {/* Team Tab */}
//                     {activeTab === "team" && (
//                       <div>
//                         <p className="text-xs text-gray-500 mb-3">Recent Teams</p>
//                         <div className="max-h-60 overflow-y-auto">
//                           {teams.map((team) => {
//                             const isSelected = selectedTeams.includes(team.id!);

//                             return (
//                               <div
//                                 key={team.id}
//                                 className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-gray-100" : "hover:bg-gray-50"
//                                   }`}
//                                 onClick={() => {
//                                   if (isSelected) {
//                                     handleRemoveTeam(team.id!);
//                                   } else {
//                                     handleAddTeam(team.id!);
//                                   }
//                                 }}
//                               >
//                                 <Checkbox
//                                   checked={isSelected}
//                                   onCheckedChange={(checked) => {
//                                     if (checked) {
//                                       handleAddTeam(team.id!);
//                                     } else {
//                                       handleRemoveTeam(team.id!);
//                                     }
//                                   }}
//                                   onClick={(e) => e.stopPropagation()}
//                                   className="data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#001F3F]"
//                                 />
//                                 <span className="text-sm text-gray-900 flex-1">
//                                   {team.name}
//                                 </span>
//                               </div>
//                             );
//                           })}
//                         </div>
//                       </div>
//                     )}

//                     {/* Portfolio Tab */}
//                     {activeTab === "portfolio" && (
//                       <div className="text-sm text-gray-500 py-8 text-center">
//                         No portfolios available
//                       </div>
//                     )}

//                     {/* Document Tab */}
//                     {activeTab === "document" && (
//                       <div className="text-sm text-gray-500 py-8 text-center">
//                         No Documents available
//                       </div>
//                     )}
//                   </div>
//                 </DropdownMenuSubContent>
//               </DropdownMenuSub>
//               <DropdownMenuItem>
//                 <CopyPlus className="w-4 h-4 mr-2" />
//                 <span>Relationships </span>
//               </DropdownMenuItem>

//               {/* Locking Section */}
//               <DropdownMenuSeparator />
//               <DropdownMenuSub>
//                 <DropdownMenuSubTrigger className="cursor-pointer">
//                   <Bell className="w-4 h-4 mr-2" />
//                   <span>Notify me</span>
//                 </DropdownMenuSubTrigger>
//                 <DropdownMenuSubContent>
//                   <DropdownMenuItem>
//                     <MessageCircle className="w-4 h-4 mr-2" />
//                     <span>All comments</span>
//                   </DropdownMenuItem>
//                   <DropdownMenuItem>
//                     <AtSign className="w-4 h-4 mr-2" />
//                     <span>Replies & mentions</span>
//                   </DropdownMenuItem>
//                 </DropdownMenuSubContent>
//               </DropdownMenuSub>

//               <DropdownMenuItem>
//                 {/* Use the aliased name here */}
//                 <ActivityIcon className="w-4 h-4 mr-2" />
//                 <span>Activity log</span>
//               </DropdownMenuItem>

//               <DropdownMenuItem>
//                 <History className="w-4 h-4 mr-2" />
//                 <span>Version history</span>
//               </DropdownMenuItem>
//               <DropdownMenuSeparator />

//               <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
//                 <Lock className="w-4 h-4 mr-2" />
//                 <span>Lock page</span>
//                 <Switch
//                   checked={isPageLocked}
//                   onCheckedChange={setIsPageLocked}
//                   className="ml-auto data-[state=checked]:bg-[#001F3F]"
//                 />
//               </DropdownMenuItem>
          
            
//               <DropdownMenuSeparator />

//               {/* Import/Export */}
//               <DropdownMenuSub>
//                 <DropdownMenuSubTrigger>
//                   <Upload className="w-4 h-4 mr-2" />
//                   <span>Import</span>
//                 </DropdownMenuSubTrigger>
//                 <DropdownMenuSubContent className="w-80 p-4">
//                   <div
//                     className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
//                     onClick={() => fileInputRef.current?.click()}
//                   >
//                     <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
//                     <p className="text-xs font-medium">Click to upload files</p>
//                     <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
//                   </div>
//                   {selectedFiles.length > 0 && (
//                     <Button size="sm" className="w-full mt-2 bg-[#001F3F]" onClick={handleUpload}>
//                       Upload {selectedFiles.length} files
//                     </Button>
//                   )}
//                 </DropdownMenuSubContent>
//               </DropdownMenuSub>

//                <DropdownMenuSub>
//                               <DropdownMenuSubTrigger>
//                                 <Download className="w-4 h-4 mr-2" />
//                                 <span>Export</span>
//                               </DropdownMenuSubTrigger>
//                               <DropdownMenuSubContent>
//                                 {/* First Level - Scope Selection */}
//                                 <DropdownMenuSub>
//                                   <DropdownMenuSubTrigger>
//                                     <span>This page</span>
//                                   </DropdownMenuSubTrigger>
//                                   <DropdownMenuSubContent>
//                                     <DropdownMenuItem onClick={() => handleExport('page', 'pdf')}>
//                                       <FileText className="w-4 h-4 mr-2" />
//                                       <span>PDF</span>
//                                     </DropdownMenuItem>
//                                     <DropdownMenuItem onClick={() => handleExport('page', 'html')}>
//                                       <Globe className="w-4 h-4 mr-2" />
//                                       <span>HTML</span>
//                                     </DropdownMenuItem>
//                                     <DropdownMenuItem onClick={() => handleExport('page', 'markdown')}>
//                                       <Hash className="w-4 h-4 mr-2" />
//                                       <span>Markdown</span>
//                                     </DropdownMenuItem>
//                                   </DropdownMenuSubContent>
//                                 </DropdownMenuSub>
              
//                                 <DropdownMenuSub>
//                                   <DropdownMenuSubTrigger>
//                                     <span>All pages</span>
//                                   </DropdownMenuSubTrigger>
//                                   <DropdownMenuSubContent>
//                                     <DropdownMenuItem onClick={() => handleExport('all', 'pdf')}>
//                                       <FileText className="w-4 h-4 mr-2" />
//                                       <span>PDF</span>
//                                     </DropdownMenuItem>
//                                     <DropdownMenuItem onClick={() => handleExport('all', 'html')}>
//                                       <Globe className="w-4 h-4 mr-2" />
//                                       <span>HTML</span>
//                                     </DropdownMenuItem>
//                                     <DropdownMenuItem onClick={() => handleExport('all', 'markdown')}>
//                                       <Hash className="w-4 h-4 mr-2" />
//                                       <span>Markdown</span>
//                                     </DropdownMenuItem>
//                                   </DropdownMenuSubContent>
//                                 </DropdownMenuSub>
//                               </DropdownMenuSubContent>
//                             </DropdownMenuSub>
              

//               <DropdownMenuSeparator />
//               <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
//                 <Trash2 className="w-4 h-4 mr-2" />
//                 <span>Delete</span>
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>

//           <div className="h-6 w-px bg-gray-200" />

//           <Button
//             variant="ghost"
//             size="icon"
//             className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
//             onClick={() => router.push("/whiteboard")}
//             title="Close"
//           >
//             <X className="h-4 w-4" />
//           </Button>
//         </div>
//       </div>

//       {/* Excalidraw Canvas */}
//       <div className="flex-1 relative">
//         <Excalidraw
//           excalidrawAPI={(api) => setExcalidrawAPI(api)}
//           initialData={{
//             elements: whiteboard.content?.elements || [],
//             appState: {
//               ...(whiteboard.content?.appState || {}),
//               viewBackgroundColor: "#ffffff",
//               collaborators: new Map(),
//             },
//           }}
//         />
//       </div>
//     </div>
//   );
// }
