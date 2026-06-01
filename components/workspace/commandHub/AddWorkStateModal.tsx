// "use client";

// import React, { useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { X } from "lucide-react";

// interface AddWorkStateModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (data: { name: string; color: string }) => void;
//   groupName?: string;
//   editingState?: { name: string; color: string } | null;
// }

// const COLOR_OPTIONS = [
//   "#EF4444", // Red
//   "#F97316", // Orange
//   "#10B981", // Green
//   "#FBBF24", // Yellow
//   "#06B6D4", // Cyan
//   "#3B82F6", // Blue
//   "#8B5CF6", // Purple
//   "#EC4899", // Pink
//   "#A855F7", // Violet
//   "#92400E", // Brown
// ];

// const AddWorkStateModal: React.FC<AddWorkStateModalProps> = ({
//   isOpen,
//   onClose,
//   onSave,
//   groupName,
//   editingState,
// }) => {
//   const [stateName, setStateName] = useState(editingState?.name || "");
//   const [selectedColor, setSelectedColor] = useState(
//     editingState?.color || COLOR_OPTIONS[0]
//   );

//   const handleSave = () => {
//     if (stateName.trim()) {
//       onSave({
//         name: stateName.trim(),
//         color: selectedColor,
//       });
//       handleClose();
//     }
//   };

//   const handleClose = () => {
//     setStateName("");
//     setSelectedColor(COLOR_OPTIONS[0]);
//     onClose();
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={handleClose}>
//       <DialogContent className="sm:max-w-[500px] p-0">
//         <DialogHeader className="px-6 pt-6 pb-4">
//           <div className="flex items-center justify-between">
//             <DialogTitle className="text-[18px] font-semibold">
//               {editingState ? "Edit State" : "Add State"}
//             </DialogTitle>
//             <button
//               onClick={handleClose}
//               className="hover:bg-gray-100 rounded-md p-1 transition-colors"
//             >
//               <X className="w-5 h-5 text-gray-500" />
//             </button>
//           </div>
//         </DialogHeader>

//         <div className="px-6 py-4 space-y-5">
//           {/* State Name */}
//           <div className="space-y-2">
//             <Label htmlFor="state-name" className="text-[14px] font-medium">
//               State Name
//             </Label>
//             <Input
//               id="state-name"
//               value={stateName}
//               onChange={(e) => setStateName(e.target.value)}
//               placeholder="e.g. Backlog"
//               className="text-[14px] h-10"
//               autoFocus
//             />
//           </div>

//           {/* Color Selection */}
//           <div className="space-y-2">
//             <Label className="text-[14px] font-medium">Color</Label>
//             <div className="flex gap-2 flex-wrap">
//               {/* No color option */}
//               <button
//                 onClick={() => setSelectedColor("#000000")}
//                 className={`w-10 h-10 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform ${
//                   selectedColor === "#000000"
//                     ? "border-gray-900 ring-2 ring-offset-2 ring-gray-300"
//                     : "border-gray-300"
//                 }`}
//                 style={{ backgroundColor: "#FFFFFF" }}
//               >
//                 <div className="w-5 h-0.5 bg-gray-400 rotate-45 absolute"></div>
//               </button>

//               {/* Color options */}
//               {COLOR_OPTIONS.map((color) => (
//                 <button
//                   key={color}
//                   onClick={() => setSelectedColor(color)}
//                   className={`w-10 h-10 rounded-full border-2 hover:scale-110 transition-transform ${
//                     selectedColor === color
//                       ? "border-gray-900 ring-2 ring-offset-2 ring-gray-300"
//                       : "border-transparent"
//                   }`}
//                   style={{ backgroundColor: color }}
//                 />
//               ))}
//             </div>
//           </div>
//         </div>

//         <DialogFooter className="px-6 py-4 border-t bg-gray-50">
//           <Button
//             variant="outline"
//             onClick={handleClose}
//             className="text-[13px] h-9"
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleSave}
//             disabled={!stateName.trim()}
//             className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-[13px] h-9"
//           >
//             {editingState ? "Update" : "Add state"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default AddWorkStateModal;



// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { X } from "lucide-react";

// interface AddWorkStateModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (data: { name: string; color: string }) => void;
//   groupName?: string;
//   editingState?: { name: string; color: string } | null;
// }

// const COLOR_OPTIONS = [
//   "#EF4444", // Red
//   "#F97316", // Orange
//   "#10B981", // Green
//   "#FBBF24", // Yellow
//   "#06B6D4", // Cyan
//   "#3B82F6", // Blue
//   "#8B5CF6", // Purple
//   "#EC4899", // Pink
//   "#A855F7", // Violet
//   "#92400E", // Brown
// ];

// const AddWorkStateModal: React.FC<AddWorkStateModalProps> = ({
//   isOpen,
//   onClose,
//   onSave,
//   groupName,
//   editingState,
// }) => {
//   const [stateName, setStateName] = useState("");
//   const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

//   // ============= ADD THIS useEffect ============= 
//   // This updates the state when modal opens with editing data
//   useEffect(() => {
//     if (isOpen && editingState) {
//       setStateName(editingState.name);
//       setSelectedColor(editingState.color);
//     } else if (isOpen && !editingState) {
//       // Reset for new state
//       setStateName("");
//       setSelectedColor(COLOR_OPTIONS[0]);
//     }
//   }, [isOpen, editingState]);
//   // ============= useEffect ENDS HERE =============

//   const handleSave = () => {
//     if (stateName.trim()) {
//       onSave({
//         name: stateName.trim(),
//         color: selectedColor,
//       });
//       handleClose();
//     }
//   };

//   const handleClose = () => {
//     setStateName("");
//     setSelectedColor(COLOR_OPTIONS[0]);
//     onClose();
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={handleClose}>
//       <DialogContent className="sm:max-w-[500px] p-0">
//         <DialogHeader className="px-6 pt-6 pb-4">
//           <div className="flex items-center justify-between">
//             <DialogTitle className="text-[18px] font-semibold">
//               {editingState ? "Edit State" : "Add State"}
//             </DialogTitle>
//             <button
//               onClick={handleClose}
//               className="hover:bg-gray-100 rounded-md p-1 transition-colors"
//             >
//               <X className="w-5 h-5 text-gray-500" />
//             </button>
//           </div>
//         </DialogHeader>

//         <div className="px-6 py-4 space-y-5">
//           {/* ============= ADD PREVIEW SECTION HERE ============= */}
//           <div className="space-y-2">
//             <Label className="text-[14px] font-medium">Preview</Label>
//             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200">
//               <div
//                 className="w-2.5 h-2.5 rounded-full flex-shrink-0"
//                 style={{ backgroundColor: selectedColor }}
//               />
//               <span className="text-[13px] font-medium text-gray-900">
//                 {stateName || 'State Name'}
//               </span>
//             </div>
//           </div>
//           {/* ============= PREVIEW SECTION ENDS HERE ============= */}

//           {/* State Name */}
//           <div className="space-y-2">
//             <Label htmlFor="state-name" className="text-[14px] font-medium">
//               State Name
//             </Label>
//             <Input
//               id="state-name"
//               value={stateName}
//               onChange={(e) => setStateName(e.target.value)}
//               placeholder="e.g. Backlog"
//               className="text-[14px] h-10"
//               autoFocus
//             />
//           </div>

//           {/* Color Selection */}
//           <div className="space-y-2">
//             <Label className="text-[14px] font-medium">Color</Label>
//             <div className="flex gap-2 flex-wrap">
//               {/* No color option */}
//               <button
//                 onClick={() => setSelectedColor("#000000")}
//                 className={`w-10 h-10 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform ${
//                   selectedColor === "#000000"
//                     ? "border-gray-900 ring-2 ring-offset-2 ring-gray-300"
//                     : "border-gray-300"
//                 }`}
//                 style={{ backgroundColor: "#FFFFFF" }}
//               >
//                 <div className="w-5 h-0.5 bg-gray-400 rotate-45 absolute"></div>
//               </button>

//               {/* Color options */}
//               {COLOR_OPTIONS.map((color) => (
//                 <button
//                   key={color}
//                   onClick={() => setSelectedColor(color)}
//                   className={`w-10 h-10 rounded-full border-2 hover:scale-110 transition-transform ${
//                     selectedColor === color
//                       ? "border-gray-900 ring-2 ring-offset-2 ring-gray-300"
//                       : "border-transparent"
//                   }`}
//                   style={{ backgroundColor: color }}
//                 />
//               ))}
//             </div>
//           </div>
//         </div>

//         <DialogFooter className="px-6 py-4 border-t bg-gray-50">
//           <Button
//             variant="outline"
//             onClick={handleClose}
//             className="text-[13px] h-9"
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleSave}
//             disabled={!stateName.trim()}
//             className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-[13px] h-9"
//           >
//             {editingState ? "Update" : "Add state"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default AddWorkStateModal;



"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface AddWorkStateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: string }) => void;
  groupName?: string;
  editingState?: { name: string; color: string } | null;
}

const COLOR_OPTIONS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#10B981", // Green
  "#FBBF24", // Yellow
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#A855F7", // Violet
  "#92400E", // Brown
];

const AddWorkStateModal: React.FC<AddWorkStateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  groupName,
  editingState,
}) => {
  const [stateName, setStateName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

  useEffect(() => {
    if (isOpen && editingState) {
      setStateName(editingState.name);
      setSelectedColor(editingState.color);
    } else if (isOpen && !editingState) {
      setStateName("");
      setSelectedColor(COLOR_OPTIONS[0]);
    }
  }, [isOpen, editingState]);

  const handleSave = () => {
    if (stateName.trim()) {
      onSave({
        name: stateName.trim(),
        color: selectedColor,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setStateName("");
    setSelectedColor(COLOR_OPTIONS[0]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 border-b-5 border-b-[#001F3F]"
        aria-describedby={undefined}
      >
        {/* UPDATED: Changed from px-6 pt-6 pb-4 to px-3 pt-3 pb-2 */}
        <DialogHeader className="px-3 pt-3 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[18px] font-semibold">
              {editingState ? "Edit State" : "Add State"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* UPDATED: Changed from px-6 py-4 space-y-5 to px-3 py-2 space-y-2.5 */}
        <div className="p-4 space-y-2.5">
          {/* State Name */}
          {/* UPDATED: Changed from space-y-2 to space-y-1 */}
          <div className="space-y-2">
            <Label htmlFor="state-name" className="text-[14px] font-medium">
              State Name
            </Label>
            <Input
              id="state-name"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              placeholder="e.g. Backlog"
              className="text-[14px] h-10"
              autoFocus
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label className="text-[14px] font-medium">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {/* No color option */}
              {/* UPDATED: Changed from w-10 h-10 to w-7 h-7 */}
              <button
                onClick={() => setSelectedColor("#000000")}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center hover:scale-110 transition-transform ${selectedColor === "#000000"
                    ? "border-gray-900 ring-2 ring-offset-2 ring-gray-300"
                    : "border-gray-300"
                  }`}
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <div className="w-5 h-0.5 bg-gray-400 rotate-45 absolute"></div>
              </button>

              {/* Color options */}
              {/* UPDATED: Changed from w-10 h-10 to w-7 h-7 */}
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform ${selectedColor === color
                      ? "border-gray-900 ring-2 ring-offset-2 ring-gray-300"
                      : "border-transparent"
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="text-[13px] h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!stateName.trim()}
            className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-[13px] h-9"
          >
            {editingState ? "Update" : "Add state"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddWorkStateModal;
