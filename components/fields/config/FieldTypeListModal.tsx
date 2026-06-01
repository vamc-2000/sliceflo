
// "use client";

// import React, { useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import {
//   ChevronLeft,
//   CheckCircle, ListChecks, Text, Type, Calendar, Hash, Globe2, Users, Mail, Phone, SquareCheck
// } from "lucide-react";

// const FIELD_OPTIONS = [
//   { id: "select-one", label: "Select One", icon: <CheckCircle className="w-5 h-5" />, group: "regular" },
//   { id: "select-many", label: "Select Many", icon: <ListChecks className="w-5 h-5" />, group: "regular" },
//   { id: "text", label: "Text", icon: <Text className="w-5 h-5" />, group: "regular" },
//   { id: "text-area", label: "Text area(Long text)", icon: <Type className="w-5 h-5" />, group: "regular" },
//   { id: "date", label: "Date", icon: <Calendar className="w-5 h-5" />, group: "regular" },
//   { id: "number", label: "Number", icon: <Hash className="w-5 h-5" />, group: "regular" },
//   { id: "website", label: "Website", icon: <Globe2 className="w-5 h-5" />, group: "regular" },
//   { id: "people", label: "People", icon: <Users className="w-5 h-5" />, group: "regular" },
//   { id: "email", label: "Email", icon: <Mail className="w-5 h-5" />, group: "regular" },
//   { id: "phone", label: "Phone", icon: <Phone className="w-5 h-5" />, group: "regular" },
//   { id: "checkbox", label: "Checkbox", icon: <SquareCheck className="w-5 h-5" />, group: "regular" }
// ];

// interface Props {
//   isOpen: boolean;
//   onClose: () => void;
//   onSelect: (type: string) => void;
// }

// const FieldTypeListModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
//   const [activeTab, setActiveTab] = useState<"regular" | "special">("regular");
//   const [search, setSearch] = useState("");

//   const filtered = FIELD_OPTIONS.filter(
//     opt => opt.group === activeTab &&
//       opt.label.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-[340px] p-0 gap-0 rounded-xl">
//         {/* Header */}
//         <DialogHeader className="px-5 pt-4 pb-3 space-y-0">
//           <div className="flex items-center gap-2 mb-4">
//             <button 
//               className="hover:bg-gray-100 rounded-md p-1 transition-colors -ml-1" 
//               onClick={onClose} 
//               aria-label="Back"
//             >
//               <ChevronLeft className="w-5 h-5 text-gray-700" />
//             </button>
//             <DialogTitle className="text-[16px] font-semibold text-gray-900">
//               Create field
//             </DialogTitle>
//           </div>

//           {/* Tabs - Left Aligned with Underline */}
//           <div className="flex gap-6 items-center border-b border-gray-200 -mx-5 px-5">
//             <button
//               onClick={() => setActiveTab("regular")}
//               className={`pb-2.5 text-[14px] font-medium transition-colors relative ${
//                 activeTab === "regular"
//                   ? "text-gray-900"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               Regular
//               {activeTab === "regular" && (
//                 <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
//               )}
//             </button>
//             <button
//               onClick={() => setActiveTab("special")}
//               className={`pb-2.5 text-[14px] font-medium transition-colors relative ${
//                 activeTab === "special"
//                   ? "text-gray-900"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               Special
//               {activeTab === "special" && (
//                 <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
//               )}
//             </button>
//           </div>
//         </DialogHeader>

//         {/* Content */}
//         <div className="px-5 pb-4">
//           {activeTab === "regular" ? (
//             <>
//               {/* Search Input */}
//               <Input
//                 value={search}
//                 onChange={e => setSearch(e.target.value)}
//                 placeholder="Search"
//                 className="mb-3 h-9 text-[13px] bg-gray-50 border-gray-200 focus-visible:ring-1 focus-visible:ring-gray-400"
//               />

//               {/* Field Options List */}
//               <div className="max-h-[420px] overflow-y-auto pr-1 space-y-1">
//                 {filtered.length === 0 && (
//                   <div className="text-gray-400 text-center py-6 text-[13px]">
//                     No field types found
//                   </div>
//                 )}
//                 {filtered.map(option => (
//                   <button
//                     key={option.id}
//                     onClick={() => onSelect(option.id)}
//                     className="flex items-center gap-3 px-3 py-2.5 text-[14px] w-full rounded-lg hover:bg-gray-100 transition-colors text-left"
//                   >
//                     <span className="text-gray-700 flex-shrink-0">
//                       {option.icon}
//                     </span>
//                     <span className="flex-1 text-gray-900 font-normal">
//                       {option.label}
//                     </span>
//                   </button>
//                 ))}
//               </div>
//             </>
//           ) : (
//             <div className="text-gray-400 text-center py-10 text-[13px]">
//               No special fields yet
//             </div>
//           )}
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default FieldTypeListModal;
