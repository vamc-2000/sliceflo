"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { ImageIcon, User, UserPlus } from "lucide-react";
import { useProfileStore } from "@/stores/profile-store";
import { useAuthStore } from "@/stores/auth-store";
import { useTeamStore } from "@/stores/teams-store";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import InviteMembersModal from "./InviteMemberModal";
import { inviteWorkspaceMembers } from "@/lib/api/workspace-api";

interface CreateWorkspaceProps {
  onClose?: () => void;
}

const purposes = [
  { value: "work", label: "Work" },
  { value: "personal", label: "Personal" },
  { value: "student", label: "Student" },
]

export default function CreateWorkspace({ onClose }: CreateWorkspaceProps) {
  const form = useForm({
    defaultValues: {
      icon: "",
      workspaceName: "",
      workspaceIdentifier: "",
      workspacePurpose: "",
      defaultWorkspace: "",
      inviteMembers: "",
      members: [],
    },
  });

  const { addWorkspace, isLoading, addMembersToWorkspace, setIsWorkspaceSwitching } = useWorkspaceStore();

  const workspaceName = form.watch("workspaceName");
  const selected = form.watch("workspacePurpose")

  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<{
    members: { email: string; role: string }[];
    message?: string;
  } | null>(null);

  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (workspaceName) {
      const identifier = workspaceName
        .replace(/\s/g, "") // remove spaces
        .slice(0, 3)
        .toUpperCase();

      form.setValue("workspaceIdentifier", identifier);
    } else {
      form.setValue("workspaceIdentifier", ""); // reset when empty
    }
  }, [workspaceName, form]);

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     const imageUrl = URL.createObjectURL(file);
  //     setSelectedImage(imageUrl);
  //   }
  // };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);   // for UI preview

      // Save into form
      form.setValue("icon", base64);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: any) => {

    try {
      const workspacePayload = {
        name: data.workspaceName,
        defaultWorkspace: data.defaultWorkspace === "yes",
      };

      // this should internally set isLoading = true in store
      const created = await addWorkspace(workspacePayload);

      if (!created?.id) {
        throw new Error("Workspace creation failed");
      }

      // Close modal immediately so user sees the Switch Workspace loader right away
      onClose?.();
      setIsWorkspaceSwitching(true);

      if (data.icon) {
        useWorkspaceStore.getState().updateWorkspaceLocally(
          created.id!,
          { icon: data.icon }
        );
      }

      if (data.defaultWorkspace === "yes") {
        await useProfileStore.getState().postDefaultWorkspace({
          workspaceId: created.id!,
        });
      }

      if (inviteData?.members?.length) {
        const emails = inviteData.members.map((m) => m.email);
        await inviteWorkspaceMembers(created.id!, emails);
      }

      await useAuthStore.getState().switchWorkspace(created.id!);
      useWorkspaceStore.getState().setCurrentWorkspace(created);

      await useTeamStore.getState().fetchTeams();

      toast("success", { title: "Workspace created successfully" });
      router.push('/dashboard');

      setTimeout(() => {
        setIsWorkspaceSwitching(false);
      }, 2000);
    } catch (err) {
      toast("error", { title: "Failed to create workspace" });
      setIsWorkspaceSwitching(false);
    }
  };
  return (
    <>
      <div className="px-2 space-y-4">
        <div className="bg-[#F2F2F7] px-5 py-3 rounded-lg">
          <div className="grid grid-cols-[50px_1fr_1fr_1fr] gap-3 items-start">

            {/* Icon */}
            <div>
              <Label className="text-sm text-[#8E8E93]">Icon</Label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 border border-[#8E8E93] rounded-md flex items-center justify-center bg-white mt-2"
              >
                {selectedImage ? (
                  <Image
                    src={selectedImage}
                    width={40}
                    height={40}
                    alt="icon"
                    className="rounded-md object-cover"
                  />
                ) : (
                  <ImageIcon className="text-[#8E8E93]" />
                )}
              </button>
              <Input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Workspace Name */}
            <div>
              <Label className="text-sm text-[#8E8E93]">Workspace name</Label>
              <Input
                placeholder="e.g. Marketing"
                className="mt-2 border-[#8E8E93]"
                {...form.register("workspaceName")}
              />
            </div>

            {/* Workspace Identifier */}
            <div>
              <Label className="text-sm text-[#8E8E93]">Workspace identifier</Label>
              <Input
                placeholder="e.g. MAR"
                className="mt-2 border-[#8E8E93]"
                {...form.register("workspaceIdentifier")}
              />
            </div>
          </div>
        </div>

        {/* -------------------- PURPOSE -------------------- */}
        <div className="border border-[#E5E5EA] rounded-md mb-4">
          <div className="border-l-4 border-[#001F3F] rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Workspace purpose</p>
              <p className="text-sm text-muted-foreground">
                Set the purpose of your workspace to organize tasks based on work,
                personal, or student needs.
              </p>
            </div>

            <Select onValueChange={(v) => form.setValue("workspacePurpose", v)}>
              <SelectTrigger className="w-50">
                <SelectValue placeholder="Select" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem
                  value="work"
                  className="relative pl-4 data-[state=checked]:before:absolute data-[state=checked]:before:left-0 data-[state=checked]:before:top-1/2 data-[state=checked]:before:-translate-y-1/2 data-[state=checked]:before:h-4 data-[state=checked]:before:w-1 data-[state=checked]:before:bg-[#001F3F]"
                >
                  Work
                </SelectItem>

                <SelectItem
                  value="personal"
                  className="relative pl-4 data-[state=checked]:before:absolute data-[state=checked]:before:left-0 data-[state=checked]:before:top-1/2 data-[state=checked]:before:-translate-y-1/2 data-[state=checked]:before:h-4 data-[state=checked]:before:w-1 data-[state=checked]:before:bg-[#001F3F]"
                >
                  Personal
                </SelectItem>

                <SelectItem
                  value="student"
                  className="relative pl-4 data-[state=checked]:before:absolute data-[state=checked]:before:left-0 data-[state=checked]:before:top-1/2 data-[state=checked]:before:-translate-y-1/2 data-[state=checked]:before:h-4 data-[state=checked]:before:w-1 data-[state=checked]:before:bg-[#001F3F]"
                >
                  Student
                </SelectItem>
              </SelectContent>
            </Select>

          </div>
        </div>

        {/* -------------------- DEFAULT WORKSPACE -------------------- */}
        <div className="border border-[#E5E5EA] rounded-md mb-4">
          <div className="border-l-4 border-[#001F3F] rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Default workspace</p>
              <p className="text-sm text-muted-foreground">
                Always open this workspace when you sign in.
              </p>
            </div>

            <Select
              // defaultValue="yes"
              onValueChange={(v) => form.setValue("defaultWorkspace", v)}
            >
              <SelectTrigger className="w-50">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="yes"
                  className="flex items-center gap-2 relative pl-4 data-[state=checked]:before:absolute data-[state=checked]:before:left-0 data-[state=checked]:before:top-1/2 data-[state=checked]:before:-translate-y-1/2 data-[state=checked]:before:h-4 data-[state=checked]:before:w-1 data-[state=checked]:before:bg-[#001F3F]"
                >
                  Yes
                </SelectItem>
                <SelectItem
                  value="no"
                  className="flex items-center gap-2 relative pl-4 data-[state=checked]:before:absolute data-[state=checked]:before:left-0 data-[state=checked]:before:top-1/2 data-[state=checked]:before:-translate-y-1/2 data-[state=checked]:before:h-4 data-[state=checked]:before:w-1 data-[state=checked]:before:bg-[#001F3F]"
                >
                  No
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* -------------------- INVITE MEMBERS -------------------- */}
        <div className="border border-[#E5E5EA] rounded-md">
          <div className="border-l-4 border-[#001F3F] rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Invite members</p>
              <p className="text-sm text-muted-foreground">
                Choose how you want to invite the members to this workspace
              </p>
            </div>

            <Button
              variant="outline"
              className="flex items-center w-50 text-[#8E8E93] bg-[#F2F2F7] px-2 py-1 overflow-hidden whitespace-nowrap text-ellipsis"
              onClick={() => setInviteModalOpen(true)}
            >
              <span className="truncate">
                {inviteData?.members?.length
                  ? inviteData.members.map((m) => m.email).join(", ")
                  : "Add members"}
              </span>

              <span className="ml-auto border-2 border-dashed border-[#E5E5EA] rounded-xl p-1 flex items-center justify-center">
                <UserPlus size={16} />
              </span>
            </Button>

          </div>
        </div>
      </div>

      {/* -------------------- FOOTER -------------------- */}
      <DialogFooter className="px-1 space-x-2">
        <Button variant="outline" onClick={onClose} className="w-38">
          Cancel
        </Button>

        <Button
          onClick={form.handleSubmit(onSubmit)}
          className={`w-38 flex items-center justify-center gap-2
              ${workspaceName ? "bg-[#001F3F] text-white cursor-pointer" : "bg-gray-300 text-gray-500 cursor-not-allowed"}
            `}
          disabled={!workspaceName || isLoading}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Creating...
            </>
          ) : (
            "Create Workspace"
          )}
        </Button>
      </DialogFooter>

      {/* Invite Members Modal */}
      {isInviteModalOpen && (
        <InviteMembersModal
          open={isInviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          onInviteData={(data, isSubmit) => {
            setInviteData(data);
            if (isSubmit) setInviteModalOpen(false);
          }}
          existingMembers={inviteData?.members || []}
        />
      )}
    </>
  );
}
