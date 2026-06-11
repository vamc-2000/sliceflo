

// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { useDocStore } from "@/stores/useDoc-store";

// import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
// import { useProfileStore } from "@/stores/profile-store";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { useProjectsStore } from "@/stores/projects-store";
// import { ChevronDown, Plus, X, Loader2 } from "lucide-react";
// import { useTeamStore } from "@/stores/teams-store";
// import { usePortfoliosStore } from "@/stores/portfolios-store";
// // import { createChildDocument, createRootDocument } from "@/lib/api/documents-api";

// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Checkbox } from "@/components/ui/checkbox";
// import { toast } from "@/components/ui/sonner";

// export default function DocsCreatePage() {
//     const { addDocument, loadDocuments, createDoc, updateDocument, fetchRootDocuments } = useDocStore();
//     const { user } = useProfileStore()
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const from = searchParams.get("from");
//     const urlProjectId = searchParams.get("projectId");
//     const portfolioId = searchParams.get("portfolioId");
//     const [isSubmitting, setIsSubmitting] = useState(false);

//     const [documentName, setDocumentName] = useState("");
//     const [documentIdentifier, setDocumentIdentifier] = useState("");
//     // const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
//     const [linkTo, setLinkTo] = useState("");
//     const { projects, fetchProjects } = useProjectsStore();
//     const [selectedType, setSelectedType] = useState<string>("");
//     const [selectedProject, setSelectedProject] = useState<string>("")
//     const [selectedProjects, setSelectedProjects] = useState<string[]>(urlProjectId ? [urlProjectId] : []);
//     const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
//     const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
//     const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([]);
//     const [showLinkSection, setShowLinkSection] = useState(false);
//     const [activeTab, setActiveTab] = useState<"portfolio" | "project" | "team" | "document">("project");
//     const { teams, fetchTeams } = useTeamStore();
//     const { portfolios, fetchPortfolios } = usePortfoliosStore();
//     const { documents } = useDocStore();
//     const docList = Array.from(documents.values()).filter(doc => !doc.parentId); // Only root docs for linking

//     // useEffect(() => {
//     //     fetchProjects();
//     // }, [fetchProjects]);

//     useEffect(() => {
//         fetchProjects();
//         fetchTeams();
//         fetchPortfolios();
//         if (!user) {
//             console.log("Fetching user profile in DocsCreatePage...");
//             useProfileStore.getState().fetchUserProfile();
//         }
//     }, [fetchProjects, fetchTeams, fetchPortfolios, user]);

//     useEffect(() => {
//         if (urlProjectId) {
//             setSelectedProjects(prev => [...new Set([...prev, urlProjectId])]);
//         }
//         if (portfolioId) {
//             setSelectedPortfolios(prev => [...new Set([...prev, portfolioId])]);
//         }
//     }, [urlProjectId, portfolioId]);

//     useEffect(() => {
//         fetchRootDocuments();
//     }, [fetchRootDocuments]);

//     // Get the selected project details
//     const currentProject = projects.find((p) => p.id === selectedProject);

//     const handleDocumentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const name = e.target.value;
//         setDocumentName(name);
//         const identifier = name.slice(0, 3).replace(/\s/g, '').toUpperCase();
//         setDocumentIdentifier(identifier);
//     };



//     const handleCreateDocument = async () => {
//         setIsSubmitting(true);
//         try {
//             const newId = await createDoc(documentName || "Untitled");
//             if (!newId) throw new Error("Failed to create document");

//             const allLinkedPortfolios = portfolioId
//                 ? [...new Set([...(selectedPortfolios || []), portfolioId])]
//                 : selectedPortfolios || [];

//             const allLinkedProjects = urlProjectId
//                 ? [...new Set([...selectedProjects, urlProjectId])]
//                 : selectedProjects;

//             const hasLinks =
//                 allLinkedProjects.length > 0 ||
//                 selectedTeams.length > 0 ||
//                 selectedDocs.length > 0 ||
//                 allLinkedPortfolios.length > 0;

//             if (hasLinks) {
//                 await updateDocument(newId, {
//                     linkedProjects: allLinkedProjects,
//                     linkedTeams: selectedTeams,
//                     linkedDocuments: selectedDocs,
//                     linkedPortfolios: allLinkedPortfolios,
//                 });
//             }

//             if (from === "portfolio" && portfolioId) {
//                 router.push(`/docs/${newId}?from=portfolio&portfolioId=${portfolioId}`);
//             } else if (from === "project" && urlProjectId) {
//                 router.push(`/docs/${newId}?from=project&projectId=${urlProjectId}`);
//             } else {
//                 router.push(`/docs/${newId}`);
//             }
//         } catch (err) {
//             console.error("Create doc error:", err);
//             toast("error", { title: "Failed to create document" });
//         } finally {
//             setIsSubmitting(false);
//         }
//     };
//     const handleCancel = () => {
//         router.push('/docs');
//     };



//     // Add/Remove handlers
//     const handleAddProject = (projectId: string) => {
//         if (!selectedProjects.includes(projectId)) {
//             setSelectedProjects([...selectedProjects, projectId]);
//         }
//     };

//     const handleRemoveProject = (projectId: string) => {
//         setSelectedProjects(selectedProjects.filter(id => id !== projectId));
//     };
//     const handleAddTeam = (teamId: string) => {
//         if (!selectedTeams.includes(teamId)) {
//             setSelectedTeams([...selectedTeams, teamId]);
//         }
//     };

//     const handleRemoveTeam = (teamId: string) => {
//         setSelectedTeams(selectedTeams.filter(id => id !== teamId));
//     };

//     const handleAddDocumentLink = (docId: string) => {
//         if (!selectedDocs.includes(docId)) {
//             setSelectedDocs([...selectedDocs, docId]);
//         }
//     };

//     const handleRemoveDocumentLink = (docId: string) => {
//         setSelectedDocs(selectedDocs.filter(id => id !== docId));
//     };

//     const handleAddPortfolio = (pId: string) => {
//         if (!selectedPortfolios.includes(pId)) {
//             setSelectedPortfolios([...selectedPortfolios, pId]);
//         }
//     };

//     const handleRemovePortfolio = (pId: string) => {
//         setSelectedPortfolios(selectedPortfolios.filter(id => id !== pId));
//     };


//     const isFormValid = () => {
//         return documentName.trim();
//     };

//     return (
//         <div className="space-y-6">
//             <div className="border-b">
//                 <Breadcrumbs />
//             </div>

//             {/* Content with padding on both sides */}
//             <div className="px-7 space-y-6 ">

//                 {/* Document Name and Identifier Section */}
//                 <div className="bg-[#F2F2F7] p-4 rounded-md ">
//                     <div className="flex gap-6">
//                         {/* Document Name */}
//                         <div className="w-80">
//                             <label className="block text-xs font-medium text-[#8E8E93] mb-2">
//                                 Document name
//                             </label>
//                             <Input
//                                 type="text"
//                                 value={documentName}
//                                 onChange={handleDocumentNameChange}
//                                 placeholder="e.g. West Bengal"
//                                 className="h-10 bg-white"
//                             />
//                         </div>

//                         {/* Document Identifier */}
//                         <div className="w-80">
//                             <label className="block text-xs font-medium text-[#8E8E93] mb-2">
//                                 Document identifier
//                             </label>
//                             <Input
//                                 type="text"
//                                 value={documentIdentifier}
//                                 onChange={(e) => setDocumentIdentifier(e.target.value)}
//                                 placeholder="e.g. WES"
//                                 className="h-10 bg-white"
//                             />
//                         </div>
//                     </div>
//                 </div>

//                 {/* Labels Section */}
//                 <div className="border border-gray-200 border-l-4 border-l-black rounded-lg p-5 bg-white">
//                     <div className="flex items-start justify-between gap-6">
//                         {/* Left Side - Text Content */}
//                         <div className="flex-1">
//                             <h3 className="font-semibold text-gray-900 mb-2 text-sm">Labels</h3>
//                             <p className="text-xs text-gray-600">
//                                 Create and manage labels to categorize and organize documents, making it easier for your team to filter and track work.
//                             </p>
//                         </div>


//                         {/* Right Side - Dropdown for Type Selection */}
//                         <div className="w-80">
//                             <DropdownMenu>
//                                 <DropdownMenuTrigger asChild>
//                                     <Button
//                                         variant="outline"
//                                         className="w-full h-10 justify-between bg-white"
//                                     >
//                                         <span className="text-sm text-gray-700">Select</span>
//                                         <ChevronDown className="w-4 h-4 text-gray-500" />
//                                     </Button>
//                                 </DropdownMenuTrigger>
//                                 {/* <DropdownMenuContent className="w-80">
//                                     <div
//                                         className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
//                                         onClick={() => setSelectedType("portfolio")}
//                                     >
//                                         Portfolio
//                                     </div>
//                                     <div
//                                         className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
//                                         onClick={() => setSelectedType("project")}
//                                     >
//                                         Project
//                                     </div>
//                                     <div
//                                         className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
//                                         onClick={() => setSelectedType("team")}
//                                     >
//                                         Team
//                                     </div>
//                                 </DropdownMenuContent> */}
//                             </DropdownMenu>
//                         </div>





//                     </div>
//                 </div>


//                 {/* Link Document Section */}
//                 <div className="border border-gray-200 border-l-4 border-l-black rounded-lg p-5 bg-white">
//                     <div className="flex items-start justify-between gap-6">
//                         <div className="flex-1">
//                             <h3 className="font-semibold text-gray-900 mb-2 text-sm">Link this document to</h3>
//                             <p className="text-xs text-gray-600">
//                                 Link this document to a Portfolio, Project, or Team to ensure it's organized, discoverable, and accessible in the right workspace.
//                             </p>
//                         </div>

//                         <div className="w-80">
//                             <DropdownMenu>
//                                 <DropdownMenuTrigger asChild>
//                                     <Button
//                                         variant="outline"
//                                         className="w-full h-10 justify-start bg-white text-[#001F3F] hover:text-[#001F3F]/90 hover:bg-gray-100"
//                                     >
//                                         <Plus className="w-4 h-4 mr-2" />
//                                         Link this doc
//                                     </Button>
//                                 </DropdownMenuTrigger>
//                                 <DropdownMenuContent className="w-80 p-0">
//                                     <div className="flex border-b border-gray-200 px-1 pt-1">
//                                         <button
//                                             onClick={() => setActiveTab("project")}
//                                             className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "project"
//                                                 ? "text-gray-900 border-b-2 border-black -mb-[2px]"
//                                                 : "text-gray-500 hover:text-gray-700"
//                                                 }`}
//                                         >
//                                             Project
//                                         </button>
//                                         {/* <button
//                                             onClick={() => setActiveTab("team")}
//                                             className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "team"
//                                                 ? "text-gray-900 border-b-2 border-black -mb-[2px]"
//                                                 : "text-gray-500 hover:text-gray-700"
//                                                 }`}
//                                         >
//                                             Teams
//                                         </button> */}
//                                         <button
//                                             onClick={() => setActiveTab("portfolio")}
//                                             className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "portfolio"
//                                                 ? "text-gray-900 border-b-2 border-black -mb-[2px]"
//                                                 : "text-gray-500 hover:text-gray-700"
//                                                 }`}
//                                         >
//                                             Portfolio
//                                         </button>

//                                         <button
//                                             onClick={() => setActiveTab("document")}
//                                             className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "document"
//                                                 ? "text-gray-900 border-b-2 border-black -mb-[2px]"
//                                                 : "text-gray-500 hover:text-gray-700"
//                                                 }`}
//                                         >
//                                             Documents
//                                         </button>

//                                     </div>

//                                     <div className="p-2">
//                                         {/* Empty State Image Logic */}
//                                         {(() => {
//                                             const isEmpty = (activeTab === "project" && projects.length === 0) ||
//                                                 (activeTab === "team" && teams.length === 0) ||
//                                                 (activeTab === "portfolio" && portfolios.length === 0) ||
//                                                 (activeTab === "document" && docList.length === 0);

//                                             if (!isEmpty) return null;

//                                             const config = {
//                                                 project: {
//                                                     image: "/images/project.svg",
//                                                     title: "No Project found",
//                                                     desc: "Please create a project in the Project section first, then return here to link it."
//                                                 },
//                                                 portfolio: {
//                                                     image: "/images/portfolio-image.svg",
//                                                     title: "No Portfolio found",
//                                                     desc: "Please create a portfolio in the Portfolio section first, then return here to link it."
//                                                 },
//                                                 team: {
//                                                     image: "/images/TeamsEmpty.svg",
//                                                     title: "No Team found",
//                                                     desc: "Please create a team in the Team section first, then return here to link it."
//                                                 },
//                                                 document: {
//                                                     image: "/images/docs-image.png",
//                                                     title: "No Document found",
//                                                     desc: "Please create a document in the Document section first, then return here to link it."
//                                                 }
//                                             };

//                                             return (
//                                                 <div className="py-8 flex flex-col items-center justify-center text-center px-4">
//                                                     <img
//                                                         src={config[activeTab].image}
//                                                         alt={config[activeTab].title}
//                                                         className="w-60 h-32 mb-4 opacity-80"
//                                                     />
//                                                     <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight">
//                                                         {config[activeTab].title}
//                                                     </h3>
//                                                     <p className="text-xs text-gray-500 leading-normal max-w-[240px]">
//                                                         {config[activeTab].desc}
//                                                     </p>
//                                                 </div>
//                                             );
//                                         })()}

//                                         {activeTab === "project" && projects.length > 0 && (
//                                             <div>
//                                                 <p className="text-xs text-gray-500 mb-3">Recent Projects</p>
//                                                 <div className=" max-h-60 overflow-y-auto">
//                                                     {projects.map((project) => {
//                                                         const isSelected = selectedProjects.includes(project.id!);

//                                                         return (
//                                                             <div
//                                                                 key={project.id}
//                                                                 className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-gray-100" : "hover:bg-gray-50"
//                                                                     }`}
//                                                                 onClick={() => {
//                                                                     if (isSelected) {
//                                                                         handleRemoveProject(project.id!);
//                                                                     } else {
//                                                                         handleAddProject(project.id!);
//                                                                     }
//                                                                 }}
//                                                             >
//                                                                 <Checkbox
//                                                                     checked={isSelected}
//                                                                     onCheckedChange={(checked) => {
//                                                                         if (checked) {
//                                                                             handleAddProject(project.id!);
//                                                                         } else {
//                                                                             handleRemoveProject(project.id!);
//                                                                         }
//                                                                     }}
//                                                                     onClick={(e) => e.stopPropagation()}
//                                                                     className="data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#001F3F]"
//                                                                 />

//                                                                 <span className="text-sm text-gray-900 flex-1">
//                                                                     {project.name}
//                                                                 </span>
//                                                             </div>
//                                                         );
//                                                     })}
//                                                 </div>
//                                             </div>
//                                         )}

//                                         {activeTab === "team" && teams.length > 0 && (
//                                             <div>
//                                                 <p className="text-xs text-gray-500 mb-3">Recent Teams</p>
//                                                 <div className="space-y-1 max-h-60 overflow-y-auto">
//                                                     {teams.map((team) => {
//                                                         const isSelected = selectedTeams.includes(team.id!);

//                                                         return (
//                                                             <div
//                                                                 key={team.id}
//                                                                 className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-gray-100" : "hover:bg-gray-50"
//                                                                     }`}
//                                                                 onClick={() => {
//                                                                     if (isSelected) {
//                                                                         handleRemoveTeam(team.id!);
//                                                                     } else {
//                                                                         handleAddTeam(team.id!);
//                                                                     }
//                                                                 }}
//                                                             >
//                                                                 <Checkbox
//                                                                     checked={isSelected}
//                                                                     onCheckedChange={(checked) => {
//                                                                         if (checked) {
//                                                                             handleAddTeam(team.id!);
//                                                                         } else {
//                                                                             handleRemoveTeam(team.id!);
//                                                                         }
//                                                                     }}
//                                                                     onClick={(e) => e.stopPropagation()}
//                                                                     className="data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#001F3F]"
//                                                                 />

//                                                                 <span className="text-sm text-gray-900 flex-1">
//                                                                     {team.name}
//                                                                 </span>
//                                                             </div>
//                                                         );
//                                                     })}
//                                                 </div>
//                                             </div>
//                                         )}

//                                         {activeTab === "document" && docList.length > 0 && (
//                                             <div>
//                                                 <p className="text-xs text-gray-500 mb-3">Recent Documents</p>
//                                                 <div className="space-y-1 max-h-60 overflow-y-auto">
//                                                     {docList.map((doc) => {
//                                                         const isSelected = selectedDocs.includes(doc.id);

//                                                         return (
//                                                             <div
//                                                                 key={doc.id}
//                                                                 className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-gray-100" : "hover:bg-gray-50"
//                                                                     }`}
//                                                                 onClick={() => {
//                                                                     if (isSelected) {
//                                                                         handleRemoveDocumentLink(doc.id);
//                                                                     } else {
//                                                                         handleAddDocumentLink(doc.id);
//                                                                     }
//                                                                 }}
//                                                             >
//                                                                 <Checkbox
//                                                                     checked={isSelected}
//                                                                     onCheckedChange={(checked) => {
//                                                                         if (checked) {
//                                                                             handleAddDocumentLink(doc.id);
//                                                                         } else {
//                                                                             handleRemoveDocumentLink(doc.id);
//                                                                         }
//                                                                     }}
//                                                                     onClick={(e) => e.stopPropagation()}
//                                                                     className="data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#001F3F]"
//                                                                 />

//                                                                 <span className="text-sm text-gray-900 flex-1">
//                                                                     {doc.title}
//                                                                 </span>
//                                                             </div>
//                                                         );
//                                                     })}
//                                                 </div>
//                                             </div>
//                                         )}

//                                         {activeTab === "portfolio" && portfolios.length > 0 && (
//                                             <div>
//                                                 <p className="text-xs text-gray-500 mb-3">Recent Portfolios</p>
//                                                 <div className="space-y-1 max-h-60 overflow-y-auto">
//                                                     {portfolios.map((p) => {
//                                                         const isSelected = selectedPortfolios.includes(p.id);

//                                                         return (
//                                                             <div
//                                                                 key={p.id}
//                                                                 className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-gray-100" : "hover:bg-gray-50"
//                                                                     }`}
//                                                                 onClick={() => {
//                                                                     if (isSelected) {
//                                                                         handleRemovePortfolio(p.id);
//                                                                     } else {
//                                                                         handleAddPortfolio(p.id);
//                                                                     }
//                                                                 }}
//                                                             >
//                                                                 <Checkbox
//                                                                     checked={isSelected}
//                                                                     onCheckedChange={(checked) => {
//                                                                         if (checked) {
//                                                                             handleAddPortfolio(p.id);
//                                                                         } else {
//                                                                             handleRemovePortfolio(p.id);
//                                                                         }
//                                                                     }}
//                                                                     onClick={(e) => e.stopPropagation()}
//                                                                     className="data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#001F3F]"
//                                                                 />

//                                                                 <span className="text-sm text-gray-900 flex-1">
//                                                                     {p.name}
//                                                                 </span>
//                                                             </div>
//                                                         );
//                                                     })}
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </DropdownMenuContent>
//                             </DropdownMenu>
//                         </div>
//                     </div>

//                     {/* Show Selected Projects */}
//                     {selectedProjects.length > 0 && (
//                         <div className="mt-4">
//                             <div className="flex flex-wrap gap-2">
//                                 {selectedProjects.map((projectId) => {
//                                     const project = projects.find(p => p.id === projectId);
//                                     if (!project) return null;

//                                     // Get project color or use default
//                                     const bgColor = project.color || project.icon?.color || "#E5E5EA";

//                                     return (
//                                         <div
//                                             key={project.id}
//                                             className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700"
//                                             style={{ backgroundColor: `${bgColor}20` }}
//                                         >
//                                             <span>{project.name}</span>
//                                             <button
//                                                 onClick={(e) => {
//                                                     e.preventDefault();
//                                                     e.stopPropagation();
//                                                     handleRemoveProject(project.id!);
//                                                 }}
//                                                 className="hover:bg-black/10 rounded p-0.5 transition-colors"
//                                             >
//                                                 <X className="w-3.5 h-3.5 text-gray-600" />
//                                             </button>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         </div>
//                     )}

//                     {/* Show Selected Teams */}
//                     {selectedTeams.length > 0 && (
//                         <div className="mt-4">
//                             <div className="flex flex-wrap gap-2">
//                                 {selectedTeams.map((teamId) => {
//                                     const team = teams.find(t => t.id === teamId);
//                                     if (!team) return null;

//                                     // Use a default color for teams
//                                     const bgColor = "#8E8E93";

//                                     return (
//                                         <div
//                                             key={team.id}
//                                             className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700"
//                                             style={{ backgroundColor: `${bgColor}20` }}
//                                         >
//                                             <span>{team.name}</span>
//                                             <button
//                                                 onClick={(e) => {
//                                                     e.preventDefault();
//                                                     e.stopPropagation();
//                                                     handleRemoveTeam(team.id!);
//                                                 }}
//                                                 className="hover:bg-black/10 rounded p-0.5 transition-colors"
//                                             >
//                                                 <X className="w-3.5 h-3.5 text-gray-600" />
//                                             </button>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         </div>
//                     )}
//                     {/* Show Selected Documents */}
//                     {selectedDocs.length > 0 && (
//                         <div className="mt-4">
//                             <div className="flex flex-wrap gap-2">
//                                 {selectedDocs.map((docId: string) => {
//                                     const doc = docList.find(d => d.id === docId);
//                                     if (!doc) return null;

//                                     const bgColor = "#6366F1"; // purple for docs

//                                     return (
//                                         <div
//                                             key={doc.id}
//                                             className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700"
//                                             style={{ backgroundColor: `${bgColor}20` }}
//                                         >
//                                             <span>{doc.title}</span>
//                                             <button
//                                                 onClick={(e) => {
//                                                     e.preventDefault();
//                                                     e.stopPropagation();
//                                                     handleRemoveDocumentLink(doc.id);
//                                                 }}
//                                                 className="hover:bg-black/10 rounded p-0.5 transition-colors"
//                                             >
//                                                 <X className="w-3.5 h-3.5 text-gray-600" />
//                                             </button>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         </div>
//                     )}

//                     {/* Show Selected Portfolios */}
//                     {selectedPortfolios.length > 0 && (
//                         <div className="mt-4">
//                             <div className="flex flex-wrap gap-2">
//                                 {selectedPortfolios.map((pId: string) => {
//                                     const p = portfolios.find(port => port.id === pId);
//                                     if (!p) return null;

//                                     const bgColor = "#F68C1F"; // orange for portfolios

//                                     return (
//                                         <div
//                                             key={p.id}
//                                             className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700"
//                                             style={{ backgroundColor: `${bgColor}20` }}
//                                         >
//                                             <span>{p.name}</span>
//                                             <button
//                                                 onClick={(e) => {
//                                                     e.preventDefault();
//                                                     e.stopPropagation();
//                                                     handleRemovePortfolio(p.id);
//                                                 }}
//                                                 className="hover:bg-black/10 rounded p-0.5 transition-colors"
//                                             >
//                                                 <X className="w-3.5 h-3.5 text-gray-600" />
//                                             </button>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         </div>
//                     )}
//                 </div>



//                 {/* Document Privacy Section */}
//                 <div className="border border-gray-200 border-l-4 border-l-black rounded-lg p-5 bg-[#F2F2F7]">
//                     <div className="flex items-start justify-between gap-6">
//                         {/* Left Side - Text Content */}
//                         <div className="flex-1">
//                             <h3 className="font-semibold text-gray-900 mb-2 text-sm">Document privacy</h3>
//                             <p className="text-xs text-gray-600 mb-4">
//                                 This document's visibility is managed automatically. If it isn't linked to anything, it follows workspace-level access. Once linked, only members of the selected Portfolio, Project, or Team will have access.
//                             </p>
//                         </div>

//                         {/* Right Side - User Info */}
//                         <div className="w-80">
//                             <div className="flex items-center justify-between">
//                                 <div className="flex items-center justify-between">
//                                     <div className="flex items-center gap-3">
//                                         <Avatar className="h-10 w-10">
//                                             <AvatarImage src={user?.profilePictureUrl || ""} alt={user?.name || "User"} />
//                                             <AvatarFallback className="bg-[#FF6B35] text-white text-sm">
//                                                 {user?.name?.charAt(0)?.toUpperCase() || "R"}
//                                             </AvatarFallback>
//                                         </Avatar>
//                                         <div>
//                                             <p className="font-medium text-sm text-gray-900">{user?.name || "Rahul Mondal"}</p>
//                                             <p className="text-xs text-gray-500">{user?.email || "name@email.com"}</p>
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <span className="text-xs text-gray-500 font-medium">Admin</span>

//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Action Buttons - FULL WIDTH */}
//             <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 px-12">
//                 <Button
//                     variant="outline"
//                     onClick={handleCancel}
//                     className="h-10"
//                 >
//                     Cancel
//                 </Button>
//                 <Button
//                     onClick={handleCreateDocument}
//                     disabled={!isFormValid() || isSubmitting}
//                     className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white disabled:bg-gray-300 disabled:cursor-not-allowed h-10 flex items-center justify-center gap-2"
//                 >
//                     {isSubmitting ? (
//                         <>
//                             <Loader2 className="w-4 h-4 animate-spin" />
//                             Creating...
//                         </>
//                     ) : (
//                         "Create Document"
//                     )}
//                 </Button>
//             </div>
//         </div>

//     );
// }
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocStore } from "@/stores/useDoc-store";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useProfileStore } from "@/stores/profile-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProjectsStore } from "@/stores/projects-store";
import { ChevronDown, Plus, X, Loader2 } from "lucide-react";
import { useTeamStore } from "@/stores/teams-store";
import { usePortfoliosStore } from "@/stores/portfolios-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
// import { createChildDocument, createRootDocument } from "@/lib/api/documents-api";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/sonner";

export default function DocsCreatePage() {
    const { addDocument, loadDocuments, createDoc, updateDocument, fetchRootDocuments } = useDocStore();
    const { currentWorkspace } = useWorkspaceStore();
    const { user } = useProfileStore()
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get("from");
    const urlProjectId = searchParams.get("projectId");
    const portfolioId = searchParams.get("portfolioId");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [documentName, setDocumentName] = useState("");
    const [documentIdentifier, setDocumentIdentifier] = useState("");
    // const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [linkTo, setLinkTo] = useState("");
    const { projects, fetchProjects } = useProjectsStore();
    const [selectedType, setSelectedType] = useState<string>("");
    const [selectedProject, setSelectedProject] = useState<string>("")
    const [selectedProjects, setSelectedProjects] = useState<string[]>(urlProjectId ? [urlProjectId] : []);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([]);
    const [showLinkSection, setShowLinkSection] = useState(false);
    const [activeTab, setActiveTab] = useState<"portfolio" | "project" | "team" | "document">("project");
    const { teams, fetchTeams } = useTeamStore();
    const { portfolios, fetchPortfolios } = usePortfoliosStore();
    const { documents } = useDocStore();
    const docList = Array.from(documents.values()).filter(doc => !doc.parentId); // Only root docs for linking

    // useEffect(() => {
    //     fetchProjects();
    // }, [fetchProjects]);

    useEffect(() => {
        fetchProjects();
        fetchTeams();
        fetchPortfolios(currentWorkspace?.id);
        if (!user) {
            console.log("Fetching user profile in DocsCreatePage...");
            useProfileStore.getState().fetchUserProfile();
        }
    }, [fetchProjects, fetchTeams, fetchPortfolios, user]);

    useEffect(() => {
        if (urlProjectId) {
            setSelectedProjects(prev => [...new Set([...prev, urlProjectId])]);
        }
        if (portfolioId) {
            setSelectedPortfolios(prev => [...new Set([...prev, portfolioId])]);
        }
    }, [urlProjectId, portfolioId]);

    useEffect(() => {
        fetchRootDocuments();
    }, [fetchRootDocuments]);

    // Get the selected project details
    const currentProject = projects.find((p) => p.id === selectedProject);

    const handleDocumentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setDocumentName(name);
        const identifier = name.slice(0, 3).replace(/\s/g, '').toUpperCase();
        setDocumentIdentifier(identifier);
    };



    const handleCreateDocument = async () => {
        setIsSubmitting(true);
        try {
            const newId = await createDoc(documentName || "Untitled");
            if (!newId) throw new Error("Failed to create document");

            const allLinkedPortfolios = portfolioId
                ? [...new Set([...(selectedPortfolios || []), portfolioId])]
                : selectedPortfolios || [];

            const allLinkedProjects = urlProjectId
                ? [...new Set([...selectedProjects, urlProjectId])]
                : selectedProjects;

            const hasLinks =
                allLinkedProjects.length > 0 ||
                selectedTeams.length > 0 ||
                selectedDocs.length > 0 ||
                allLinkedPortfolios.length > 0;

            if (hasLinks) {
                await updateDocument(newId, {
                    linkedProjects: allLinkedProjects,
                    linkedTeams: selectedTeams,
                    linkedDocuments: selectedDocs,
                    linkedPortfolios: allLinkedPortfolios,
                });
            }

            if (from === "portfolio" && portfolioId) {
                router.push(`/docs/${newId}?from=portfolio&portfolioId=${portfolioId}`);
            } else if (from === "project" && urlProjectId) {
                router.push(`/docs/${newId}?from=project&projectId=${urlProjectId}`);
            } else {
                router.push(`/docs/${newId}`);
            }
        } catch (err) {
            console.error("Create doc error:", err);
            toast("error", { title: "Failed to create document" });
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleCancel = () => {
        router.push('/docs');
    };



    // Add/Remove handlers
    const handleAddProject = (projectId: string) => {
        if (!selectedProjects.includes(projectId)) {
            setSelectedProjects([...selectedProjects, projectId]);
        }
    };

    const handleRemoveProject = (projectId: string) => {
        setSelectedProjects(selectedProjects.filter(id => id !== projectId));
    };
    const handleAddTeam = (teamId: string) => {
        if (!selectedTeams.includes(teamId)) {
            setSelectedTeams([...selectedTeams, teamId]);
        }
    };

    const handleRemoveTeam = (teamId: string) => {
        setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    };

    const handleAddDocumentLink = (docId: string) => {
        if (!selectedDocs.includes(docId)) {
            setSelectedDocs([...selectedDocs, docId]);
        }
    };

    const handleRemoveDocumentLink = (docId: string) => {
        setSelectedDocs(selectedDocs.filter(id => id !== docId));
    };

    const handleAddPortfolio = (pId: string) => {
        if (!selectedPortfolios.includes(pId)) {
            setSelectedPortfolios([...selectedPortfolios, pId]);
        }
    };

    const handleRemovePortfolio = (pId: string) => {
        setSelectedPortfolios(selectedPortfolios.filter(id => id !== pId));
    };


    const isFormValid = () => {
        return documentName.trim();
    };

    return (
        <div className="space-y-6">
            <div className="border-b border-border">
                <Breadcrumbs />
            </div>

            {/* Content with padding on both sides */}
            <div className="px-7 space-y-6">

                {/* Document Name and Identifier Section */}
                <div className="bg-muted/50 dark:bg-card/30 p-4 rounded-md">
                    <div className="flex gap-6">
                        {/* Document Name */}
                        <div className="w-80">
                            <label className="block text-xs font-medium text-muted-foreground mb-2">
                                Document name
                            </label>
                            <Input
                                type="text"
                                value={documentName}
                                onChange={handleDocumentNameChange}
                                placeholder="e.g. West Bengal"
                                className="h-10 bg-background dark:bg-card text-foreground"
                            />
                        </div>

                        {/* Document Identifier */}
                        <div className="w-80">
                            <label className="block text-xs font-medium text-muted-foreground mb-2">
                                Document identifier
                            </label>
                            <Input
                                type="text"
                                value={documentIdentifier}
                                onChange={(e) => setDocumentIdentifier(e.target.value)}
                                placeholder="e.g. WES"
                                className="h-10 bg-background dark:bg-card text-foreground"
                            />
                        </div>
                    </div>
                </div>

                {/* Labels Section */}
                <div className="border border-border border-l-4 border-l-primary rounded-lg p-5 bg-card">
                    <div className="flex items-start justify-between gap-6">
                        {/* Left Side - Text Content */}
                        <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-2 text-sm">Labels</h3>
                            <p className="text-xs text-muted-foreground">
                                Create and manage labels to categorize and organize documents, making it easier for your team to filter and track work.
                            </p>
                        </div>


                        {/* Right Side - Dropdown for Type Selection */}
                        <div className="w-80">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 justify-between bg-background dark:bg-card text-foreground"
                                    >
                                        <span className="text-sm text-foreground">Select</span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </DropdownMenu>
                        </div>

                    </div>
                </div>


                {/* Link Document Section */}
                <div className="border border-border border-l-4 border-l-primary rounded-lg p-5 bg-card">
                    <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-2 text-sm">Link this document to</h3>
                            <p className="text-xs text-muted-foreground">
                                Link this document to a Portfolio, Project, or Team to ensure it's organized, discoverable, and accessible in the right workspace.
                            </p>
                        </div>

                        <div className="w-80">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 justify-start bg-background dark:bg-card text-primary hover:text-primary/90 hover:bg-muted"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Link this doc
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-80 p-0 bg-popover border border-border text-popover-foreground shadow-lg rounded-md">
                                    <div className="flex border-b border-border px-1 pt-1">
                                        <button
                                            onClick={() => setActiveTab("project")}
                                            className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "project"
                                                ? "text-foreground border-b-2 border-primary -mb-[2px]"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            Project
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("portfolio")}
                                            className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "portfolio"
                                                ? "text-foreground border-b-2 border-primary -mb-[2px]"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            Portfolio
                                        </button>

                                        <button
                                            onClick={() => setActiveTab("document")}
                                            className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "document"
                                                ? "text-foreground border-b-2 border-primary -mb-[2px]"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            Documents
                                        </button>

                                    </div>

                                    <div className="p-2 bg-popover text-popover-foreground">
                                        {/* Empty State Image Logic */}
                                        {(() => {
                                            const isEmpty = (activeTab === "project" && projects.length === 0) ||
                                                (activeTab === "team" && teams.length === 0) ||
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
                                                <div className="py-8 flex flex-col items-center justify-center text-center px-4 bg-popover text-popover-foreground">
                                                    <img
                                                        src={config[activeTab].image}
                                                        alt={config[activeTab].title}
                                                        className="w-60 h-32 mb-4 opacity-80 dark:brightness-90 dark:contrast-125"
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
                                            <div className="bg-popover text-popover-foreground">
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
                                                                />

                                                                <span className="text-sm text-foreground flex-1">
                                                                    {project.name}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === "team" && teams.length > 0 && (
                                            <div className="bg-popover text-popover-foreground">
                                                <p className="text-xs text-muted-foreground mb-3">Recent Teams</p>
                                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                                    {teams.map((team) => {
                                                        const isSelected = selectedTeams.includes(team.id!);

                                                        return (
                                                            <div
                                                                key={team.id}
                                                                className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-muted" : "hover:bg-muted/50"
                                                                    }`}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        handleRemoveTeam(team.id!);
                                                                    } else {
                                                                        handleAddTeam(team.id!);
                                                                    }
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            handleAddTeam(team.id!);
                                                                        } else {
                                                                            handleRemoveTeam(team.id!);
                                                                        }
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                                />

                                                                <span className="text-sm text-foreground flex-1">
                                                                    {team.name}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === "document" && docList.length > 0 && (
                                            <div className="bg-popover text-popover-foreground">
                                                <p className="text-xs text-muted-foreground mb-3">Recent Documents</p>
                                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                                    {docList.map((doc) => {
                                                        const isSelected = selectedDocs.includes(doc.id);

                                                        return (
                                                            <div
                                                                key={doc.id}
                                                                className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-muted" : "hover:bg-muted/50"
                                                                    }`}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        handleRemoveDocumentLink(doc.id);
                                                                    } else {
                                                                        handleAddDocumentLink(doc.id);
                                                                    }
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            handleAddDocumentLink(doc.id);
                                                                        } else {
                                                                            handleRemoveDocumentLink(doc.id);
                                                                        }
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                                />

                                                                <span className="text-sm text-foreground flex-1">
                                                                    {doc.title}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === "portfolio" && portfolios.length > 0 && (
                                            <div className="bg-popover text-popover-foreground">
                                                <p className="text-xs text-muted-foreground mb-3">Recent Portfolios</p>
                                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                                    {portfolios.map((p) => {
                                                        const isSelected = selectedPortfolios.includes(p.id);

                                                        return (
                                                            <div
                                                                key={p.id}
                                                                className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-muted" : "hover:bg-muted/50"
                                                                    }`}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        handleRemovePortfolio(p.id);
                                                                    } else {
                                                                        handleAddPortfolio(p.id);
                                                                    }
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            handleAddPortfolio(p.id);
                                                                        } else {
                                                                            handleRemovePortfolio(p.id);
                                                                        }
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                                />

                                                                <span className="text-sm text-foreground flex-1">
                                                                    {p.name}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Show Selected Projects */}
                    {selectedProjects.length > 0 && (
                        <div className="mt-4">
                            <div className="flex flex-wrap gap-2">
                                {selectedProjects.map((projectId) => {
                                    const project = projects.find(p => p.id === projectId);
                                    if (!project) return null;

                                    // Get project color or use default
                                    const bgColor = project.color || project.icon?.color || "#E5E5EA";

                                    return (
                                        <div
                                            key={project.id}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-foreground bg-muted"
                                            style={{ backgroundColor: `${bgColor}20` }}
                                        >
                                            <span>{project.name}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemoveProject(project.id!);
                                                }}
                                                className="hover:bg-foreground/10 rounded p-0.5 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Show Selected Teams */}
                    {selectedTeams.length > 0 && (
                        <div className="mt-4">
                            <div className="flex flex-wrap gap-2">
                                {selectedTeams.map((teamId) => {
                                    const team = teams.find(t => t.id === teamId);
                                    if (!team) return null;

                                    // Use a default color for teams
                                    const bgColor = "#8E8E93";

                                    return (
                                        <div
                                            key={team.id}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-foreground bg-muted"
                                            style={{ backgroundColor: `${bgColor}20` }}
                                        >
                                            <span>{team.name}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemoveTeam(team.id!);
                                                }}
                                                className="hover:bg-foreground/10 rounded p-0.5 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {/* Show Selected Documents */}
                    {selectedDocs.length > 0 && (
                        <div className="mt-4">
                            <div className="flex flex-wrap gap-2">
                                {selectedDocs.map((docId: string) => {
                                    const doc = docList.find(d => d.id === docId);
                                    if (!doc) return null;

                                    const bgColor = "#6366F1"; // purple for docs

                                    return (
                                        <div
                                            key={doc.id}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-foreground bg-muted"
                                            style={{ backgroundColor: `${bgColor}20` }}
                                        >
                                            <span>{doc.title}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemoveDocumentLink(doc.id);
                                                }}
                                                className="hover:bg-foreground/10 rounded p-0.5 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Show Selected Portfolios */}
                    {selectedPortfolios.length > 0 && (
                        <div className="mt-4">
                            <div className="flex flex-wrap gap-2">
                                {selectedPortfolios.map((pId: string) => {
                                    const p = portfolios.find(port => port.id === pId);
                                    if (!p) return null;

                                    const bgColor = "#F68C1F"; // orange for portfolios

                                    return (
                                        <div
                                            key={p.id}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-foreground bg-muted"
                                            style={{ backgroundColor: `${bgColor}20` }}
                                        >
                                            <span>{p.name}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemovePortfolio(p.id);
                                                }}
                                                className="hover:bg-foreground/10 rounded p-0.5 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>



                {/* Document Privacy Section */}
                <div className="border border-border border-l-4 border-l-primary rounded-lg p-5 bg-muted/50 dark:bg-card/30">
                    <div className="flex items-start justify-between gap-6">
                        {/* Left Side - Text Content */}
                        <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-2 text-sm">Document privacy</h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                This document's visibility is managed automatically. If it isn't linked to anything, it follows workspace-level access. Once linked, only members of the selected Portfolio, Project, or Team will have access.
                            </p>
                        </div>

                        {/* Right Side - User Info */}
                        <div className="w-80">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user?.profilePictureUrl || ""} alt={user?.name || "User"} />
                                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                                            {user?.name?.charAt(0)?.toUpperCase() || "R"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm text-foreground">{user?.name || "Rahul Mondal"}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email || "name@email.com"}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">Admin</span>

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons - FULL WIDTH */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border px-12">
                <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="h-10"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleCreateDocument}
                    disabled={!isFormValid() || isSubmitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed h-10 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        "Create Document"
                    )}
                </Button>
            </div>
        </div>

    );
}
//kartik code

// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { useDocStore } from "@/stores/useDoc-store";

// import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
// import { useProfileStore } from "@/stores/profile-store";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { useProjectsStore } from "@/stores/projects-store";
// import { ChevronDown, Plus, X } from "lucide-react";
// import { useTeamStore } from "@/stores/teams-store";
// import { createChildDocument, createRootDocument } from "@/lib/api/documents-api";

// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Checkbox } from "@/components/ui/checkbox";
// export default function DocsCreatePage() {
//     const { addDocument } = useDocStore();
//     const { user } = useProfileStore()
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const urlProjectId = searchParams.get("projectId");

//     const [documentName, setDocumentName] = useState("");
//     const [documentIdentifier, setDocumentIdentifier] = useState("");
//     const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
//     const [linkTo, setLinkTo] = useState("");
//     const { projects, fetchProjects } = useProjectsStore();
//     const [selectedType, setSelectedType] = useState<string>("");
//     const [selectedProject, setSelectedProject] = useState<string>("")
//     const [selectedProjects, setSelectedProjects] = useState<string[]>(urlProjectId ? [urlProjectId] : []);
//     const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
//     const [showLinkSection, setShowLinkSection] = useState(false);
//     const [activeTab, setActiveTab] = useState<"portfolio" | "project" | "team" | "document">("project");
//     const { teams, fetchTeams } = useTeamStore();
//     const { documents } = useDocStore();
//     const docList = Array.from(documents.values()).filter(doc => !doc.parentId); // Only root docs for linking

//     // useEffect(() => {
//     //     fetchProjects();
//     // }, [fetchProjects]);

//     useEffect(() => {
//         fetchProjects();
//         fetchTeams();
//         if (!user) {
//             console.log("Fetching user profile in DocsCreatePage...");
//             useProfileStore.getState().fetchUserProfile();
//         }
//     }, [fetchProjects, fetchTeams, user]);

//     useEffect(() => {
//         if (urlProjectId && !selectedProjects.includes(urlProjectId)) {
//             setSelectedProjects(prev => [...prev, urlProjectId]);
//         }
//     }, [urlProjectId]);

//     // Get the selected project details
//     const currentProject = projects.find((p) => p.id === selectedProject);

//     const handleDocumentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const name = e.target.value;
//         setDocumentName(name);
//         const identifier = name.slice(0, 3).replace(/\s/g, '').toUpperCase();
//         setDocumentIdentifier(identifier);
//     };

//     const handleCreateDocument = async () => {
//         console.log("Creating document with user:", user); // DEBUG LOG

//         const createdByData = user ? {
//             userId: user.id || '',
//             name: user.name || 'Unknown User',
//             profilePictureUrl: user.profilePictureUrl
//         } : undefined;

//         console.log("CreatedBy Data:", createdByData); // DEBUG LOG

//         // If not linked to a project/task, create a standalone root document.
//         const parentId = selectedProjects?.[0] || urlProjectId;
//         const created = parentId
//             ? await createChildDocument(parentId, documentName || "Untitled")
//             : await createRootDocument(documentName || "Untitled");

//         // Cache minimal metadata for UI
//         addDocument({
//             id: created.id,
//             title: created.title || documentName || "Untitled",
//             parentId: parentId || null,
//             icon: "📄",
//             content: [{ type: "paragraph", content: [] }],
//             linkedProjects: selectedProjects,
//             linkedTeams: selectedTeams,
//             createdBy: createdByData,
//         });

//         router.push(`/docs/${created.id}`);
//     };

//     const handleCancel = () => {
//         router.push('/docs');
//     };



//     // Add/Remove handlers
//     const handleAddProject = (projectId: string) => {
//         if (!selectedProjects.includes(projectId)) {
//             setSelectedProjects([...selectedProjects, projectId]);
//         }
//     };

//     const handleRemoveProject = (projectId: string) => {
//         setSelectedProjects(selectedProjects.filter(id => id !== projectId));
//     };
//     const handleAddTeam = (teamId: string) => {
//         if (!selectedTeams.includes(teamId)) {
//             setSelectedTeams([...selectedTeams, teamId]);
//         }
//     };

//     const handleRemoveTeam = (teamId: string) => {
//         setSelectedTeams(selectedTeams.filter(id => id !== teamId));
//     };

//     const handleAddDocumentLink = (docId: string) => {
//         if (!selectedLabels.includes(docId)) {
//             setSelectedLabels([...selectedLabels, docId]);
//         }
//     };

//     const handleRemoveDocumentLink = (docId: string) => {
//         setSelectedLabels(selectedLabels.filter(id => id !== docId));
//     };

//     const isFormValid = () => {
//         return documentName.trim();
//     };

//     return (
//         <div className="space-y-6">
//             <div className="border-b">
//                 <Breadcrumbs />
//             </div>

//             {/* Content with padding on both sides */}
//             <div className="px-7 space-y-6 ">

//                 {/* Document Name and Identifier Section */}
//                 <div className="bg-[#F2F2F7] p-4 rounded-md ">
//                     <div className="flex gap-6">
//                         {/* Document Name */}
//                         <div className="w-80">
//                             <label className="block text-xs font-medium text-[#8E8E93] mb-2">
//                                 Document name
//                             </label>
//                             <Input
//                                 type="text"
//                                 value={documentName}
//                                 onChange={handleDocumentNameChange}
//                                 placeholder="e.g. West Bengal"
//                                 className="h-10 bg-white"
//                             />
//                         </div>

//                         {/* Document Identifier */}
//                         <div className="w-80">
//                             <label className="block text-xs font-medium text-[#8E8E93] mb-2">
//                                 Document identifier
//                             </label>
//                             <Input
//                                 type="text"
//                                 value={documentIdentifier}
//                                 onChange={(e) => setDocumentIdentifier(e.target.value)}
//                                 placeholder="e.g. WES"
//                                 className="h-10 bg-white"
//                             />
//                         </div>
//                     </div>
//                 </div>

//                 {/* Labels Section */}
//                 <div className="border border-gray-200 border-l-4 border-l-black rounded-lg p-5 bg-white">
//                     <div className="flex items-start justify-between gap-6">
//                         {/* Left Side - Text Content */}
//                         <div className="flex-1">
//                             <h3 className="font-semibold text-gray-900 mb-2 text-sm">Labels</h3>
//                             <p className="text-xs text-gray-600">
//                                 Create and manage labels to categorize and organize documents, making it easier for your team to filter and track work.
//                             </p>
//                         </div>


//                         {/* Right Side - Dropdown for Type Selection */}
//                         <div className="w-80">
//                             <DropdownMenu>
//                                 <DropdownMenuTrigger asChild>
//                                     <Button
//                                         variant="outline"
//                                         className="w-full h-10 justify-between bg-white"
//                                     >
//                                         <span className="text-sm text-gray-700">Select</span>
//                                         <ChevronDown className="w-4 h-4 text-gray-500" />
//                                     </Button>
//                                 </DropdownMenuTrigger>
//                                 {/* <DropdownMenuContent className="w-80">
//                                     <div
//                                         className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
//                                         onClick={() => setSelectedType("portfolio")}
//                                     >
//                                         Portfolio
//                                     </div>
//                                     <div
//                                         className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
//                                         onClick={() => setSelectedType("project")}
//                                     >
//                                         Project
//                                     </div>
//                                     <div
//                                         className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
//                                         onClick={() => setSelectedType("team")}
//                                     >
//                                         Team
//                                     </div>
//                                 </DropdownMenuContent> */}
//                             </DropdownMenu>
//                         </div>





//                     </div>
//                 </div>


//                 {/* Link Document Section */}
//                 <div className="border border-gray-200 border-l-4 border-l-black rounded-lg p-5 bg-white">
//                     <div className="flex items-start justify-between gap-6">
//                         <div className="flex-1">
//                             <h3 className="font-semibold text-gray-900 mb-2 text-sm">Link this document to</h3>
//                             <p className="text-xs text-gray-600">
//                                 Link this document to a Portfolio, Project, or Team to ensure it's organized, discoverable, and accessible in the right workspace.
//                             </p>
//                         </div>

//                         <div className="w-80">
//                             <DropdownMenu>
//                                 <DropdownMenuTrigger asChild>
//                                     <Button
//                                         variant="outline"
//                                         className="w-full h-10 justify-start bg-white text-[#001F3F] hover:text-[#001F3F]/90 hover:bg-gray-100"
//                                     >
//                                         <Plus className="w-4 h-4 mr-2" />
//                                         Link this doc
//                                     </Button>
//                                 </DropdownMenuTrigger>
//                                 <DropdownMenuContent className="w-80 p-0">
//                                     <div className="flex border-b border-gray-200 px-1 pt-1">
//                                         <button
//                                             onClick={() => setActiveTab("project")}
//                                             className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "project"
//                                                 ? "text-gray-900 border-b-2 border-black -mb-[2px]"
//                                                 : "text-gray-500 hover:text-gray-700"
//                                                 }`}
//                                         >
//                                             Project
//                                         </button>
//                                         <button
//                                             onClick={() => setActiveTab("team")}
//                                             className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "team"
//                                                 ? "text-gray-900 border-b-2 border-black -mb-[2px]"
//                                                 : "text-gray-500 hover:text-gray-700"
//                                                 }`}
//                                         >
//                                             Teams
//                                         </button>
//                                         <button
//                                             onClick={() => setActiveTab("portfolio")}
//                                             className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "portfolio"
//                                                 ? "text-gray-900 border-b-2 border-black -mb-[2px]"
//                                                 : "text-gray-500 hover:text-gray-700"
//                                                 }`}
//                                         >
//                                             Portfolio
//                                         </button>

//                                         <button
//                                             onClick={() => setActiveTab("document")}
//                                             className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "document"
//                                                 ? "text-gray-900 border-b-2 border-black -mb-[2px]"
//                                                 : "text-gray-500 hover:text-gray-700"
//                                                 }`}
//                                         >
//                                             Documents
//                                         </button>

//                                     </div>

//                                     <div className="p-2">
//                                         {/* Empty State Image Logic */}
//                                         {(() => {
//                                             const isEmpty = (activeTab === "project" && projects.length === 0) ||
//                                                 (activeTab === "team" && teams.length === 0) ||
//                                                 (activeTab === "portfolio") || // Portfolios always empty for now
//                                                 (activeTab === "document" && docList.length === 0);

//                                             if (!isEmpty) return null;

//                                             const config = {
//                                                 project: {
//                                                     image: "/images/project.svg",
//                                                     title: "No Project found",
//                                                     desc: "Please create a project in the Project section first, then return here to link it."
//                                                 },
//                                                 portfolio: {
//                                                     image: "/images/portfolio-image.svg",
//                                                     title: "No Portfolio found",
//                                                     desc: "Please create a portfolio in the Portfolio section first, then return here to link it."
//                                                 },
//                                                 team: {
//                                                     image: "/images/TeamsEmpty.svg",
//                                                     title: "No Team found",
//                                                     desc: "Please create a team in the Team section first, then return here to link it."
//                                                 },
//                                                 document: {
//                                                     image: "/images/docs-image.png",
//                                                     title: "No Document found",
//                                                     desc: "Please create a document in the Document section first, then return here to link it."
//                                                 }
//                                             };

//                                             return (
//                                                 <div className="py-8 flex flex-col items-center justify-center text-center px-4">
//                                                     <img
//                                                         src={config[activeTab].image}
//                                                         alt={config[activeTab].title}
//                                                         className="w-60 h-32 mb-4 opacity-80"
//                                                     />
//                                                     <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight">
//                                                         {config[activeTab].title}
//                                                     </h3>
//                                                     <p className="text-xs text-gray-500 leading-normal max-w-[240px]">
//                                                         {config[activeTab].desc}
//                                                     </p>
//                                                 </div>
//                                             );
//                                         })()}

//                                         {activeTab === "project" && projects.length > 0 && (
//                                             <div>
//                                                 <p className="text-xs text-gray-500 mb-3">Recent Projects</p>
//                                                 <div className=" max-h-60 overflow-y-auto">
//                                                     {projects.map((project) => {
//                                                         const isSelected = selectedProjects.includes(project.id!);

//                                                         return (
//                                                             <div
//                                                                 key={project.id}
//                                                                 className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-gray-100" : "hover:bg-gray-50"
//                                                                     }`}
//                                                                 onClick={() => {
//                                                                     if (isSelected) {
//                                                                         handleRemoveProject(project.id!);
//                                                                     } else {
//                                                                         handleAddProject(project.id!);
//                                                                     }
//                                                                 }}
//                                                             >
//                                                                 <Checkbox
//                                                                     checked={isSelected}
//                                                                     onCheckedChange={(checked) => {
//                                                                         if (checked) {
//                                                                             handleAddProject(project.id!);
//                                                                         } else {
//                                                                             handleRemoveProject(project.id!);
//                                                                         }
//                                                                     }}
//                                                                     onClick={(e) => e.stopPropagation()}
//                                                                     className="data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#001F3F]"
//                                                                 />

//                                                                 <span className="text-sm text-gray-900 flex-1">
//                                                                     {project.name}
//                                                                 </span>
//                                                             </div>
//                                                         );
//                                                     })}
//                                                 </div>
//                                             </div>
//                                         )}

//                                         {activeTab === "team" && teams.length > 0 && (
//                                             <div>
//                                                 <p className="text-xs text-gray-500 mb-3">Recent Teams</p>
//                                                 <div className="space-y-1 max-h-60 overflow-y-auto">
//                                                     {teams.map((team) => {
//                                                         const isSelected = selectedTeams.includes(team.id!);

//                                                         return (
//                                                             <div
//                                                                 key={team.id}
//                                                                 className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-gray-100" : "hover:bg-gray-50"
//                                                                     }`}
//                                                                 onClick={() => {
//                                                                     if (isSelected) {
//                                                                         handleRemoveTeam(team.id!);
//                                                                     } else {
//                                                                         handleAddTeam(team.id!);
//                                                                     }
//                                                                 }}
//                                                             >
//                                                                 <Checkbox
//                                                                     checked={isSelected}
//                                                                     onCheckedChange={(checked) => {
//                                                                         if (checked) {
//                                                                             handleAddTeam(team.id!);
//                                                                         } else {
//                                                                             handleRemoveTeam(team.id!);
//                                                                         }
//                                                                     }}
//                                                                     onClick={(e) => e.stopPropagation()}
//                                                                     className="data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#001F3F]"
//                                                                 />

//                                                                 <span className="text-sm text-gray-900 flex-1">
//                                                                     {team.name}
//                                                                 </span>
//                                                             </div>
//                                                         );
//                                                     })}
//                                                 </div>
//                                             </div>
//                                         )}

//                                         {activeTab === "document" && docList.length > 0 && (
//                                             <div>
//                                                 <p className="text-xs text-gray-500 mb-3">Recent Documents</p>
//                                                 <div className="space-y-1 max-h-60 overflow-y-auto">
//                                                     {docList.map((doc) => {
//                                                         const isSelected = selectedLabels.includes(doc.id);

//                                                         return (
//                                                             <div
//                                                                 key={doc.id}
//                                                                 className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-gray-100" : "hover:bg-gray-50"
//                                                                     }`}
//                                                                 onClick={() => {
//                                                                     if (isSelected) {
//                                                                         handleRemoveDocumentLink(doc.id);
//                                                                     } else {
//                                                                         handleAddDocumentLink(doc.id);
//                                                                     }
//                                                                 }}
//                                                             >
//                                                                 <Checkbox
//                                                                     checked={isSelected}
//                                                                     onCheckedChange={(checked) => {
//                                                                         if (checked) {
//                                                                             handleAddDocumentLink(doc.id);
//                                                                         } else {
//                                                                             handleRemoveDocumentLink(doc.id);
//                                                                         }
//                                                                     }}
//                                                                     onClick={(e) => e.stopPropagation()}
//                                                                     className="data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#001F3F]"
//                                                                 />

//                                                                 <span className="text-sm text-gray-900 flex-1">
//                                                                     {doc.title}
//                                                                 </span>
//                                                             </div>
//                                                         );
//                                                     })}
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </DropdownMenuContent>
//                             </DropdownMenu>
//                         </div>
//                     </div>

//                     {/* Show Selected Projects */}
//                     {selectedProjects.length > 0 && (
//                         <div className="mt-4">
//                             <div className="flex flex-wrap gap-2">
//                                 {selectedProjects.map((projectId) => {
//                                     const project = projects.find(p => p.id === projectId);
//                                     if (!project) return null;

//                                     // Get project color or use default
//                                     const bgColor = project.color || project.icon?.color || "#E5E5EA";

//                                     return (
//                                         <div
//                                             key={project.id}
//                                             className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700"
//                                             style={{ backgroundColor: `${bgColor}20` }}
//                                         >
//                                             <span>{project.name}</span>
//                                             <button
//                                                 onClick={(e) => {
//                                                     e.preventDefault();
//                                                     e.stopPropagation();
//                                                     handleRemoveProject(project.id!);
//                                                 }}
//                                                 className="hover:bg-black/10 rounded p-0.5 transition-colors"
//                                             >
//                                                 <X className="w-3.5 h-3.5 text-gray-600" />
//                                             </button>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         </div>
//                     )}

//                     {/* Show Selected Teams */}
//                     {selectedTeams.length > 0 && (
//                         <div className="mt-4">
//                             <div className="flex flex-wrap gap-2">
//                                 {selectedTeams.map((teamId) => {
//                                     const team = teams.find(t => t.id === teamId);
//                                     if (!team) return null;

//                                     // Use a default color for teams
//                                     const bgColor = "#8E8E93";

//                                     return (
//                                         <div
//                                             key={team.id}
//                                             className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700"
//                                             style={{ backgroundColor: `${bgColor}20` }}
//                                         >
//                                             <span>{team.name}</span>
//                                             <button
//                                                 onClick={(e) => {
//                                                     e.preventDefault();
//                                                     e.stopPropagation();
//                                                     handleRemoveTeam(team.id!);
//                                                 }}
//                                                 className="hover:bg-black/10 rounded p-0.5 transition-colors"
//                                             >
//                                                 <X className="w-3.5 h-3.5 text-gray-600" />
//                                             </button>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         </div>
//                     )}
//                 </div>



//                 {/* Document Privacy Section */}
//                 <div className="border border-gray-200 border-l-4 border-l-black rounded-lg p-5 bg-[#F2F2F7]">
//                     <div className="flex items-start justify-between gap-6">
//                         {/* Left Side - Text Content */}
//                         <div className="flex-1">
//                             <h3 className="font-semibold text-gray-900 mb-2 text-sm">Document privacy</h3>
//                             <p className="text-xs text-gray-600 mb-4">
//                                 This document's visibility is managed automatically. If it isn't linked to anything, it follows workspace-level access. Once linked, only members of the selected Portfolio, Project, or Team will have access.
//                             </p>
//                         </div>

//                         {/* Right Side - User Info */}
//                         <div className="w-80">
//                             <div className="flex items-center justify-between">
//                                 <div className="flex items-center justify-between">
//                                     <div className="flex items-center gap-3">
//                                         <Avatar className="h-10 w-10">
//                                             <AvatarImage src={user?.profilePictureUrl || ""} alt={user?.name || "User"} />
//                                             <AvatarFallback className="bg-[#FF6B35] text-white text-sm">
//                                                 {user?.name?.charAt(0)?.toUpperCase() || "R"}
//                                             </AvatarFallback>
//                                         </Avatar>
//                                         <div>
//                                             <p className="font-medium text-sm text-gray-900">{user?.name || "Rahul Mondal"}</p>
//                                             <p className="text-xs text-gray-500">{user?.email || "name@email.com"}</p>
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <span className="text-xs text-gray-500 font-medium">Admin</span>

//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Action Buttons - FULL WIDTH */}
//             <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 px-12">
//                 <Button
//                     variant="outline"
//                     onClick={handleCancel}
//                     className="h-10"
//                 >
//                     Cancel
//                 </Button>
//                 <Button
//                     onClick={handleCreateDocument}
//                     disabled={!isFormValid()}
//                     className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white disabled:bg-gray-300 disabled:cursor-not-allowed h-10"
//                 >
//                     Create Document
//                 </Button>
//             </div>
//         </div>

//     );
// }




