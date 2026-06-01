"use client";

import React from "react";
import { FileText } from "lucide-react";
import { useProjectsStore } from "@/stores/projects-store";
import { Switch } from "@/components/ui/switch";

interface FeaturesPageProps {
  projectId: string;
}

const FeaturesPage: React.FC<FeaturesPageProps> = ({
  projectId = "default-project",
}) => {
  const { features, toggleFeature, getFeaturesByProject } = useProjectsStore();

  const projectFeatures = getFeaturesByProject(projectId);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
            Features
          </h2>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
            Subtext
          </p>
        </div>
      </div>

      {/* Features List */}
      <div className="space-y-3">
        {projectFeatures.map((feature) => (
          <div
            key={feature.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow border-l-4 border-l-[#001F3F]"
          >
            <div className="flex items-start gap-3 flex-1">
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                  {feature.name}
                </h3>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {feature.description}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <Switch
              checked={feature.isEnabled}
              onCheckedChange={() => toggleFeature(feature.id)}
              className="ml-4"
            />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {projectFeatures.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-[13px]">
            No features available for this project.
          </p>
        </div>
      )}
    </div>
  );
};

export default FeaturesPage;


// "use client";

// import React, { useState } from "react";
// import { FileText } from "lucide-react";
// import { useProjectsStore } from "@/stores/projects-store";
// import { Switch } from "@/components/ui/switch";
// import { SettingsCard } from "@/components/settings/SettingsCard";

// interface FeaturesPageProps {
//   projectId: string;
// }

// const FeaturesPage: React.FC<FeaturesPageProps> = ({
//   projectId = "default-project",
// }) => {
//   const { features, toggleFeature, getFeaturesByProject } = useProjectsStore();
//   const projectFeatures = getFeaturesByProject(projectId);

//   // Track which cards are expanded
//   const [activeCards, setActiveCards] = useState<Record<string, boolean>>({});

//   const handleToggleCard = (featureId: string) => {
//     setActiveCards((prev) => ({
//       ...prev,
//       [featureId]: !prev[featureId],
//     }));
//   };

//   return (
//     <div className="w-full space-y-4">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
//             Features
//           </h2>
//           <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
//             Enable or disable project features
//           </p>
//         </div>
//       </div>

//       {/* Features List */}
//       <div className="space-y-3">
//         {projectFeatures.map((feature) => (
//           <SettingsCard
//             key={feature.id}
//             id={feature.id}
//             title={feature.name}
//             subtitle={feature.description}
//             icon={<FileText className="w-8 h-8" />}
//             isActive={activeCards[feature.id] || false}
//             onToggle={() => handleToggleCard(feature.id)}
//             showChevron={true}
//             actionButton={
//               <Switch
//                 checked={feature.isEnabled}
//                 onCheckedChange={() => toggleFeature(feature.id)}
//               />
//             }
//           >
//             {/* Expanded Content */}
//             <div className="space-y-3">
//               <p className="text-[13px] text-gray-600 dark:text-gray-400">
//                 {feature.isEnabled
//                   ? `${feature.name} is currently enabled for this project.`
//                   : `${feature.name} is currently disabled. Enable it to use this feature.`}
//               </p>
              
//               {feature.isEnabled && (
//                 <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
//                   <p className="text-[12px] text-blue-900 dark:text-blue-300">
//                     ✓ This feature is active and ready to use.
//                   </p>
//                 </div>
//               )}
//             </div>
//           </SettingsCard>
//         ))}
//       </div>

//       {/* Empty State */}
//       {projectFeatures.length === 0 && (
//         <div className="flex flex-col items-center justify-center py-10 text-center">
//           <p className="text-gray-500 dark:text-gray-400 text-[13px]">
//             No features available for this project.
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FeaturesPage;
