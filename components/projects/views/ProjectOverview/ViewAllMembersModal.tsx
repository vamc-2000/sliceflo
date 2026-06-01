// components/projects/views/ProjectOverview/ViewAllMembersModal.tsx
'use client'

import React from 'react'
import { useState } from 'react'
import ConfirmationModal from '@/components/ConfirmationModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'


interface Member {
  id: string // userId for members, viewerId for viewers
  name: string
  email?: string
  avatar?: string | null
  role?: string
  initials: string
}

interface ViewAllMembersModalProps {
  isOpen: boolean
  onClose: () => void
  members: Member[]
  title?: string
  type: 'members' | 'viewers' // Add this to determine which type
  onRemove: (userId: string) => Promise<void> // Add remove handler
  projectId: string // Add projectId for context
  leaderIds?: string[] // List of leader IDs
  currentUserId?: string // Current user ID
}

const ViewAllMembersModal: React.FC<ViewAllMembersModalProps> = ({
  isOpen,
  onClose,
  members,
  title = 'All Members',
  type,
  onRemove,
  projectId,
  leaderIds = [],
  currentUserId,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [personToRemove, setPersonToRemove] = useState<Member | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const handleConfirmRemove = async () => {
    if (!personToRemove || isRemoving) return;

    try {
      setIsRemoving(true);
      await onRemove(personToRemove.id); // Call the passed prop
      setConfirmOpen(false);
      setPersonToRemove(null);

      // Close main modal only if this was the last member/viewer
      if (members.length <= 1) {
        onClose()
      }
    } catch (error) {
      console.error(`Failed to remove ${type === 'members' ? 'member' : 'viewer'}:`, error);
    } finally {
      setIsRemoving(false);
    }
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!max-w-2xl !w-full border-0 border-b-[5px] border-b-primary rounded-lg bg-card">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-primary text-sm font-bold">
              {type === 'members'
                ? 'People associated with the Project'
                : 'Viewers associated with the Project'}
            </DialogTitle>
            {/* <DialogClose className="absolute right-4 top-4">
              <X className="h-4 w-4" />
            </DialogClose> */}
          </DialogHeader>

          <div className="overflow-y-auto border border-border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted">
                  <TableHead className="border-r border-border text-center text-primary text-xs">{type === 'members' ? 'Members' : 'Viewers'}</TableHead>
                  <TableHead className="text-center text-primary text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className="border-b border-b-border last:border-b-0">
                    <TableCell className="border-r border-r-border">
                      <div className="flex items-center gap-3">
                        {/* Avatar Cell */}
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={member.avatar || ""} />
                          <AvatarFallback className="text-[10px]">{member.initials}</AvatarFallback>
                        </Avatar>

                        {/* Name and Email */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium truncate max-w-[200px]">
                            {member.name.length > 40
                              ? `${member.name.slice(0, 40)}...`
                              : member.name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {member.email || "—"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Action Cell */}
                    <TableCell className="text-center">
                      <button
                        onClick={() => {
                          setPersonToRemove(member);
                          setConfirmOpen(true);
                        }}
                        disabled={
                          (type === 'members' && member.role === 'owner') ||
                          (type === 'members' && member.id === currentUserId && leaderIds.includes(member.id))
                        }
                        className={`bg-muted text-xs hover:cursor-pointer hover:underline px-3 py-1 rounded-md ${((type === 'members' && member.role === 'owner') || (type === 'members' && member.id === currentUserId && leaderIds.includes(member.id)))
                          ? 'text-muted-foreground cursor-not-allowed opacity-50'
                          : 'text-destructive'
                          }`}
                        title={
                          type === 'members' && member.role === 'owner'
                            ? 'Cannot remove project owner'
                            : type === 'members' && member.id === currentUserId && leaderIds.includes(member.id)
                              ? 'You cannot remove yourself as a leader'
                              : ``
                        }
                      >
                        {type === 'members' ? 'Remove from Project' : 'Remove Viewer'}
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
        open={confirmOpen}
        onClose={() => {
          if (isRemoving) return;
          setConfirmOpen(false);
          setPersonToRemove(null);
        }}
        title={
          personToRemove
            ? `Are you sure you want to remove ${personToRemove.email}?`
            : `Are you sure you want to remove this ${type === 'members' ? 'member' : 'viewer'}?`
        }
        confirmLabel={`Remove ${type === 'members' ? 'member' : 'viewer'}`}
        description={
          personToRemove?.email
            ? `${personToRemove.email} will be removed from this project. To remove their access to the entire workspace, contact your admin.`
            : `This ${type === 'members' ? 'member' : 'viewer'} will be removed from this project.`
        }
        onConfirm={handleConfirmRemove}
        loading={isRemoving}
      />
    </>
  )
}

export default ViewAllMembersModal
