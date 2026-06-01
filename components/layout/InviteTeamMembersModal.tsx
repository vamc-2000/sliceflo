import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Link2, ChevronDown, ChevronUp, User, Mail } from "lucide-react";
import { useTeamStore } from "@/stores/teams-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { toast } from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface InviteTeamMembersModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InviteTeamMembersModal({
    open,
    onOpenChange,
}: InviteTeamMembersModalProps) {
    const [email, setEmail] = useState("");
    const [selectedTeam, setSelectedTeam] = useState<string>("");
    const [selectedProject, setSelectedProject] = useState<string>("");
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [isShowingAllMembers, setIsShowingAllMembers] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { currentWorkspace, workspaceMembers, fetchWorkspaceMembers, addMembersToWorkspace } = useWorkspaceStore();
    const { teams, addMember: addMemberToTeam } = useTeamStore();
    const { projects, addMembersToProject } = useProjectsStore();

    useEffect(() => {
        if (open && currentWorkspace?.id) {
            fetchWorkspaceMembers(currentWorkspace.id);
        }
    }, [open, currentWorkspace?.id, fetchWorkspaceMembers]);

    const handleSendInvite = async () => {
        // If no member selected, we need an email
        if (!selectedMemberId && !email) {
            toast.error("Please enter an email address or select a member");
            return;
        }

        if (email && !selectedMemberId) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                toast.error("Please enter a valid email address");
                return;
            }
        }

        setIsLoading(true);
        try {
            const inviteeId = selectedMemberId || email;
            const inviteeEmail = selectedMemberId ?
                workspaceMembers.find(m => m.userId === selectedMemberId || m._id === selectedMemberId)?.email || email :
                email;

            if (selectedProject) {
                // Scenario: Add to project
                await addMembersToProject(selectedProject, [{ userId: inviteeId, role: "member" }]);
                toast.success(`Member added to project successfully`);
            } else if (selectedTeam) {
                // Scenario: Add to team
                // Team store expects AddMemberRequest[]: { userId?: string; email?: string; role: "admin" | "member" | "guest" }
                const apiMember = selectedMemberId ?
                    { userId: selectedMemberId, role: "member" as const } :
                    { email: email, role: "member" as const };

                await addMemberToTeam(
                    selectedTeam,
                    [apiMember],
                    [] // uiMembers can be empty as the store handles normalization in some paths or relies on refetch
                );
                toast.success(`Member added to team successfully`);
            } else if (currentWorkspace?.id) {
                // Scenario: Add to workspace only (only if not already a member or if inviting via email)
                if (selectedMemberId) {
                    toast.error("This user is already a member of the workspace");
                } else {
                    await addMembersToWorkspace(currentWorkspace.id, [{ userId: email, role: "member" }]);
                    toast.success(`Invitation sent to ${email} for workspace`);
                }
            } else {
                toast.error("No active workspace found");
                setIsLoading(false);
                return;
            }

            if (!selectedMemberId || selectedProject || selectedTeam) {
                onOpenChange(false);
                setEmail("");
                setSelectedTeam("");
                setSelectedProject("");
                setSelectedMemberId(null);
                setIsShowingAllMembers(false);
            }
        } catch (error: any) {
            console.error("Invite Error:", error);
            toast.error(error.response?.data?.message || "Failed to process request");
        } finally {
            setIsLoading(false);
        }
    };

    const copyShareableLink = () => {
        const link = `${window.location.origin}/invite/join`;
        navigator.clipboard.writeText(link);
        toast.success("Shareable link copied to clipboard");
    };

    const handleSelectMember = (member: any) => {
        setSelectedMemberId(member.userId || member._id);
        setEmail(""); // Clear email if a member is selected
        setIsShowingAllMembers(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-white">
                <div className="p-6 space-y-6">
                    <DialogHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl font-bold text-[#001F3F]">
                                Invite Team Members
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-sm text-[#8E8E93] font-normal">
                            Add teammates by email or select from workspace members.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Email or Selected Member */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#001F3F]">
                                Invite with email
                            </label>
                            <div className="relative">
                                {selectedMemberId ? (
                                    <div className="flex items-center justify-between h-11 px-3 border border-[#B0B0B0] rounded-md bg-gray-50">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={workspaceMembers.find(m => (m.userId || m._id) === selectedMemberId)?.avatar} />
                                                <AvatarFallback className="text-[10px]">
                                                    {workspaceMembers.find(m => (m.userId || m._id) === selectedMemberId)?.name?.charAt(0) || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium text-[#001F3F]">
                                                {workspaceMembers.find(m => (m.userId || m._id) === selectedMemberId)?.name || workspaceMembers.find(m => (m.userId || m._id) === selectedMemberId)?.email}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-gray-200"
                                            onClick={() => setSelectedMemberId(null)}
                                        >
                                            <Mail className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Input
                                        placeholder="Add an email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-11 border-[#B0B0B0] focus-visible:ring-[#001F3F] placeholder:text-[#B0B0B0]"
                                    />
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsShowingAllMembers(!isShowingAllMembers)}
                                className="text-xs text-[#001F3F] hover:bg-transparent p-0 h-auto font-medium flex items-center gap-1"
                            >
                                {isShowingAllMembers ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                Show all members
                            </Button>

                            {isShowingAllMembers && (
                                <div className="border border-[#B0B0B0] rounded-md mt-1 overflow-hidden transition-all duration-200">
                                    <ScrollArea className="h-40">
                                        <div className="p-1">
                                            {workspaceMembers.length > 0 ? (
                                                workspaceMembers.map((member) => (
                                                    <div
                                                        key={member.userId || member._id}
                                                        onClick={() => handleSelectMember(member)}
                                                        className={cn(
                                                            "flex items-center gap-3 p-2 rounded-sm cursor-pointer hover:bg-gray-100",
                                                            selectedMemberId === (member.userId || member._id) && "bg-blue-50"
                                                        )}
                                                    >
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={member.avatar} />
                                                            <AvatarFallback className="bg-[#001F3F] text-white text-xs">
                                                                {member.name?.charAt(0) || member.email?.charAt(0) || "U"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-[#001F3F]">
                                                                {member.name || member.email}
                                                            </span>
                                                            <span className="text-xs text-[#8E8E93]">
                                                                {member.role || "Member"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-sm text-[#8E8E93]">
                                                    No workspace members found
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>

                        {/* Team Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#001F3F]">
                                Add to team
                            </label>
                            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                                <SelectTrigger className="w-full h-11 border-[#B0B0B0] focus:ring-[#001F3F] text-[#001F3F]">
                                    <SelectValue placeholder="Select Team" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {(Array.isArray(teams) ? teams : []).map((team) => (
                                        <SelectItem key={team.id || ""} value={team.id || ""}>
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Project Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#001F3F]">
                                Add to projects
                            </label>
                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                                <SelectTrigger className="w-full h-11 border-[#B0B0B0] focus:ring-[#001F3F] text-[#001F3F]">
                                    <SelectValue placeholder="Select Project" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {projects?.map((project) => (
                                        <SelectItem key={project.id || ""} value={project.id || ""}>
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
                        <Button
                            variant="outline"
                            onClick={copyShareableLink}
                            className="flex items-center gap-2 border-[#B0B0B0] text-[#8E8E93] hover:bg-gray-50 h-10 px-4"
                        >
                            <Link2 className="h-4 w-4" />
                            Copy Shareable link
                        </Button>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="border-[#B0B0B0] text-[#8E8E93] hover:bg-gray-50 h-10 px-6 min-w-[100px]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSendInvite}
                                disabled={isLoading}
                                className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white h-10 px-6 min-w-[100px]"
                            >
                                {isLoading ? "Sending..." : "Send Invite"}
                            </Button>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

