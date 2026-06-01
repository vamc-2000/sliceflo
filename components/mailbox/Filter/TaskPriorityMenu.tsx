// "use client";

// import { useState } from "react";
// import { Checkbox } from "@/components/ui/checkbox"; // ShadCN checkbox
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
// } from "@/components/ui/dropdown-menu"; // ShadCN dropdown
// import { useTaskStore, type SelectOneField } from "../../../../stores/taskStore";

// interface TaskPriorityMenuProps {
//   trigger: React.ReactNode; // replace anchorEl
// }

// export default function TaskPriorityMenu({ trigger }: TaskPriorityMenuProps) {
//   const { globalDynamicFields } = useTaskStore();
//   const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

//   // Get the priority field and type narrow it properly
//   const priorityField = globalDynamicFields.find(field => field.id === "priority");
  
//   const isSelectOneField = (field: any): field is SelectOneField => {
//     return field?.fieldType === "select-one";
//   };

//   const priorityOptions = (priorityField && isSelectOneField(priorityField) && priorityField.options) 
//     ? priorityField.options 
//     : [];

//   const handlePriorityToggle = (priorityId: string) => {
//     setSelectedPriorities(prev => 
//       prev.includes(priorityId)
//         ? prev.filter(id => id !== priorityId)
//         : [...prev, priorityId]
//     );
//   };

//   const handleClear = () => {
//     setSelectedPriorities([]);
//   };

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>
//       <DropdownMenuContent className="min-w-[200px] border-b-4 border-[#001F3F] ml-1 rounded-md">
//         {priorityOptions.map(option => (
//           <DropdownMenuItem
//             key={option.id}
//             className="flex items-center space-x-2"
//             onClick={() => handlePriorityToggle(option.id)}
//           >
//             <Checkbox
//               checked={selectedPriorities.includes(option.id)}
//               className="accent-[#001F3F]" // custom color for checkbox
//             />
//             <span className="text-[#001F3F]">{option.name}</span>
//           </DropdownMenuItem>
//         ))}

//         {selectedPriorities.length > 0 && (
//           <>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem onClick={handleClear}>
//               <span className="text-[#666] italic">Clear selection</span>
//             </DropdownMenuItem>
//           </>
//         )}
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// }
