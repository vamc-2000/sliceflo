"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useTeamStore } from "@/stores/teams-store";

import { getAvatarColor } from "@/utils/avatar-utils";

interface InviteMember {
  id: string;
  name: string;
  avatar?: string | null;
  initials: string;
  email?: string;
}

interface ViewAllMembersModalProps {
  open: boolean;
  onClose: () => void;
  members: InviteMember[];
}

const EMPTY_MEMBERS: InviteMember[] = [];

const ViewAllMembersModal: React.FC<ViewAllMembersModalProps> = ({
  open,
  onClose,
}) => {

  const { activeTeamId, removeMember, fetchTeamById } = useTeamStore();

  const members = useTeamStore(state =>
    state.teams.find(t => t.id === state.activeTeamId)?.teamMembers ?? EMPTY_MEMBERS
  );

  const [openInvite, setOpenInvite] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const teamId = activeTeamId;

  // const members = useTeamStore(state =>
  //   state.teams.find(t => t.id === teamId)?.teamMembers ?? []
  // );

  const handleConfirmRemove = async () => {
    if (!teamId || !memberToRemove || isRemoving) return;

    try {
      setIsRemoving(true);
      await removeMember(teamId, memberToRemove.id);

      // Optional: re-sync from backend if needed
      // await fetchTeamByID();
      setConfirmOpen(false);
      setMemberToRemove(null);

    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent data-testid="modal-view-all-members" className="max-w-2xl! w-full! border-0 border-b-[5px] border-primary rounded-lg bg-card text-card-foreground">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-foreground">
              People associated with the Team
            </DialogTitle>
            <DialogClose asChild>
              {/* <button
                className="rounded-md p-1 text-[#001F3F] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#001F3F]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button> */}
            </DialogClose>
          </DialogHeader>

          <div 
            data-testid="members-table-container"
            className="overflow-y-auto border border-border rounded-md"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border ">
                  <TableHead className="border-border text-left px-14 text-foreground text-sm">Members</TableHead>
                  <TableHead className="text-center text-foreground text-sm">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} data-testid={`member-row-${member.id}`} className="border-b border-b-border last:border-b-0">
                    <TableCell >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={member.avatar || ""} />
                          <AvatarFallback className={`${getAvatarColor(member.id)} text-white`}>
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>

                        {/* Name + Email */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium truncate max-w-50">
                            {member.name.length > 40
                              ? `${member.name.slice(0, 10)}...`
                              : member.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-50">
                            {member.email || "—"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <button
                        data-testid={`btn-remove-member-${member.id}`}
                        className="text-xs text-red-600 hover:text-red-500 bg-muted hover:bg-muted/80 px-3 py-1 rounded-md cursor-pointer transition-colors"
                        onClick={() => {
                          setMemberToRemove(member);
                          setConfirmOpen(true);
                        }}
                      >
                        Remove from Team
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        data-testid="modal-confirm-remove-member"
        open={confirmOpen}
        onClose={() => {
          if (isRemoving) return;
          setConfirmOpen(false);
          setMemberToRemove(null);
        }}
        title={
          memberToRemove
            // ? `Are you sure you want to remove ${memberToRemove.name} (${memberToRemove.email})?`
            ? `Are you sure you want to remove ${memberToRemove.email}?`
            : 'Are you sure you want to remove this member?'
        }
        // confirmLabel={isRemoving ? "Removing..." : "Delete member"}
        confirmLabel="Delete member"
        description={
          memberToRemove?.email
            ? `${memberToRemove.email} will be removed from this team and its projects. To remove their access to the entire sliceflo.com organization, contact your admin.`
            : 'This member will be removed from this team and its projects.'
        }
        onConfirm={handleConfirmRemove}
        loading={isRemoving}
      />
    </>
  );
};

export default ViewAllMembersModal;
