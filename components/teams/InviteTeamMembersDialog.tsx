'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { X, Copy, User, Search, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { AddMemberRequest, TeamMember } from '@/types/teams.types';
import { useTeamStore } from '@/stores/teams-store'
import { inviteWorkspaceMembers } from '@/lib/api/workspace-api';
import { sonnerToast, toast } from '../ui/sonner';

const getAvatarColor = (id: string) => {
  if (!id) return 'bg-blue-500';
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-teal-500'
  ];
  // Parse ID or hash it if it's alphanumeric to reliably get a number
  const num = parseInt(id);
  const index = (isNaN(num) ? Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0) : num) % colors.length;
  return colors[index];
};

interface InviteTeamMembersDialogProps {
  open: boolean;
  onClose: () => void;
  teamName: string;
  teamID: string;
  existingMembers?: any[];
  onMembersUpdate?: (members: TeamMember[]) => void;
}

export default function InviteTeamMembersDialog({
  open,
  onClose,
  teamName,
  teamID,
  existingMembers = [],
  onMembersUpdate
}: InviteTeamMembersDialogProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [memberType, setMemberType] = useState<"member" | "guest">("member");
  const [rows, setRows] = useState<{ email: string; role: string }[]>([
    { email: "", role: "" }
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (!open) {
      setRows([{ email: "", role: "" }]);
      setSelected([]);
      setSearch('');
      setMemberType("member");
    }
  }, [open]);

  useEffect(() => {
    if (typeof window !== 'undefined' && teamID) {
      setInviteLink(`${window.location.origin}/teams/${encodeURIComponent(teamID)}`);
    }
  }, [teamID]);

  const { workspaceMembers, fetchWorkspaceMembers, currentWorkspace, addMembersToWorkspace } = useWorkspaceStore();
  const { addMember, } = useTeamStore();

  const workspaceId = currentWorkspace?.id;
  const addSelected = (id: string) => setSelected(prev => prev.includes(id) ? prev : [...prev, id]);
  const removeSelected = (id: string) => setSelected(prev => prev.filter(x => x !== id));

  useEffect(() => {
    if (open && workspaceId) {
      fetchWorkspaceMembers(workspaceId);
    }
  }, [open, workspaceId, fetchWorkspaceMembers]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const areEmailRowsValid = useMemo(() => {
    const filledRows = rows.filter((row) => row.email.trim() || row.role.trim());

    if (filledRows.length === 0) return false;

    return filledRows.every(
      (row) =>
        row.email.trim() &&
        isValidEmail(row.email) &&
        row.role.trim()
    );
  }, [rows]);

  const canAddMembers =
    selected.length > 0 ||
    areEmailRowsValid;

  const allUsers = useMemo(() => {
    return workspaceMembers.map((u: any) => {
      const isAlreadyMember = existingMembers.some(m => m.email === u.email);

      const initials =
        (u.name || "")
          .trim()
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase();

      return {
        id: String(u.userId),
        name: u.name,
        email: u.email,
        role: u.role,
        username: `@${u.name?.split(' ')[0].toLowerCase()}`,
        initials,
        // status: u.status || 'Active',
        avatar: u.profilePicture || null,
        fallbackAvatar: initials,
        selected: isAlreadyMember,
      };
    });
  }, [existingMembers, workspaceMembers]);

  // console.log("All users", allUsers);

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setSearch('');
      setMemberType('member');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allUsers.filter(u =>
      u.name.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q)
    );
  }, [search, allUsers]);

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast("success", {
        title: "Team link copied!",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.body.removeChild(textArea);
      toast("success", {
        title: "Shareable link copied to clipboard!",
      });
    }
  };

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddToTeam = async () => {
    if (!workspaceId) return;

    setIsAdding(true);

    // const loadingToast = toast("info", {
    //   title: "Adding members...",
    //   description: "Please wait while we add members to your team.",
    //   duration: 100000, // keep visible until dismissed
    // });

    try {
      /* ---------------------------------
       * Add selected workspace users
       * --------------------------------- */
      const selectedUsers = allUsers.filter(u => selected.includes(u.id));

      if (selectedUsers.length) {
        const apiMembers: AddMemberRequest[] = selectedUsers.map(u => ({
          userId: u.id,
          role: memberType,
        }));

        const uiMembers: TeamMember[] = selectedUsers.map(u => ({
          id: u.id,                     // team-member id (or temp id)
          userId: u.id,                 // REQUIRED
          name: u.name,
          email: u.email,
          role: memberType,
          profilePicture: u.avatar ?? null,          // REQUIRED
          profilePictureUrl: u.avatar ?? null,       // REQUIRED
          avatar: u.avatar ?? undefined,
          initials: u.initials,
          username: u.username,
          selected: false,
        }));

        await addMember(teamID, apiMembers, uiMembers);
      }

      // --------------------------------- Invite by email workspace ---------------------------------
      const emailRows = rows.filter(r => r.email.trim() && isValidEmail(r.email))
      if (emailRows.length > 0) {
        const emails = emailRows.map(r => r.email.toLowerCase())

        // 1. Invite to workspace
        await inviteWorkspaceMembers(workspaceId, emails)

        // 2. Force refetch to get fresh data
        await fetchWorkspaceMembers(workspaceId)

        // 3. Wait briefly for state to settle, then get UPDATED members
        await new Promise(resolve => setTimeout(resolve, 500))
        const updatedWorkspaceMembers = useWorkspaceStore.getState().workspaceMembers

        // 4. Now filter with fresh data
        const invitedUsers = updatedWorkspaceMembers.filter(u =>
          emails.includes(u.email.toLowerCase())
        )

        if (invitedUsers.length > 0) {
          const apiMembers: AddMemberRequest[] = invitedUsers.map(u => ({
            userId: String(u.userId),
            role: memberType,  // or row.role from emailRows
          }))
          const uiMembers: TeamMember[] = invitedUsers.map(u => ({
            id: String(u.userId),
            userId: String(u.userId),
            name: u.name || u.email,
            email: u.email,
            role: memberType,
            profilePicture: u.profilePicture ?? null,
            profilePictureUrl: u.profilePicture ?? null,
            avatar: u.profilePicture ?? undefined,
            initials: (
              u.name?.split(' ').map(n => n[0]).join('') || u.email[0]
            ).toUpperCase(),
            username: u.name ? u.name.split(' ')[0].toLowerCase() : '',
            selected: false,
          }));
          await addMember(teamID, apiMembers, uiMembers)
        }
      }

      // dismiss loading
      // sonnerToast.dismiss?.(loadingToast);

      // success toast
      toast("info", {
        title: "Members Added Successfully!",
        description: `${selected.length + emailRows.length} members added to ${teamName}.`,
        primaryAction: {
          label: "VIEW TEAM",
          onClick: () => {
            console.log("Go to team page");
          },
        },
        secondaryAction: {
          label: "CLOSE",
          onClick: () => { },
        },
      });
      onClose();
    } catch (error) {
      console.error("Failed to add team members:", error);
      // sonnerToast.dismiss?.(loadingToast);

      toast("error", {
        title: "Failed to Add Members",
        description: "Something went wrong. Please try again.",
        primaryAction: {
          label: "RETRY",
          onClick: handleAddToTeam,
        },
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[60vw]! w-full p-0 gap-0 bg-card text-card-foreground overflow-hidden border-0 border-b-[5px] border-primary rounded-lg">
        {/* Two Column Layout */}
        <div className="flex h-125">
          {/* Left Panel - Invite Form */}
          <div className="w-1/2 p-8 flex flex-col overflow-y-auto">
            <DialogTitle className="text-xl font-bold mb-8">
              Invite people to your Team:
            </DialogTitle>

            {/* Shareable Link */}
            <div className="mb-6">
              <label className="text-sm mb-2 block">
                Invite with Shareable link
              </label>
              <div className="flex items-center border border-border rounded-lg px-3 h-11 bg-muted">
                <span className="text-sm text-muted-foreground truncate flex-1">
                  {inviteLink}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyInviteLink}
                  className="h-7 w-7 hover:bg-muted rounded"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 mt-2">
              <span className="text-muted-foreground font-medium">Invite with email</span>

              {rows.map((row, index) => (
                <div key={index} className="w-full space-y-1">

                  {/* Input Row */}
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className={`flex items-center flex-1 p-1 rounded-md bg-background border ${
                        row.email && !isValidEmail(row.email)
                          ? "border-red-500"
                          : "border-input"
                        }`}
                    >
                      <Input
                        placeholder="Enter email address"
                        value={row.email}
                        onChange={(e) => {
                          const updated = [...rows];
                          updated[index].email = e.target.value;
                          setRows(updated);
                        }}
                        className={`border-0 shadow-none focus-visible:ring-0 flex-1 ${row.email && !isValidEmail(row.email)
                          ? "text-red-600 placeholder:text-red-400"
                          : ""
                          }`}
                      />

                      <Select
                        value={row.role || ""}
                        onValueChange={(v) => {
                          const updated = [...rows];
                          updated[index].role = v;
                          setRows(updated);
                        }}
                      >
                        <SelectTrigger className="w-30 border-0 rounded-md bg-muted text-foreground">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>

                        <SelectContent className="border-0 border-b-[5px] border-b-primary rounded-lg">
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {rows.length > 1 && (
                      <button
                        onClick={() => setRows(rows.filter((_, i) => i !== index))}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <X size={18} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>

                  {/* Error Message (Below Input, Above Add More) */}
                  {row.email && !isValidEmail(row.email) && (
                    <p className="text-xs text-red-500 ml-2">
                      Invalid email address
                    </p>
                  )}
                </div>
              ))}

              {/* Add More */}
              <div className="flex justify-end">
                <div
                  className="text-sm text-primary cursor-pointer hover:underline"
                  onClick={() => setRows([...rows, { email: "", role: "" }])}
                >
                  + Add more
                </div>
              </div>
            </div>

            {/* Add Button */}
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleAddToTeam}
                disabled={!canAddMembers || isAdding}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-8 py-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Members...
                  </>
                ) : (
                  '+ Add to Team'
                )}
              </Button>
            </div>
          </div>

          {/* Right Panel - Members List */}
          <div className="w-1/2 flex flex-col border-l border-border overflow-hidden">
            {/* Header */}
            <div className="px-3 py-4 border-b border-border flex items-center justify-baseline gap-4">
              <h3 className="text-base font-semibold">Workspace Members</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm w-32"
                />
              </div>
            </div>

            {/* Members List */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4">
                {filtered.map((u) => (
                  <div
                    key={u.id}
                    className={`flex items-center gap-3 py-3 px-2 border-b border-border last:border-0 ${
                      u.selected
                        ? 'cursor-not-allowed'
                        : 'hover:bg-muted cursor-pointer'
                      }`}
                    onClick={() => !u.selected && (selected.includes(u.id) ? removeSelected(u.id) : addSelected(u.id))}
                  >
                    {/* prevent checkbox click from bubbling to parent row click */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.includes(u.id) || u.selected}
                        onCheckedChange={(checked) => {
                          if (u.selected) return; // cannot toggle existing members
                          // `checked` may be boolean or "indeterminate" depending on component lib
                          const isChecked = Boolean(checked);
                          if (isChecked) addSelected(u.id);
                          else removeSelected(u.id);
                        }}
                        disabled={u.selected}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.avatar} alt={u.name} />
                      <AvatarFallback className={`${getAvatarColor(u.id)} text-white`}>
                        {u.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
