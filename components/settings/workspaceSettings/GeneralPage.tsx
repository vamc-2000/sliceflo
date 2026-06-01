

"use client";

import React, { useState, useEffect, useRef } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ImageIcon } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import Image from "next/image";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useSearchParams } from "next/navigation";
import { Workspace } from "@/types/workspace.types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useProfileStore } from "@/stores/profile-store";
import { DeleteWorkspaceDialog } from "./DeleteWorkspaceDialog";
import { mailStore } from "@/stores/mailbox-store";
import ProfileModal from "@/components/mailbox/ProfileModal";

export default function GeneralPage() {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const workspaceIdFromUrl = searchParams.get("workspaceId");
  const { postDefaultWorkspace, user, setUser } = useProfileStore();

  const {
    workspaces,
    fetchWorkspaces,
    updateWorkspace,
    updateWorkspaceLocally,
    currentWorkspace,
    isLoading,
    setCurrentWorkspace
  } = useWorkspaceStore();

  const [editData, setEditData] = useState<Record<string, {
    name: string;
    slug: string;
    isDefault: boolean;
    iconPreview?: string;
  }>>({});

  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (workspaces.length > 0) {
      if (workspaceIdFromUrl) {
        const workspace = workspaces.find(w => w.id === workspaceIdFromUrl);
        if (workspace) {
          setSelectedWorkspace(workspace);
          setCurrentWorkspace(workspace);
        }
      } else if (currentWorkspace) {
        setSelectedWorkspace(currentWorkspace);
      } else {
        setSelectedWorkspace(workspaces[0]);
      }
    }
  }, [workspaces, workspaceIdFromUrl, currentWorkspace, setCurrentWorkspace]);

  const generateIdentifier = (name: string): string => {
    return name
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 3)
      .toUpperCase();
  };
  const handleDeleteWorkspace = (ws: Workspace) => {
    setWorkspaceToDelete(ws);
    setIsDeleteDialogOpen(true);
  };
  const confirmDelete = async () => {
    if (!workspaceToDelete) return;
    try {
      // Logic to call your store/API for deletion
      // await deleteWorkspace(workspaceToDelete.id!); 
      toast("success", { title: "Success", description: `${workspaceToDelete.name} deleted successfully` });
    } catch (error) {
      toast("error", { title: "Error", description: "Failed to delete workspace" });
    }
  };


  useEffect(() => {
    if (selectedWorkspace) {
      const slug = selectedWorkspace.slug || generateIdentifier(selectedWorkspace.name);

      setEditData(prev => ({
        ...prev,
        [selectedWorkspace.id!]: {
          ...prev[selectedWorkspace.id!],
          name: selectedWorkspace.name,
          slug,
          isDefault: user?.defaultWorkspaceId === selectedWorkspace.id,
          iconPreview: selectedWorkspace.icon,
        }
      }));
    }
  }, [selectedWorkspace, user?.defaultWorkspaceId]);

  useEffect(() => {
    if (workspaces.length > 0) {
      setEditData(prev => {
        const next = { ...prev };
        workspaces.forEach((ws) => {
          if (!next[ws.id!]) {
            next[ws.id!] = {
              name: ws.name,
              slug: ws.slug || generateIdentifier(ws.name),
              isDefault: user?.defaultWorkspaceId === ws.id,
              iconPreview: ws.icon,
            };
          }
        });
        return next;
      });
    }
  }, [workspaces, user?.defaultWorkspaceId]);

  // Handle icon upload
  const handleIconUpload = (workspaceId: string, file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast("error", { title: "Error", description: "Please upload a valid image file (JPEG, PNG, GIF, or WebP)" });
      return;
    }

    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      toast("error", { title: "Error", description: "Image size should be less than 4MB" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;

      setEditData(prev => ({
        ...prev,
        [workspaceId]: {
          ...prev[workspaceId],
          iconPreview: base64String,
        }
      }));

      toast("success", { title: "Success", description: "Icon uploaded! Click Update to save." });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateWorkspace = async (workspaceId: string) => {
    try {
      const data = editData[workspaceId];


      await updateWorkspace(workspaceId, {
        name: data.name,
        // slug: data.slug, 
        // icon: data.iconPreview, 
      });

      // Update default workspace only if changed
      if (data.isDefault) {
        await postDefaultWorkspace({ workspaceId });
      } else if (!data.isDefault && user?.defaultWorkspaceId === workspaceId) {
        await postDefaultWorkspace({ workspaceId: "" });
      }

      // Save slug & icon locally in workspace store
      updateWorkspaceLocally(workspaceId, {
        slug: data.slug,
        icon: data.iconPreview,
      });

      // Refresh workspaces 
      await fetchWorkspaces();

      toast("success", { title: "Success", description: "Workspace updated successfully" });
    } catch (error) {
      console.error("Update error:", error);
      toast("error", { title: "Error", description: "Failed to update workspace" });
    }
  };


  const handleInputChange = (workspaceId: string, field: 'name' | 'slug', value: string) => {
    setEditData(prev => {
      const updated = { ...prev[workspaceId] };

      if (field === 'name') {
        updated.name = value;
        // updated.slug = generateIdentifier(value);
      } else if (field === 'slug') {
        updated.slug = value.slice(0, 3).toUpperCase() + value.slice(3);
      }

      return {
        ...prev,
        [workspaceId]: updated,
      };
    });
  };
  
  const handleOpenProfile = (member: any) => {
    // Priority: user.name -> email prefix -> name property (last resort if it's an ID)
    const displayName = member.user?.name || member.email?.split('@')[0] || member.name || "User";
    
    mailStore.getState().openProfileModal({
      name: displayName,
      email: member.email || member.user?.email || "",
      profilePictureUrl: member.profilePictureUrl || member.user?.avatar || member.avatar || "",
      position: member.role || "Member",
    });
  };

  const handleDefaultToggle = async (workspaceId: string, checked: boolean) => {
    setEditData(prev => ({
      ...prev,
      [workspaceId]: {
        ...prev[workspaceId],
        isDefault: checked,
      }
    }));
  };
  const ownedWorkspaces = workspaces.filter((ws) => {
    const members = (ws.members || []) as any[];
    const me = members.find((m) => m.userId === user?.id);
    return me?.role === "owner";
  });

  const sharedWorkspaces = workspaces.filter((ws) => {
    const members = (ws.members || []) as any[];
    const me = members.find((m) => m.userId === user?.id);
    return me?.role === "member";
  });


  if (!selectedWorkspace) {
    return (
      <div className="w-full space-y-6">
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No workspace selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-6 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>

      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Organization</h3>
        <div className="flex items-center gap-3 p-4 bg-muted border border-border rounded-lg transition-colors">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SF</span>
          </div>
          <span className="font-medium text-sm text-foreground">SliceFlo</span>
        </div>
      </div>

      {/* Workspaces Section */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Workspaces</h3>

        {ownedWorkspaces.map((ws) => (
          <SettingsCard
            key={ws.id}
            id={ws.id!}
            title={ws.name}
            subtitle={ws.slug ? `Identifier: ${ws.slug}` : ws.description}
            icon={
              <Avatar className="w-10 h-10">
                {editData[ws.id!]?.iconPreview ? (
                  <AvatarImage src={editData[ws.id!].iconPreview!} alt={ws.name} />
                ) : null}
                <AvatarFallback>
                  <Image src="/images/Workspace.svg" alt="workspace" width={40} height={40} className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
            }
            actionButton={
              <div className="flex -space-x-2 overflow-hidden mr-2">
                {(() => {
                  const members = (ws.members || []) as any[];

                  const workspaceOwner = members.find((m) => m.role === "owner");

                  return (
                    <>
                      {/* Render the Owner first */}
                      {workspaceOwner && (
                        <Avatar 
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-background border border-primary cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleOpenProfile(workspaceOwner)}
                        >
                          <AvatarImage
                            src={workspaceOwner.profilePictureUrl}
                            alt={workspaceOwner.email}
                          />
                          <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                            {workspaceOwner.email?.charAt(0).toUpperCase() || 'O'}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      {/* Render up to 2 other members */}
                      {/* {otherMembers.slice(0, 2).map((member: any) => (
                        <Avatar 
                          key={member.userId} 
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-background cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleOpenProfile(member)}
                        >
                          <AvatarImage src={member.profilePictureUrl} />
                          <AvatarFallback className="text-[10px]">
                            {member.email?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ))} */}

                      {/* Show count of remaining members */}
                      {/* {otherMembers.length > 2 && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-background">
                          +{otherMembers.length - 2}
                        </div>
                      )} */}
                    </>
                  );
                })()}
              </div>
            }
            isActive={activeSection === ws.id}
            onToggle={() => setActiveSection((prev) => (prev === ws.id ? null : ws.id!))}
          >
            {/* Form Section */}
            <div className="flex items-end gap-4 py-2">

              {/* Icon Upload */}
              <div className="flex-shrink-0 space-y-2 ">
                <label className="block text-xs font-medium text-muted-foreground uppercase opacity-70 px-1">Icon</label>
                <input
                  ref={ws.id === selectedWorkspace?.id ? fileInputRef : undefined}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleIconUpload(ws.id!, file);
                  }}
                />
                <div
                  onClick={() => {
                    setSelectedWorkspace(ws);
                    fileInputRef.current?.click();
                  }}
                  className="w-12 h-10 bg-card border border-border rounded-md flex items-center justify-center hover:bg-muted transition-colors cursor-pointer relative overflow-hidden"
                >
                  {editData[ws.id!]?.iconPreview ? (
                    <Image src={editData[ws.id!].iconPreview!} alt="Workspace icon" fill className="object-cover" />
                  ) : (
                    <ImageIcon size={20} className="text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Workspace Name */}
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-medium text-muted-foreground uppercase opacity-70">Workspace name</label>
                <input
                  type="text"
                  value={editData[ws.id!]?.name ?? ws.name}
                  onChange={(e) => handleInputChange(ws.id!, 'name', e.target.value)}
                  placeholder="e.g. Marketing"
                  className="w-full h-10 px-3 bg-card border border-input rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground transition-colors"
                />
              </div>

              {/* Workspace Identifier */}
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-medium text-muted-foreground uppercase opacity-70">Workspace identifier</label>
                <input
                  type="text"
                  value={editData[ws.id!]?.slug ?? ''}
                  readOnly={!!ws.slug}
                  onChange={(e) => {
                    const value = e.target.value;
                    const formatted = value.slice(0, 3).toUpperCase() + value.slice(3);
                    handleInputChange(ws.id!, 'slug', formatted);
                  }}
                  placeholder="e.g. MAR"
                  maxLength={10}
                  className={`w-full h-10 px-3 border border-input rounded-md text-sm placeholder:text-muted-foreground focus:outline-none font-medium transition-colors ${ws.slug
                    ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-70'
                    : 'bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary'
                    }`}
                />
              </div>
            </div>

            <div className="px-4 py-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-start gap-3">
                <Switch
                  id={`default-owned-${ws.id}`}
                  checked={editData[ws.id!]?.isDefault ?? false}
                  disabled={editData[ws.id!]?.isDefault}
                  onCheckedChange={(checked) => {
                    if (!editData[ws.id!]?.isDefault) handleDefaultToggle(ws.id!, checked);
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor={`default-owned-${ws.id}`} className="text-sm font-semibold text-foreground cursor-pointer">
                    Default Workspace
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">Always open this workspace when you sign in</p>
                </div>
              </div>
            </div>



            {/* 4. Add the Dialog component at the bottom of your JSX */}
            {workspaceToDelete && (
              <DeleteWorkspaceDialog

                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                workspaceName={workspaceToDelete.name}
              />
            )}

            {/* Actions */}
            <div className="flex items-center justify-between px-6  pt-4 mt-2  border-t border-border">
              <button
                onClick={() => handleDeleteWorkspace(ws)} // Pass the whole object
                className="text-sm text-red-600 hover:text-red-700 underline dark:text-red-400 dark:hover:text-red-300"
              >
                Delete workspace
              </button>
              <Button
                onClick={() => handleUpdateWorkspace(ws.id!)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              >
                Update workspace
              </Button>
            </div>

          </SettingsCard>
        ))}
        {sharedWorkspaces.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-muted-foreground pt-2">Shared with me</h3>
            {sharedWorkspaces.map((ws) => {
              const members = (ws.members || []) as any[];
              const myRole = members.find((m) => m.userId === user?.id)?.role ?? "member";
              return (
                <SettingsCard
                  key={ws.id}
                  id={ws.id!}
                  title={ws.name}
                  subtitle={ws.slug ? `Identifier: ${ws.slug}` : ws.description}
                  icon={
                    <Avatar className="w-10 h-10">
                      {ws.icon ? <AvatarImage src={ws.icon} alt={ws.name} /> : null}
                      <AvatarFallback>
                        <Image src="/images/Workspace.svg" alt="workspace" width={40} height={40} className="w-10 h-10" />
                      </AvatarFallback>
                    </Avatar>
                  }
                  actionButton={
                    <div className="flex items-center gap-2 mr-2">
                      <div className="flex -space-x-2 overflow-hidden">
                        {(() => {
                          const owner = members.find((m) => m.role === "owner");
                          const otherMembers = members.filter((m) => m.role !== "owner").slice(0, 2);
                          return (
                            <>
                              {owner && (
                                <Avatar 
                                  className="inline-block h-6 w-6 rounded-full ring-2 ring-background border border-primary cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleOpenProfile(owner)}
                                >
                                  <AvatarImage src={owner.profilePictureUrl} alt={owner.email} />
                                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                    {owner.email?.charAt(0).toUpperCase() || "O"}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {/* {otherMembers.map((m: any) => (
                                <Avatar 
                                  key={m.userId} 
                                  className="inline-block h-6 w-6 rounded-full ring-2 ring-background cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleOpenProfile(m)}
                                >
                                  <AvatarImage src={m.profilePictureUrl} alt={m.email} />
                                  <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                    {m.email?.charAt(0).toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              ))} */}
                              {/* {members.length > 3 && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-background">
                                  +{members.length - 3}
                                </div>
                              )} */}
                            </>
                          );
                        })()}
                      </div>
                      <span className="text-[10px] font-medium py-0.5 rounded-full bg-muted text-muted-foreground border border-border capitalize">
                        {myRole}
                      </span>
                    </div>
                  }
                  isActive={activeSection === ws.id}
                  onToggle={() => setActiveSection((prev) => (prev === ws.id ? null : ws.id!))}
                >
                  {/* Icon + Name + Identifier - one row */}
                  <div className="flex items-end gap-4 py-2">
                    {/* Icon */}
                    <div className="flex-shrink-0 space-y-2">
                      <label className="block text-xs font-medium text-muted-foreground uppercase opacity-70 px-1">Icon</label>
                      <div className="w-12 h-10 bg-card border border-border rounded-md flex items-center justify-center relative overflow-hidden opacity-70">
                        {ws.icon ? (
                          <Image src={ws.icon} alt="Workspace icon" fill className="object-cover" />
                        ) : (
                          <ImageIcon size={20} className="text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="flex-1 space-y-2">
                      <label className="block text-xs font-medium text-muted-foreground uppercase opacity-70">Workspace name</label>
                      <input type="text" value={ws.name} readOnly
                        className="w-full h-10 px-3 bg-muted border border-input rounded-md text-sm text-muted-foreground cursor-not-allowed opacity-70" />
                    </div>

                    {/* Identifier */}
                    <div className="flex-1 space-y-2">
                      <label className="block text-xs font-medium text-muted-foreground uppercase opacity-70">Workspace identifier</label>
                      <input type="text" value={ws.slug ?? ""} readOnly
                        className="w-full h-10 px-3 bg-muted border border-input rounded-md text-sm text-muted-foreground cursor-not-allowed opacity-70" />
                    </div>
                  </div>



                  {/* Default Workspace toggle */}
                  <div className="rounded-lg bg-muted/50 border border-border/50 p-3  mb-4">
                    <div className="flex items-start gap-3">
                      <Switch
                        id={`default-shared-${ws.id}`}
                        checked={editData[ws.id!]?.isDefault ?? false}
                        disabled={editData[ws.id!]?.isDefault}
                        onCheckedChange={(checked) => {
                          if (!editData[ws.id!]?.isDefault) handleDefaultToggle(ws.id!, checked);
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`default-shared-${ws.id}`} className="text-sm font-semibold text-foreground cursor-pointer">
                          Default Workspace
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">Always open this workspace when you sign in</p>
                      </div>
                    </div>
                  </div>
                  {/* Read-only notice */}
                  <p className="text-xs text-muted-foreground italic px-6 pb-2">
                    You have <span className="font-medium capitalize">{myRole}</span> access. Only the workspace owner can edit settings.
                  </p>
                  {/* Update button */}
                  <div className="flex justify-end items-center px-6 py-4 border-t border-border">
                    <Button
                      onClick={() => handleUpdateWorkspace(ws.id!)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                    >
                      Update workspace
                    </Button>
                  </div>

                </SettingsCard>
              );
            })}
          </>
        )}

        {/* Profile Modal for member previews */}
        <ProfileModal />
      </div>
    </div>
  );
}
