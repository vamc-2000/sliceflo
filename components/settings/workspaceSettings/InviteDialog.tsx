// "use client";

// import React, { useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Badge } from "@/components/ui/badge";
// import { Copy, X, Loader2 } from "lucide-react";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import toast from "react-hot-toast";
// import { useWorkspaceStore } from "@/stores/workspace-store";

// interface InviteDialogProps {
//   open: boolean;
//   heading: string;
//   sharableLink: string;
//   onClose: () => void;
//   hideRole?: boolean;
//   allowMultipleEmails?: boolean;
//   onSendInvite: (email: string | string[] | undefined, role?: string | undefined) => Promise<void>;
// }

// const InviteDialog: React.FC<InviteDialogProps> = ({
//   open,
//   heading,
//   sharableLink,
//   onClose,
//   hideRole = false,
//   allowMultipleEmails = false,
//   onSendInvite,
// }) => {
//   const [inviteEmail, setInviteEmail] = useState("");
//   const [emailList, setEmailList] = useState<string[]>([]);
//   const [inviteRole, setInviteRole] = useState("member");
//   const [inviteLoading, setInviteLoading] = useState(false);
//   const [rows, setRows] = useState<{ email: string; role: string }[]>([
//       { email: "", role: "" }
//     ]);

//   const {addMembersToWorkspace } = useWorkspaceStore();

//   const isValidEmail = (email: string) => {
//     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
//   };

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter" || e.key === "," || e.key === ";") {
//       e.preventDefault();
//       const email = inviteEmail.trim();
//       if (email && !emailList.includes(email)) {
//         setEmailList([...emailList, email]);
//         setInviteEmail("");
//       }
//     }
//   };

//   const handleRemoveEmail = (emailToRemove: string) => {
//     setEmailList(emailList.filter((email) => email !== emailToRemove));
//   };

//   const handleSendInvite = async () => {
//     if (allowMultipleEmails && emailList.length === 0) return;
//     if (!allowMultipleEmails && !inviteEmail.trim()) return;

//     setInviteLoading(true);
//     try {
//       if (allowMultipleEmails) {
//         await onSendInvite(emailList, inviteRole);
//         setEmailList([]);
//       } else {
//         await onSendInvite(inviteEmail, inviteRole);
//         setInviteEmail("");
//       }
//     } finally {
//       setInviteLoading(false);
//     }
//   };

//   const copyReportUrlToClipboard = () => {
//     navigator.clipboard
//       .writeText(sharableLink)
//       .then(() => toast.success("Shareable link copied to clipboard!"))
//       .catch((err) => {
//         console.error("Clipboard copy failed:", err);
//         toast.error("Failed to copy shareable link. Please try again.");
//       });
//   };

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[650px] border-b-[5px] border-b-[var(--primary)] p-0">
//         {/* Header */}
//         <DialogHeader className="px-10 pt-6 pb-0">
//           <div className="flex items-center justify-between">
//             <DialogTitle className="text-lg font-semibold text-[var(--primary)]">
//               {heading}
//             </DialogTitle>
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={onClose}
//               className="h-8 w-8 p-0"
//             >
//               {/* <X className="h-5 w-5" /> */}
//             </Button>
//           </div>
//         </DialogHeader>

//         <div className="px-10 py-4 space-y-6">
//           {/* Shareable Link Section */}
//           <div className="space-y-2">
//             <Label className="text-base font-medium text-[var(--primary)]">
//               Invite with Shareable link
//             </Label>
//             <div className="flex items-center gap-2 bg-gray-100 border border-[#8E8E93] rounded-lg p-3">
//               <span className="flex-1 text-sm text-[#8E8E93] truncate">
//                 {sharableLink}
//               </span>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={copyReportUrlToClipboard}
//                 className="h-8 w-8 p-0 shrink-0"
//               >
//                 <Copy className="h-4 w-4 text-[#8E8E93]" />
//               </Button>
//             </div>
//           </div>

//           {/* Email Section */}
//           <div className="space-y-3 mt-2">
//               <span className="text-[#8E8E93] font-medium">Invite with email</span>

//               {rows.map((row, index) => (
//                 <div key={index} className="w-full space-y-1">

//                   {/* Input Row */}
//                   <div className="flex items-center gap-2 w-full">
//                     <div
//                       className={`flex items-center flex-1 p-1 rounded-md bg-card border ${row.email && !isValidEmail(row.email)
//                         ? "border-red-500"
//                         : "border-[#8E8E93]"
//                         }`}
//                     >
//                       <Input
//                         placeholder="Enter email address"
//                         value={row.email}
//                         onChange={(e) => {
//                           const updated = [...rows];
//                           updated[index].email = e.target.value;
//                           setRows(updated);
//                         }}
//                         className={`border-0 shadow-none focus-visible:ring-0 flex-1 ${row.email && !isValidEmail(row.email)
//                           ? "text-red-600 placeholder:text-red-400"
//                           : ""
//                           }`}
//                       />

//                       <Select
//                         value={row.role || ""}
//                         onValueChange={(v) => {
//                           const updated = [...rows];
//                           updated[index].role = v;
//                           setRows(updated);
//                         }}
//                       >
//                         <SelectTrigger className="w-[120px] border-0 rounded-md bg-[#E5E5EA]">
//                           <SelectValue placeholder="Select" />
//                         </SelectTrigger>

//                         <SelectContent>
//                           <SelectItem value="admin">Admin</SelectItem>
//                           <SelectItem value="member">Member</SelectItem>
//                           <SelectItem value="viewer">Viewer</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {rows.length > 1 && (
//                       <button
//                         onClick={() => setRows(rows.filter((_, i) => i !== index))}
//                         className="p-1 hover:bg-gray-200 rounded"
//                       >
//                         <X size={18} className="text-gray-600" />
//                       </button>
//                     )}
//                   </div>

//                   {/* Error Message (Below Input, Above Add More) */}
//                   {row.email && !isValidEmail(row.email) && (
//                     <p className="text-xs text-red-500 ml-2">
//                       Invalid email address
//                     </p>
//                   )}
//                 </div>
//               ))}

//               {/* Add More */}
//               <div className="flex justify-end">
//                 <div
//                   className="text-sm text-[var(--primary)] cursor-pointer hover:underline"
//                   onClick={() => setRows([...rows, { email: "", role: "" }])}
//                 >
//                   + Add more
//                 </div>
//               </div>
//             </div>
//         </div>

//         {/* Footer */}
//         <DialogFooter className="px-10 pb-6">
//           <Button
//             onClick={handleSendInvite}
//             disabled={inviteLoading}
//             className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 w-[150px] h-[50px]"
//           >
//             {inviteLoading ? (
//               <Loader2 className="h-5 w-5 animate-spin" />
//             ) : (
//               "Send Invite"
//             )}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default InviteDialog;


"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Copy, X, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface InviteDialogProps {
  open: boolean;
  heading: string;
  sharableLink: string;
  onClose: () => void;
  hideRole?: boolean;
  allowMultipleEmails?: boolean;
  onSendInvite: (email: string | string[] | undefined, role?: string | undefined) => Promise<void>;
}

const InviteDialog: React.FC<InviteDialogProps> = ({
  open,
  heading,
  sharableLink,
  onClose,
  hideRole = false,
  allowMultipleEmails = false,
  onSendInvite,
}) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [emailList, setEmailList] = useState<string[]>([]);
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);

  const {addMembersToWorkspace } = useWorkspaceStore();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      const email = inviteEmail.trim();
      if (email && !emailList.includes(email)) {
        setEmailList([...emailList, email]);
        setInviteEmail("");
      }
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmailList(emailList.filter((email) => email !== emailToRemove));
  };

  const handleSendInvite = async () => {
    if (allowMultipleEmails && emailList.length === 0) return;
    if (!allowMultipleEmails && !inviteEmail.trim()) return;

    setInviteLoading(true);
    try {
      if (allowMultipleEmails) {
        await onSendInvite(emailList, inviteRole);
        setEmailList([]);
      } else {
        await onSendInvite(inviteEmail, inviteRole);
        setInviteEmail("");
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const copyReportUrlToClipboard = () => {
    navigator.clipboard
      .writeText(sharableLink)
      .then(() => toast("success", { title: "Success", description: "Shareable link copied to clipboard!" }))
      .catch((err) => {
        console.error("Clipboard copy failed:", err);
        toast("error", { title: "Error", description: "Failed to copy shareable link. Please try again." });
      });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] border-b-[5px] border-b-[var(--primary)] p-0">
        {/* Header */}
        <DialogHeader className="px-10 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-[var(--primary)]">
              {heading}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              {/* <X className="h-5 w-5" /> */}
            </Button>
          </div>
        </DialogHeader>

        <div className="px-10 py-4 space-y-6">
          {/* Shareable Link Section */}
          <div className="space-y-2">
            <Label className="text-base font-medium text-[var(--primary)]">
              Invite with Shareable link
            </Label>
            <div className="flex items-center gap-2 bg-gray-100 border border-[#8E8E93] rounded-lg p-3">
              <span className="flex-1 text-sm text-[#8E8E93] truncate">
                {sharableLink}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyReportUrlToClipboard}
                className="h-8 w-8 p-0 shrink-0"
              >
                <Copy className="h-4 w-4 text-[#8E8E93]" />
              </Button>
            </div>
          </div>

          {/* Email Section */}
          <div className="space-y-2">
            <Label className="text-base font-medium text-[var(--primary)]">
              Invite with email
            </Label>
            <div className="border border-[#8E8E93] rounded-lg p-3 space-y-2">
              {/* Email Chips */}
              {allowMultipleEmails && emailList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {emailList.map((email) => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      {email}
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="ml-2 hover:text-[var(--primary)]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Email Input */}
              <Input
                placeholder={
                  allowMultipleEmails
                    ? "Enter email and press Enter, comma, or semicolon"
                    : "Enter email address"
                }
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={allowMultipleEmails ? handleKeyDown : undefined}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-[#8E8E93]"
              />
            </div>
          </div>

          {/* Role Selection */}
          {!hideRole && (
            <div className="space-y-3">
              <RadioGroup
                value={inviteRole}
                onValueChange={setInviteRole}
                className="flex gap-12"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="member"
                    id="member"
                    className="border-[#B0BAC3] text-[var(--primary)]"
                  />
                  <Label
                    htmlFor="member"
                    className="text-sm text-[var(--primary)] font-normal cursor-pointer"
                  >
                    Member
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="viewer"
                    id="viewer"
                    className="border-[#B0BAC3] text-[var(--primary)]"
                  />
                  <Label
                    htmlFor="viewer"
                    className="text-sm text-[var(--primary)] font-normal cursor-pointer"
                  >
                    Viewer (Read-only)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Helper Text */}
          <p className="text-xs text-[#8E8E93] leading-tight">
            {allowMultipleEmails
              ? "Press Enter, comma, or semicolon to add an email"
              : "A separate email invitation will be sent to the email address."}
          </p>
        </div>

        {/* Footer */}
        <DialogFooter className="px-10 pb-6">
          <Button
            onClick={handleSendInvite}
            disabled={inviteLoading}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 w-[150px] h-[50px]"
          >
            {inviteLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Send Invite"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteDialog;
