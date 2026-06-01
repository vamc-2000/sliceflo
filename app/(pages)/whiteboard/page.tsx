// // // app/(pages)/whiteboard/page.tsx
// // "use client";
// // import { LandingPage } from "@/components/LandingPage";
// // import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
// // import { useRouter } from "next/navigation";

// // export default function WhiteboardPage() {
// //   const router = useRouter();

// //   return (
// //     <div className="flex flex-col h-screen">
// //       <div className="border-b flex-shrink-0">
// //         <Breadcrumbs />
// //       </div>
// //       <div className="flex-1 overflow-auto">
// //         <div className="p-6">
// //           <LandingPage
// //             title="Turn Ideas Into Action with Whiteboard"
// //             description="Collaborate, brainstorm, and visualize plans — all in one interactive, real-time workspace designed for your team's creative flow."
// //             extraText="Start your first Whiteboard session and bring your team's ideas to life. Whether you're planning a sprint, mapping a user journey, or hosting a virtual workshop — keep everyone aligned and inspired."
// //             imageSrc="/images/whiteboard-image.png"
// //             imageAlt="Whiteboard illustration"
// //             buttonText="Create Your First Whiteboard"
// //             onButtonClick={() => router.push("/whiteboard/create")}
// //           />
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }



// "use client";

// import { LandingPage } from "@/components/LandingPage";
// import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
// import { useRouter } from "next/navigation";
// import { useWhiteboardStore } from "@/stores/useWhiteboard-store";
// import { Button } from "@/components/ui/button";
// import { 
//   Plus, 
//   MoreVertical, 
//   Trash2, 
//   Edit, 
//   Star,
//   Clock
// } from "lucide-react";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { formatDistanceToNow } from "date-fns";

// export default function WhiteboardPage() {
//   const router = useRouter();
//   const { whiteboards, deleteWhiteboard } = useWhiteboardStore();

//   const handleDelete = (id: string, e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (confirm("Are you sure you want to delete this whiteboard?")) {
//       deleteWhiteboard(id);
//     }
//   };

//   // Show landing page when no whiteboards
//   if (whiteboards.length === 0) {
//     return (
//       <div className="flex flex-col h-screen">
//         <div className="border-b flex-shrink-0">
//           <Breadcrumbs />
//         </div>
//         <div className="flex-1 overflow-auto">
//           <div className="p-6">
//             <LandingPage
//               title="Turn Ideas Into Action with Whiteboard"
//               description="Collaborate, brainstorm, and visualize plans — all in one interactive, real-time workspace designed for your team's creative flow."
//               extraText="Start your first Whiteboard session and bring your team's ideas to life. Whether you're planning a sprint, mapping a user journey, or hosting a virtual workshop — keep everyone aligned and inspired."
//               imageSrc="/images/whiteboard-image.png"
//               imageAlt="Whiteboard illustration"
//               buttonText="Create Your First Whiteboard"
//               onButtonClick={() => router.push("/whiteboard/create")}
//             />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Show whiteboards grid
//   return (
//     <div className="flex flex-col h-screen">
//       <div className="border-b flex-shrink-0">
//         <Breadcrumbs />
//       </div>
      
//       <div className="flex-1 overflow-auto bg-white">
//         <div className="p-6">
//           {/* Header */}
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">Whiteboards</h1>
//               <p className="text-sm text-gray-600 mt-1">
//                 {whiteboards.length} {whiteboards.length === 1 ? "whiteboard" : "whiteboards"}
//               </p>
//             </div>
//             <Button 
//               onClick={() => router.push("/whiteboard/create")}
//               className="bg-[#001F3F] hover:bg-[#001F3F]/90"
//             >
//               <Plus className="h-4 w-4 mr-2" />
//               New Whiteboard
//             </Button>
//           </div>

//           {/* Whiteboards Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//             {whiteboards.map((whiteboard) => (
//               <div
//                 key={whiteboard.id}
//                 onClick={() => router.push(`/whiteboard/${whiteboard.id}`)}
//                 className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group relative"
//               >
//                 {/* Whiteboard Preview Area */}
//                 <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-md mb-3 flex items-center justify-center border border-gray-200">
//                   <span className="text-6xl">{whiteboard.icon}</span>
//                 </div>

//                 {/* Whiteboard Info */}
//                 <div className="flex items-start justify-between gap-2">
//                   <div className="flex-1 min-w-0">
//                     <h3 className="font-semibold text-gray-900 truncate group-hover:text-[#001F3F] transition-colors">
//                       {whiteboard.title}
//                     </h3>
//                     {whiteboard.lastModified && (
//                       <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
//                         <Clock className="h-3 w-3" />
//                         <span>
//                           {formatDistanceToNow(new Date(whiteboard.lastModified), { addSuffix: true })}
//                         </span>
//                       </div>
//                     )}
//                   </div>

//                   {/* Actions Dropdown */}
//                   <DropdownMenu>
//                     <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
//                       >
//                         <MoreVertical className="h-4 w-4" />
//                       </Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end">
//                       <DropdownMenuItem onClick={(e) => {
//                         e.stopPropagation();
//                         router.push(`/whiteboard/${whiteboard.id}`);
//                       }}>
//                         <Edit className="h-4 w-4 mr-2" />
//                         Open
//                       </DropdownMenuItem>
//                       <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
//                         <Star className="h-4 w-4 mr-2" />
//                         Add to Favorites
//                       </DropdownMenuItem>
//                       <DropdownMenuSeparator />
//                       <DropdownMenuItem 
//                         onClick={(e) => handleDelete(whiteboard.id, e)}
//                         className="text-red-600 focus:text-red-600"
//                       >
//                         <Trash2 className="h-4 w-4 mr-2" />
//                         Delete
//                       </DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";
import { LandingPage } from "@/components/LandingPage";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useRouter } from "next/navigation";

export default function WhiteboardPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b flex-shrink-0">
        <Breadcrumbs />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <LandingPage
            title="Turn Ideas Into Action with Whiteboard"
            description="Collaborate, brainstorm, and visualize plans — all in one interactive, real-time workspace designed for your team's creative flow."
            extraText="Start your first Whiteboard session and bring your team's ideas to life. Whether you're planning a sprint, mapping a user journey, or hosting a virtual workshop — keep everyone aligned and inspired."
            imageSrc="/images/whiteboard-image.png"
            imageAlt="Whiteboard illustration"
            buttonText="Create Your First Whiteboard"
            onButtonClick={() => router.push("/whiteboard/create")}
          />
        </div>
      </div>
    </div>
  );
}

