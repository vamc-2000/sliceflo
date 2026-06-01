//without pathing code
"use client";

import React, { ReactNode, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import iconMap from "@/lib/iconMap";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface MenuItem {
  id: string;
  text: string;
}

interface Project {
  id: string;
  name: string;
  icon?: {
    iconId: string;
    type: "icon" | "file";
    name: string;
    color: string;
    presignedUrl?: string;
  } | null;
  iconId?: string | null;
  color?: string;
}
type TabType = "workspace" | "projects";

interface CommandHubLayoutProps {
  title: ReactNode;
  arrowIcon?: ReactNode;
  subtitle?: ReactNode;
  menuItems: MenuItem[];
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: TabType) => void;
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  projects?: Project[];
  onProjectChange?: (projectId: string) => void;
}

const CommandHubLayout = ({
  title,
  subtitle,
  menuItems,
  children,
  activeTab,
  onTabChange,
  activeSection,
  onSectionChange,
  projects = [],
  onProjectChange,
}: CommandHubLayoutProps) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(
    projects.length > 0 ? projects[0] : null // Handle empty state
  );

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  const handleProjectChange = (project: Project) => {
    setSelectedProject(project);
    // Notify parent component
    if (onProjectChange && project.id) {
      onProjectChange(project.id);
    }
  };

  const renderProjectIcon = (project: Project) => {
    // Priority 1: Check if project has icon object with file type
    if (project.icon?.type === "file" && project.icon?.presignedUrl) {
      return (
        <div className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0">
          <Image
            src={project.icon.presignedUrl}
            alt={project.name}
            width={24}
            height={24}
            unoptimized
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    // Priority 2: Check if project has icon object with icon type (from library)
    if (project.icon?.type === "icon" && project.icon?.name) {
      const IconComponent = iconMap[project.icon.name as keyof typeof iconMap];
      if (IconComponent) {
        return (
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: project.icon.color || project.color || '#3b82f6' }}
          >
            <IconComponent
              size={16}
              className="h-4 w-4 text-white" />
          </div>
        );
      }
    }

    // Priority 3: Fallback to first letter with color
    const backgroundColor = project.icon?.color || project.color || '#3b82f6';
    const firstLetter = project.name.charAt(0).toUpperCase();

    return (
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
        style={{ backgroundColor }}
      >
        {firstLetter}
      </div>
    );
  };

  const Sidebar = () => (
    <div className="space-y-2">
      {/* Project Selector - Only show when Projects tab is active */}
      {activeTab === "projects" && (
        <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm p-2">
          {projects.length === 0 ? (
            // ✅ ADD THIS: Empty state
            <div className="p-3 text-center text-sm text-gray-500">
              No projects available
            </div>
          ) : selectedProject ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors">
                  <div className="flex items-center gap-2">
                    {/* Use helper function instead of hardcoded letter */}
                    {renderProjectIcon(selectedProject)}
                    <span className="text-[13px] font-medium text-gray-900 dark:text-white">
                      {selectedProject.name}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleProjectChange(project)}
                    className="flex items-center gap-2 cursor-pointer text-[13px]"
                  >
                    {/* Use helper function for each project in dropdown */}
                    {renderProjectIcon(project)}
                    <span>{project.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      )}


      {/* Menu Items */}
      <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm">
        {menuItems.map((item, index) => (
          <React.Fragment key={item.id}>
            <button
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 font-inter text-[13px] font-normal leading-4 transition-all relative bg-white dark:bg-gray-800 tracking-[0px]",
                activeSection === item.id
                  ? "text-[#001F3F] dark:text-white font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              {activeSection === item.id && (
                <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-[#001F3F]" />
              )}
              <span className={cn(activeSection === item.id ? "ml-1.5" : "")}>
                {item.text}
              </span>
            </button>
            {index < menuItems.length - 1 && (
              <div className="border-b border-gray-200 dark:border-gray-700" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-950 font-inter overflow-hidden">
      {/* FIXED HEADER */}
      <div className="bg-white dark:bg-gray-950 border-b flex-shrink-0">
        <div className="px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Left Title */}
            <div className="font-inter text-[20px] font-semibold leading-tight text-gray-900 dark:text-white tracking-[0px]">
              {title}
              {subtitle && (
                <div className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 font-normal">
                  {subtitle}
                </div>
              )}
            </div>

            {/* Right Tabs */}
            <div className="flex items-center justify-end rounded-xl overflow-hidden bg-[#E5E5EA] p-1 mr-2">
              <button
                onClick={() => onTabChange("workspace")}
                className={cn(
                  "px-5 py-1.5 font-inter text-[13px] font-medium leading-5 transition-all whitespace-nowrap tracking-[0px] rounded-lg",
                  activeTab === "workspace"
                    ? "text-white shadow-sm bg-[#001F3F]"
                    : "text-gray-500 dark:text-gray-600 hover:text-gray-700 bg-transparent"
                )}
              >
                Workspace
              </button>
              <button
                onClick={() => onTabChange("projects")}
                className={cn(
                  "px-5 py-1.5 font-inter text-[13px] font-medium leading-5 transition-all whitespace-nowrap tracking-[0px] rounded-lg",
                  activeTab === "projects"
                    ? "text-white shadow-sm bg-[#001F3F]"
                    : "text-gray-500 dark:text-gray-600 hover:text-gray-700 bg-transparent"
                )}
              >
                Projects
              </button>

              {/* Mobile Menu Button */}
              <Button
                variant="outline"
                size="icon"
                className="md:hidden ml-2"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE SIDEBAR */}
      {mobileOpen && (
        <div className="md:hidden px-4 py-4 border-b bg-gray-50 dark:bg-gray-900 flex-shrink-0 max-h-96 overflow-y-auto">
          <Sidebar />
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex w-full flex-1 overflow-hidden">
        <div className="h-full w-full px-6 py-4">
          <div className="flex gap-5 h-full w-full">
            {/* FIXED SIDEBAR - Desktop - SMALLER WIDTH */}
            <aside className="hidden md:block w-52 flex-shrink-0">
              <Sidebar />
            </aside>

            {/* SCROLLABLE CONTENT */}
            <main className="flex-1 w-full overflow-y-auto font-inter text-[14px] font-normal leading-6 tracking-[0px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandHubLayout;



// with pathing code

// "use client";

// import React, { ReactNode, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { Menu, X, ChevronDown } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { cn } from "@/lib/utils";

// interface MenuItem {
//   id: string;
//   text: string;
// }

// interface Project {
//   id: string;
//   name: string;
//   icon?: string;
//   color?: string;
// }

// interface CommandHubLayoutProps {
//   title: ReactNode;
//   arrowIcon?: ReactNode;
//   subtitle?: ReactNode;
//   menuItems: MenuItem[];
//   children: ReactNode;
//   activeTab: string;
//   onTabChange: (tab: string) => void;
//   projects?: Project[];
// }

// const CommandHubLayout = ({
//   title,
//   subtitle,
//   menuItems,
//   children,
//   activeTab,
//   onTabChange,
//   projects = [
//     { id: "1", name: "Project A", color: "#3b82f6" },
//     { id: "2", name: "Project B", color: "#8b5cf6" },
//     { id: "3", name: "Project C", color: "#10b981" },
//   ],
// }: CommandHubLayoutProps) => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const sectionParam = searchParams.get("commandhubSection");
// const tabParam = searchParams.get("commandhubTab");
// const activeSection = sectionParam || menuItems[0]?.id;
// const activeTabValue = tabParam || "workspace"; // or whatever your desired default

//   const [mobileOpen, setMobileOpen] = React.useState(false);
//   const [selectedProject, setSelectedProject] = useState<Project>(projects[1]);

// //   const activeSection = searchParams.get("commandhubSection") || menuItems[0]?.id;

//   const handleSectionChange = (sectionId: string) => {
//     const params = new URLSearchParams(searchParams.toString());
//     params.set("commandhubTab", activeTab);
//     params.set("commandhubSection", sectionId);
//     router.push(`?${params.toString()}`);
//     setMobileOpen(false);
//   };

//   const handleProjectChange = (project: Project) => {
//     setSelectedProject(project);
//     const params = new URLSearchParams(searchParams.toString());
//     params.set("commandhubTab", activeTab);
//     params.set("commandhubSection", menuItems[0]?.id);
//     params.set("projectId", project.id);
//     router.push(`?${params.toString()}`);
//   };

//   const Sidebar = () => (
//     <div className="space-y-2">
//       {/* Project Selector - Only show when Projects tab is active */}
//       {activeTab === "projects" && (
//         <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm p-2">
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <button className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors">
//                 <div className="flex items-center gap-2">
//                   <div
//                     className="w-6 h-6 rounded-md flex items-center justify-center text-white font-semibold text-xs"
//                     style={{ backgroundColor: selectedProject.color }}
//                   >
//                     {selectedProject.name.charAt(selectedProject.name.length - 1)}
//                   </div>
//                   <span className="text-[13px] font-medium text-gray-900 dark:text-white">
//                     {selectedProject.name}
//                   </span>
//                 </div>
//                 <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
//               </button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="start" className="w-48">
//               {projects.map((project) => (
//                 <DropdownMenuItem
//                   key={project.id}
//                   onClick={() => handleProjectChange(project)}
//                   className="flex items-center gap-2 cursor-pointer text-[13px]"
//                 >
//                   <div
//                     className="w-5 h-5 rounded-md flex items-center justify-center text-white font-semibold text-xs"
//                     style={{ backgroundColor: project.color }}
//                   >
//                     {project.name.charAt(project.name.length - 1)}
//                   </div>
//                   <span>{project.name}</span>
//                 </DropdownMenuItem>
//               ))}
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       )}

//       {/* Menu Items */}
//       <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm">
//         {menuItems.map((item, index) => (
//           <React.Fragment key={item.id}>
//             <button
//               onClick={() => handleSectionChange(item.id)}
//               className={cn(
//                 "w-full text-left px-3 py-2.5 font-inter text-[13px] font-normal leading-4 transition-all relative bg-white dark:bg-gray-800 tracking-[0px]",
//                 activeSection === item.id
//                   ? "text-[#001F3F] dark:text-white font-medium"
//                   : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
//               )}
//             >
//               {activeSection === item.id && (
//                 <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-[#001F3F]" />
//               )}
//               <span className={cn(activeSection === item.id ? "ml-1.5" : "")}>
//                 {item.text}
//               </span>
//             </button>
//             {index < menuItems.length - 1 && (
//               <div className="border-b border-gray-200 dark:border-gray-700" />
//             )}
//           </React.Fragment>
//         ))}
//       </div>
//     </div>
//   );

//   return (
//     <div className="flex flex-col h-full w-full bg-white dark:bg-gray-950 font-inter overflow-hidden">
//       {/* FIXED HEADER */}
//       <div className="bg-white dark:bg-gray-950 border-b flex-shrink-0">
//         <div className="px-8 py-3">
//           <div className="flex items-center justify-between">
//             {/* Left Title */}
//             <div className="font-inter text-[20px] font-semibold leading-tight text-gray-900 dark:text-white tracking-[0px]">
//               {title}
//               {subtitle && (
//                 <div className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 font-normal">
//                   {subtitle}
//                 </div>
//               )}
//             </div>

//             {/* Right Tabs */}
//             <div className="flex items-center justify-end rounded-xl overflow-hidden bg-[#E5E5EA] p-1">
//               <button
//                 onClick={() => onTabChange("workspace")}
//                 className={cn(
//                   "px-5 py-1.5 font-inter text-[13px] font-medium leading-5 transition-all whitespace-nowrap tracking-[0px] rounded-lg",
//                   activeTab === "workspace"
//                     ? "text-white shadow-sm bg-[#001F3F]"
//                     : "text-gray-500 dark:text-gray-600 hover:text-gray-700 bg-transparent"
//                 )}
//               >
//                 Workspace
//               </button>
//               <button
//                 onClick={() => onTabChange("projects")}
//                 className={cn(
//                   "px-5 py-1.5 font-inter text-[13px] font-medium leading-5 transition-all whitespace-nowrap tracking-[0px] rounded-lg",
//                   activeTab === "projects"
//                     ? "text-white shadow-sm bg-[#001F3F]"
//                     : "text-gray-500 dark:text-gray-600 hover:text-gray-700 bg-transparent"
//                 )}
//               >
//                 Projects
//               </button>

//               {/* Mobile Menu Button */}
//               <Button
//                 variant="outline"
//                 size="icon"
//                 className="md:hidden ml-2"
//                 onClick={() => setMobileOpen(!mobileOpen)}
//               >
//                 {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* MOBILE SIDEBAR */}
//       {mobileOpen && (
//         <div className="md:hidden px-4 py-4 border-b bg-gray-50 dark:bg-gray-900 flex-shrink-0 max-h-96 overflow-y-auto">
//           <Sidebar />
//         </div>
//       )}

//       {/* MAIN CONTENT AREA */}
//       <div className="flex w-full flex-1 overflow-hidden">
//         <div className="h-full w-full px-6 py-4">
//           <div className="flex gap-5 h-full w-full">
//             {/* FIXED SIDEBAR - Desktop - SMALLER WIDTH */}
//             <aside className="hidden md:block w-52 flex-shrink-0">
//               <Sidebar />
//             </aside>

//             {/* SCROLLABLE CONTENT */}
//             <main className="flex-1 w-full overflow-y-auto font-inter text-[14px] font-normal leading-6 tracking-[0px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
//               {children}
//             </main>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CommandHubLayout;
