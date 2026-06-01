// "use client";

// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { 
//   Settings, Star, Share2, MoreHorizontal, X,
//   Maximize2, MessageSquare, Users, Pencil
// } from "lucide-react";

// interface WhiteboardHeaderProps {
//   user: any;
//   title: string;
//   icon: string;
//   isEditingTitle: boolean;
//   tempTitle: string;
//   onTitleEdit: () => void;
//   onTitleChange: (value: string) => void;
//   onTitleBlur: () => void;
//   onTitleKeyDown: (e: React.KeyboardEvent) => void;
//   onClose: () => void;
// }

// export function WhiteboardHeader({
//   user, title, icon, isEditingTitle, tempTitle,
//   onTitleEdit, onTitleChange, onTitleBlur, onTitleKeyDown, onClose
// }: WhiteboardHeaderProps) {
//   return (
//     <div className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between z-10">
//       <div className="flex items-center gap-4">
//         <Avatar className="h-9 w-9 ring-2 ring-gray-100">
//           <AvatarImage src={user?.profilePictureUrl || ""} />
//           <AvatarFallback className="bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] text-white text-sm font-semibold">
//             {user?.name?.charAt(0)?.toUpperCase() || "W"}
//           </AvatarFallback>
//         </Avatar>

//         <div className="flex items-center gap-2">
//           {isEditingTitle ? (
//             <input
//               type="text"
//               value={tempTitle}
//               onChange={(e) => onTitleChange(e.target.value)}
//               onBlur={onTitleBlur}
//               onKeyDown={onTitleKeyDown}
//               className="text-base font-semibold text-gray-900 border-b-2 border-[#001F3F] outline-none focus:ring-0 bg-transparent px-1 py-0.5"
//               autoFocus
//             />
//           ) : (
//             <div 
//               className="flex items-center gap-2 group cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition-colors"
//               onClick={onTitleEdit}
//             >
//               <span className="text-base font-semibold text-gray-900">{title}</span>
//               <span className="text-lg">{icon}</span>
//               <Pencil className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="flex items-center gap-3">
//         <div className="flex -space-x-2 mr-2">
//           <Avatar className="h-8 w-8 ring-2 ring-white hover:z-10 transition-transform hover:scale-110">
//             <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-500 text-white text-xs font-medium">U1</AvatarFallback>
//           </Avatar>
//           <Avatar className="h-8 w-8 ring-2 ring-white hover:z-10 transition-transform hover:scale-110">
//             <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-500 text-white text-xs font-medium">U2</AvatarFallback>
//           </Avatar>
//           <Avatar className="h-8 w-8 ring-2 ring-white hover:z-10 transition-transform hover:scale-110">
//             <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-500 text-white text-xs font-medium">U3</AvatarFallback>
//           </Avatar>
//           <Button variant="outline" size="icon" className="h-8 w-8 rounded-full ring-2 ring-white hover:ring-gray-200">
//             <Users className="h-3.5 w-3.5" />
//           </Button>
//         </div>

//         <div className="h-6 w-px bg-gray-200" />

//         <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-gray-100" title="Comments">
//           <MessageSquare className="h-4 w-4 text-gray-600" />
//         </Button>
//         <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-gray-100" title="Share">
//           <Share2 className="h-4 w-4 text-gray-600" />
//         </Button>
//         <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-gray-100" title="Favorite">
//           <Star className="h-4 w-4 text-gray-600" />
//         </Button>

//         <div className="h-6 w-px bg-gray-200" />

//         <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-gray-100" title="Fullscreen">
//           <Maximize2 className="h-4 w-4 text-gray-600" />
//         </Button>
//         <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-gray-100" title="Settings">
//           <Settings className="h-4 w-4 text-gray-600" />
//         </Button>
//         <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-gray-100" title="More">
//           <MoreHorizontal className="h-4 w-4 text-gray-600" />
//         </Button>

//         <div className="h-6 w-px bg-gray-200" />

//         <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-red-50 hover:text-red-600" onClick={onClose} title="Close">
//           <X className="h-4 w-4" />
//         </Button>
//       </div>
//     </div>
//   );
// }
