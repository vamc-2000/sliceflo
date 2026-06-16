"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, CirclePlus, Plus, Search, UserPlus, Users, Trash2 } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useTimesheetStore } from "@/stores/timesheet-store";
import { Separator } from "@/components/ui/separator";
import ConfirmationModal from "@/components/ConfirmationModal";

const getInitials = (name?: string) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function AddApproverDropdown({
  userId,
  trigger,
  defaultView = "list",
}: {
  userId: string;
  trigger?: React.ReactNode;
  defaultView?: "list" | "select";
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"list" | "select">(defaultView);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [approverToRemove, setApproverToRemove] = useState<string | null>(null);
  const openDeleteModal = !!approverToRemove;

  const { addApprovers, removeApprovers, isTimesheetsLoading: isLoading, timesheets, fetchUserApprovers, selectedUserApprovers } = useTimesheetStore();
  const { workspaceMembers, currentWorkspace, fetchWorkspaceMembers } = useWorkspaceStore();

  useEffect(() => {
    if (userId) {
      fetchUserApprovers(userId);
    }
  }, [userId, fetchUserApprovers]);

  useEffect(() => {
    if (userId) {
      // 1. Prioritize dedicated approvers API result
      if (selectedUserApprovers && selectedUserApprovers.userId === userId && selectedUserApprovers.timesheetApprovers?.length) {
        setSelectedApprovers(selectedUserApprovers.timesheetApprovers);
      }
      // 2. Fallback to current timesheets in state
      else {
        const fromTimesheets = timesheets.find(t => t.userId === userId)?.approverIds;
        if (fromTimesheets && fromTimesheets.length > 0) {
          setSelectedApprovers(fromTimesheets);
        } else {
          setSelectedApprovers([]);
        }
      }
    }
  }, [userId, timesheets, selectedUserApprovers]);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkspaceMembers(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  const availableMembers = useMemo(() => {
    return workspaceMembers.filter((m) => !selectedApprovers.includes(m.userId));
  }, [workspaceMembers, selectedApprovers]);

  const filteredMembers = useMemo(() => {
    return availableMembers.filter(
      (m) =>
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableMembers, searchQuery]);

  const handleSelectApprover = async (approverId: string) => {
    console.log("Selected approver:", approverId);
    if (!userId) return;

    setIsAdding(true);
    const newApprovers = selectedApprovers.includes(approverId)
      ? selectedApprovers
      : [...selectedApprovers, approverId];

    const success = await addApprovers(userId, newApprovers);

    if (success) {
      await fetchUserApprovers(userId);
      setSelectedApprovers(newApprovers);
      setView("list"); // go back
      setSearchQuery("");
    }
    setIsAdding(false);
  };

  const handleConfirmRemove = async () => {
    if (!approverToRemove || !userId) return;
    setIsAdding(true);
    const success = await removeApprovers(userId, approverToRemove);
    if (success) {
      await fetchUserApprovers(userId);
      const newApprovers = selectedApprovers.filter((id) => id !== approverToRemove);
      setSelectedApprovers(newApprovers);
    }
    setApproverToRemove(null);
    setIsAdding(false);
  };

  const isSelected = selectedApprovers.includes(userId);

  const selectedUsers = useMemo(() => {
    const memberMap = new Map();
    workspaceMembers.forEach(m => memberMap.set(m.userId, m));

    if (selectedUserApprovers && selectedUserApprovers.userId === userId && selectedUserApprovers.approvers) {
      selectedUserApprovers.approvers.forEach((app: any) => {
        if (!memberMap.has(app.id)) {
          memberMap.set(app.id, {
            ...app,
            userId: app.id,
            profilePicture: app.profilePictureUrl || app.profilePicture,
            role: app.jobRole || app.role
          });
        }
      });
    }

    return selectedApprovers
      .map(id => memberMap.get(id))
      .filter(Boolean);
  }, [workspaceMembers, selectedApprovers, selectedUserApprovers, userId]);

  const filteredSelectedUsers = useMemo(() => {
    return selectedUsers.filter(
      (m) =>
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedUsers, searchQuery]);

  return (
    <>
      <Popover onOpenChange={(open) => {
        if (open && userId) {
          fetchUserApprovers(userId);
        }
      }}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button data-testid="btn-add-approver-trigger" className="bg-muted text-muted-foreground hover:bg-primary py-5 px-5!">
            <UserPlus className="mr-1 h-4 w-4" />
            Add approver
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        data-testid="add-approver-popover"
        align="end"
        className="z-60 w-95 px-4 py-3 border-0 border-b-[5px] border-primary bg-background"
        onWheel={(e) => e.stopPropagation()}
      >
        {/* ---------------- LIST VIEW ---------------- */}
        {view === "list" && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-base font-semibold text-foreground">Members</p>
              {selectedApprovers.length > 0 && (
                <div className="flex -space-x-2">
                  {filteredSelectedUsers.slice(0, 4).map((member) => (
                    <Avatar key={member.userId} className="h-7 w-7 border-2 border-white shadow-sm">
                      <AvatarImage src={member.profilePicture || undefined} />
                      <AvatarFallback className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {filteredSelectedUsers.length > 4 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-sm bg-gray-50 text-[10px] font-medium text-gray-500">
                      +{filteredSelectedUsers.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedApprovers.length === 0 ? (
              <div className="flex flex-col h-40">
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No Approvers
                  </p>
                </div>
              </div>
            ) : filteredSelectedUsers.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No matching approvers
              </div>
            ) : (
              <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2">
                {filteredSelectedUsers.map((member) => (
                  <div
                    data-testid={`selected-approver-${member.userId}`}
                    key={member.userId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profilePicture || undefined} />
                        <AvatarFallback className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium text-sm">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-[15px] font-medium text-foreground leading-tight mb-0.5">
                          {member.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 uppercase font-medium">
                          <Users className="w-3.5 h-3.5" />
                          {member.role || "MEMBER"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* <div className="h-8 w-[2px] bg-gradient-to-b from-gray-200 via-[#001F3F] to-gray-200 rounded-full opacity-70" /> */}
                      <div className="h-6 w-0.5 bg-linear-to-b from-[#D1D1D6] via-[#000000] to-[#D1D1D6] rounded-md" />
                      <button
                        data-testid={`btn-remove-approver-${member.userId}`}
                        onClick={() => setApproverToRemove(member.userId)}
                        disabled={isAdding}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Footer */}
            <div className="border-t pt-3">
              <Button
                data-testid="btn-change-approver"
                className="w-full bg-primary hover:bg-primary cursor-pointer"
                onClick={() => setView("select")}
              >
                {selectedApprovers.length > 0 ? "Change Approver" : "Add Approver"}
              </Button>
            </div>
          </>
        )}

        {/* ---------------- SELECT VIEW ---------------- */}
        {view === "select" && (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <Button
                data-testid="btn-back-to-list"
                size="icon"
                variant="ghost"
                onClick={() => setView("list")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <p className="text-sm font-medium">Select Approver</p>
            </div>

            {/* Members list & Search */}
            {availableMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Users className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">No members to select</p>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    data-testid="input-search-approvers"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 border-gray-200 focus-visible:ring-primary"
                  />
                </div>

                <div
                  className="max-h-[200px] overflow-y-auto pr-1"
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  {filteredMembers.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No matching members
                    </div>
                  ) : (
                    filteredMembers.map((member) => (
                      <div
                        data-testid={`available-approver-${member.userId}`}
                        key={member.userId}
                        className={`flex items-center justify-between p-2 hover:bg-primary/10/30 rounded-md transition-colors group ${isAdding ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        onClick={() => {
                          if (!isAdding) handleSelectApprover(member.userId);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-gray-100">
                            <AvatarImage src={member.profilePicture || undefined} />
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="text-sm font-semibold text-foreground leading-tight">{member.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-medium">{member.role || "Member"}</p>
                          </div>
                        </div>

                        <div className="flex items-center h-8 w-8 justify-center group-hover:scale-110 transition-transform">
                          <CirclePlus className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}


          </>
        )}
      </PopoverContent>
    </Popover>

      <ConfirmationModal
        open={openDeleteModal}
        onClose={() => setApproverToRemove(null)}
        title="Are you sure you want to remove this approver?"
        description="Removing this approver is permanent and cannot be undone."
        confirmLabel="Remove"
        onConfirm={handleConfirmRemove}
        loading={isAdding}
      />
    </>
  );
}