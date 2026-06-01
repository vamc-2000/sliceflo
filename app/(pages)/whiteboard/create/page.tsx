"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWhiteboardStore } from "@/stores/useWhiteboard-store";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useProfileStore } from "@/stores/profile-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProjectsStore } from "@/stores/projects-store";
import { ChevronDown, Plus, X } from "lucide-react";
import { useTeamStore } from "@/stores/teams-store";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

export default function WhiteboardCreatePage() {
    const { addWhiteboard } = useWhiteboardStore();
    const { user } = useProfileStore();
    const router = useRouter();

    const [whiteboardName, setWhiteboardName] = useState("");
    const [whiteboardIdentifier, setWhiteboardIdentifier] = useState("");
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [linkTo, setLinkTo] = useState("");
    const { projects, fetchProjects } = useProjectsStore();
    const [selectedType, setSelectedType] = useState<string>("");
    const [selectedProject, setSelectedProject] = useState<string>("");
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [showLinkSection, setShowLinkSection] = useState(false);
    const [activeTab, setActiveTab] = useState<"portfolio" | "project" | "team">("project");
    const { teams, fetchTeams } = useTeamStore();

    useEffect(() => {
        fetchProjects();
        fetchTeams();
    }, [fetchProjects, fetchTeams]);

    const currentProject = projects.find((p) => p.id === selectedProject);

    const handleWhiteboardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setWhiteboardName(name);
        const identifier = name.slice(0, 3).replace(/\s/g, '').toUpperCase();
        setWhiteboardIdentifier(identifier);
    };

    const handleCreateWhiteboard = () => {
        const newWhiteboardId = `whiteboard-${Date.now()}`;

        addWhiteboard({
            id: newWhiteboardId,
            title: whiteboardName || "Untitled",
            parentId: null,
            icon: "🎨",
            content: { elements: [], appState: {} },  // ✅ Correct - object with elements and appState
        });

        router.push(`/whiteboard/${newWhiteboardId}`);  // singular

    };

    const handleCancel = () => {
        router.push('/whiteboard');
    };

    const handleAddProject = (projectId: string) => {
        if (!selectedProjects.includes(projectId)) {
            setSelectedProjects([...selectedProjects, projectId]);
        }
    };

    const handleRemoveProject = (projectId: string) => {
        setSelectedProjects(selectedProjects.filter(id => id !== projectId));
    };

    const handleAddTeam = (teamId: string) => {
        if (!selectedTeams.includes(teamId)) {
            setSelectedTeams([...selectedTeams, teamId]);
        }
    };

    const handleRemoveTeam = (teamId: string) => {
        setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    };

    const isFormValid = () => {
        return whiteboardName.trim();
    };

    return (
        <div className="space-y-6">
            <div className="border-b">
                <Breadcrumbs />
            </div>

            <div className="px-7 space-y-6">
                {/* Whiteboard Name and Identifier Section */}
                <div className="bg-[#F2F2F7] p-4 rounded-md">
                    <div className="flex gap-6">
                        <div className="w-80">
                            <label className="block text-xs font-medium text-[#8E8E93] mb-2">
                                Whiteboard name
                            </label>
                            <Input
                                type="text"
                                value={whiteboardName}
                                onChange={handleWhiteboardNameChange}
                                placeholder="e.g. Design Sprint"
                                className="h-10 bg-white"
                            />
                        </div>

                        <div className="w-80">
                            <label className="block text-xs font-medium text-[#8E8E93] mb-2">
                                Whiteboard identifier
                            </label>
                            <Input
                                type="text"
                                value={whiteboardIdentifier}
                                onChange={(e) => setWhiteboardIdentifier(e.target.value)}
                                placeholder="e.g. DES"
                                className="h-10 bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Labels Section */}
                <div className="border border-gray-200 border-l-4 border-l-black rounded-lg p-5 bg-white">
                    <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Labels</h3>
                            <p className="text-xs text-gray-600">
                                Create and manage labels to categorize and organize whiteboards, making it easier for your team to filter and track work.
                            </p>
                        </div>

                        <div className="w-80">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 justify-between bg-white"
                                    >
                                        <span className="text-sm text-gray-700">Select</span>
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Link Whiteboard Section */}
                <div className="border border-gray-200 border-l-4 border-l-black rounded-lg p-5 bg-white">
                    <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Link this whiteboard to</h3>
                            <p className="text-xs text-gray-600">
                                Link this whiteboard to a Portfolio, Project, or Team to ensure it's organized, discoverable, and accessible in the right workspace.
                            </p>
                        </div>

                        <div className="w-80">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 justify-start bg-white text-[#001F3F] hover:text-[#001F3F]/90 hover:bg-gray-100"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Link this whiteboard
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-80 p-0">
                                    <div className="flex border-b border-gray-200 px-1 pt-1">
                                        <button
                                            onClick={() => setActiveTab("project")}
                                            className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "project"
                                                    ? "text-gray-900 border-b-2 border-black -mb-[2px]"
                                                    : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Project
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("team")}
                                            className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "team"
                                                    ? "text-gray-900 border-b-2 border-black -mb-[2px]"
                                                    : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Teams
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("portfolio")}
                                            className={`px-2 py-2 text-sm font-medium transition-colors ${activeTab === "portfolio"
                                                    ? "text-gray-900 border-b-2 border-black -mb-[2px]"
                                                    : "text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Portfolio
                                        </button>
                                    </div>

                                    <div className="p-2">
                                        {activeTab === "project" && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-3">Recent Projects</p>
                                                <div className="max-h-60 overflow-y-auto">
                                                    {projects.map((project) => {
                                                        const isSelected = selectedProjects.includes(project.id!);

                                                        return (
                                                            <div
                                                                key={project.id}
                                                                className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-gray-100" : "hover:bg-gray-50"
                                                                    }`}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        handleRemoveProject(project.id!);
                                                                    } else {
                                                                        handleAddProject(project.id!);
                                                                    }
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            handleAddProject(project.id!);
                                                                        } else {
                                                                            handleRemoveProject(project.id!);
                                                                        }
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#001F3F]"
                                                                />

                                                                <span className="text-sm text-gray-900 flex-1">
                                                                    {project.name}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === "team" && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-3">Recent Teams</p>
                                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                                    {teams.map((team) => {
                                                        const isSelected = selectedTeams.includes(team.id!);

                                                        return (
                                                            <div
                                                                key={team.id}
                                                                className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-gray-100" : "hover:bg-gray-50"
                                                                    }`}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        handleRemoveTeam(team.id!);
                                                                    } else {
                                                                        handleAddTeam(team.id!);
                                                                    }
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    checked={isSelected}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            handleAddTeam(team.id!);
                                                                        } else {
                                                                            handleRemoveTeam(team.id!);
                                                                        }
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="data-[state=checked]:bg-[#001F3F] data-[state=checked]:border-[#001F3F]"
                                                                />

                                                                <span className="text-sm text-gray-900 flex-1">
                                                                    {team.name}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === "portfolio" && (
                                            <div className="text-sm text-gray-500 py-8 text-center">
                                                No portfolios available
                                            </div>
                                        )}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Show Selected Projects */}
                    {selectedProjects.length > 0 && activeTab === "project" && (
                        <div className="mt-4 w-2/3">
                            <div className="border-t pt-4">
                                {selectedProjects.map((projectId) => {
                                    const project = projects.find(p => p.id === projectId);
                                    if (!project) return null;

                                    return (
                                        <div
                                            key={project.id}
                                            className="flex items-center justify-between py-1 px-1 hover:bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3 flex-1 mr-4">
                                                {project.icon?.name && (
                                                    <span className="text-base">{project.icon.name}</span>
                                                )}
                                                <span className="text-sm text-gray-900">
                                                    {project.name}
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemoveProject(project.id!);
                                                }}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2 shrink-0 h-7 w-7 p-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Show Selected Teams */}
                    {selectedTeams.length > 0 && activeTab === "team" && (
                        <div className="mt-4 w-2/3">
                            <div className="border-t pt-4">
                                {selectedTeams.map((teamId) => {
                                    const team = teams.find(t => t.id === teamId);
                                    if (!team) return null;

                                    return (
                                        <div
                                            key={team.id}
                                            className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <span className="text-base">👥</span>
                                                <span className="text-sm text-gray-900">
                                                    {team.name}
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemoveTeam(team.id!);
                                                }}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2 shrink-0 h-7 w-7 p-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Whiteboard Privacy Section */}
                <div className="border border-gray-200 border-l-4 border-l-black rounded-lg p-5 bg-[#F2F2F7]">
                    <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Whiteboard privacy</h3>
                            <p className="text-xs text-gray-600 mb-4">
                                This whiteboard's visibility is managed automatically. If it isn't linked to anything, it follows workspace-level access. Once linked, only members of the selected Portfolio, Project, or Team will have access.
                            </p>
                        </div>

                        <div className="w-80">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user?.profilePictureUrl || ""} alt={user?.name || "User"} />
                                        <AvatarFallback className="bg-[#FF6B35] text-white text-sm">
                                            {user?.name?.charAt(0)?.toUpperCase() || "R"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm text-gray-900">{user?.name || "Rahul Mondal"}</p>
                                        <p className="text-xs text-gray-500">{user?.email || "name@email.com"}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 font-medium">Admin</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 px-12">
                <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="h-10"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleCreateWhiteboard}
                    disabled={!isFormValid()}
                    className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white disabled:bg-gray-300 disabled:cursor-not-allowed h-10"
                >
                    Create Whiteboard
                </Button>
            </div>
        </div>
    );
}