// "use client";

// import React, { useState } from "react";
// import { ChevronDown } from "lucide-react";
// import { useProjectsStore } from "@/stores/projects-store";
// import { SettingsCard } from "@/components/settings/SettingsCard";

// interface RepeatingWorkPageProps {
//   projectId: string;
// }

// const RepeatingWorkPage: React.FC<RepeatingWorkPageProps> = ({
//   projectId = "default-project",
// }) => {
//   const { repeatingWorkSections, getRepeatingWorkByProject } = useProjectsStore();
  
//   const sections = getRepeatingWorkByProject(projectId);

//   // Track which cards are expanded
//   const [activeCards, setActiveCards] = useState<Record<string, boolean>>({});

//   const handleToggleCard = (sectionId: string) => {
//     setActiveCards((prev) => ({
//       ...prev,
//       [sectionId]: !prev[sectionId],
//     }));
//   };

//   return (
//     <div className="w-full space-y-4">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
//             Repeating work
//           </h2>
//           <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
//             Subtext
//           </p>
//         </div>
//       </div>

//       {/* Repeating Work Sections */}
//       <div className="space-y-3">
//         {sections.map((section) => (
//           <SettingsCard
//             key={section.id}
//             id={section.id}
//             title={section.title}
//             subtitle={section.description}
//             isActive={activeCards[section.id] || false}
//             onToggle={() => handleToggleCard(section.id)}
//             showChevron={true}
//           >
//             {/* Expanded Content */}
//             <div className="space-y-3">
//               <p className="text-[13px] text-gray-600 dark:text-gray-400">
//                 Configure {section.title.toLowerCase()} to automate recurring work in your project.
//               </p>
              
//               <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
//                 <p className="text-[12px] text-blue-900 dark:text-blue-300">
//                   ℹ️ Set up schedules, frequencies, and automation rules here.
//                 </p>
//               </div>
//             </div>
//           </SettingsCard>
//         ))}
//       </div>

//       {/* Empty State */}
//       {sections.length === 0 && (
//         <div className="flex flex-col items-center justify-center py-10 text-center">
//           <p className="text-gray-500 dark:text-gray-400 text-[13px]">
//             No repeating work sections available.
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default RepeatingWorkPage;



"use client";

import React from "react";
import { FileText, RefreshCw, Calendar, ChevronDown } from "lucide-react";
import { useProjectsStore } from "@/stores/projects-store";

interface RepeatingWorkPageProps {
  projectId?: string;
}

const RepeatingWorkPage: React.FC<RepeatingWorkPageProps> = ({
  projectId = "default-project",
}) => {
  const { repeatingWorkSections, getRepeatingWorkByProject } = useProjectsStore();

  const sections = getRepeatingWorkByProject(projectId);

  const getIcon = (type: string) => {
    switch (type) {
      case 'recurring-tasks':
        return <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
      case 'recurring-milestones':
        return <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
            Repeating work
          </h2>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
            Subtext
          </p>
        </div>
      </div>

      {/* Repeating Work Sections List */}
      <div className="space-y-3">
        {sections.map((section) => (
          <div
            key={section.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow border-l-4 border-l-[#001F3F]"
          >
            <div className="flex items-start gap-3 flex-1">
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                {getIcon(section.type)}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h3>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {section.description}
                </p>
              </div>
            </div>

           <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500 ml-4" />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-[13px]">
            No repeating work sections available for this project.
          </p>
        </div>
      )}
    </div>
  );
};

export default RepeatingWorkPage;
