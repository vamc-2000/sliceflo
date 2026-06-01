"use client";

import React, { useState } from "react";
import {
    Search,
    Plus,

    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    Settings,
    Bell,
    ChartNoAxesColumn,
    History,
    MoreHorizontal,
    Edit,
    Copy,
    BookTemplate,
    Trash,
    Trash2,
    LayoutTemplate,
} from "lucide-react";
import { GrTemplate } from "react-icons/gr";
import { Automation } from "@/types/automation.types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MoreVertical, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { categories, integrations, templateSets } from "./data";
import RunHistory from "@/components/automations/RunHistory";
import { useAutomationStore } from "@/stores/automation-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";


// const AutomationsPage = ({ projectId = "default-project" }: { projectId?: string }) => {

const AutomationsPage = () => {
    const searchParams = useSearchParams();
    const projectId = searchParams.get("projectId") ?? "default-project";

    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState("Explore");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<"templates" | "manage">("templates");

    // Use automation store
    const {
        automations,
        createAutomation,
        updateAutomation,
        duplicateAutomation,
        toggleAutomation,
        deleteAutomation
    } = useAutomationStore();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newAutomationName, setNewAutomationName] = useState("");
    const [projectFilter, setProjectFilter] = useState("All Projects");
    const [currentView, setCurrentView] = useState<"list" | "history">("list");

    // Use projects store
    const { projects, fetchProjects } = useProjectsStore();

    // Fetch projects on mount
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Edit dialog state
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingAutomation, setEditingAutomation] = useState<{ id: string; name: string } | null>(null);

    const handleCreateAutomation = () => {
        if (!newAutomationName.trim()) return;

        // Use a valid project if "default-project" is passed
        const activeProjectId = (projectId === "default-project" && projects.length > 0
            ? (projects[0].id ?? "default-project")
            : projectId) as string;

        createAutomation(activeProjectId, {
            name: newAutomationName,
            project: projects.find(p => p.id === activeProjectId)?.name || "Project A",
            projectId: activeProjectId,
            description: "When an item is created set Due date to",
            owner: {
                name: "User",
                avatar: "/images/avatar-placeholder.png"
            },
            isActive: true,
            trigger: "TASK_CREATED",
            conditions: [],
            actions: []
        });

        setNewAutomationName("");
        setIsCreateDialogOpen(false);
        setActiveTab("manage");
    };

    const handleEditAutomation = () => {
        if (!editingAutomation || !editingAutomation.name.trim()) return;

        updateAutomation(projectId, editingAutomation.id, {
            name: editingAutomation.name
        });

        setEditingAutomation(null);
        setIsEditDialogOpen(false);
    };

    const handleDuplicateAutomation = (id: string) => {
        duplicateAutomation(projectId, id);
    };

    // Filter automations by selected project
    const filteredAutomations = projectFilter === "All Projects"
        ? automations
        : automations.filter(automation => automation.project === projectFilter);


    const renderCards = () => {
        const currentTemplates = templateSets[activeCategory] || [];

        return (
            <>
                {/* Create New Card */}
                <Card
                    onClick={() => router.push("/automations/create")}
                    className="border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer h-[380px] flex flex-col bg-white overflow-hidden group"
                >
                    <CardContent className="p-8 flex-1 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 flex items-center justify-center mb-2">
                            <Plus className="w-8 h-8 text-gray-400 font-light" />
                        </div>
                        <span className="text-gray-500 font-medium text-lg mb-8">Create new</span>
                        <div className="mt-auto w-full pt-8">
                            <Button
                                variant="outline"
                                className="w-full border-gray-200 text-gray-500 text-[11px] font-medium py-6 rounded-lg uppercase tracking-wider hover:bg-gray-50 shadow-sm"
                            >
                                Start from scratch
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Automation Templates */}
                {currentTemplates.map((template, idx) => (
                    <Card
                        key={idx}
                        onClick={() => router.push(`/automations/${template.id}`)}
                        className="border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer h-[380px] flex flex-col bg-white overflow-hidden"
                    >
                        <CardContent className="p-8 flex-1 flex flex-col">
                            <div className="mb-8">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border border-gray-50 bg-white">
                                    {(template.icon.startsWith("/") || template.icon.includes(".")) ? (
                                        <div className="w-full h-full flex items-center justify-center p-0">
                                            <Image
                                                src={template.icon.startsWith("/") ? template.icon : `/${template.icon}`}
                                                width={64}
                                                height={64}
                                                alt="icon"
                                                className="object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <svg width="40" height="40" viewBox="0 0 100 100">
                                            <path d="M50 0 L100 50 L50 100 L0 50 Z" fill={template.color} />
                                            <text x="50" y="65" textAnchor="middle" fill="white" fontSize="40" fontWeight="bold" className="italic">{template.icon}</text>
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-[22px] text-gray-800 leading-tight">
                                    {template.text[0]}<span className="font-semibold italic">{template.text[1]}</span>{template.text[2]}<strong className="font-extrabold text-black">{template.text[3]}</strong>
                                </h3>
                            </div>
                            <div className="mt-auto pt-8">
                                <Button variant="outline" className="w-full border-gray-200 text-gray-500 text-[11px] font-medium py-6 rounded-lg uppercase tracking-wider hover:bg-gray-50 shadow-sm">
                                    Use as template
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Filling the rest with placeholder cards that also show the button */}
                {Array.from({ length: Math.max(0, 8 - currentTemplates.length) }).map((_, i) => (
                    <Card key={`empty-${i}`} className="border border-gray-100 rounded-2xl shadow-sm h-[380px] bg-white/40 flex flex-col overflow-hidden">
                        <CardContent className="p-8 flex-1 flex flex-col opacity-40">
                            <div className="mb-8">
                                <div className="w-16 h-16 rounded-full border border-gray-100 bg-gray-50/50" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-6 w-3/4 bg-gray-100 rounded-md" />
                                <div className="h-6 w-1/2 bg-gray-100 rounded-md" />
                            </div>
                            <div className="mt-auto pt-8">
                                <Button variant="outline" disabled className="w-full border-gray-200 text-gray-400 text-[11px] font-medium py-6 rounded-lg uppercase tracking-wider">
                                    Use as template
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-10 py-2 bg-white border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold text-gray-800">Automation Hub</h1>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className={`bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? "w-[60px]" : "w-60"}`}>
                    <div className={`px-4 py-6 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} relative h-[76px]`}>
                        {!isSidebarCollapsed && <span className="text-lg font-semibold text-gray-900 truncate">Categories</span>}
                        <div
                            className={`cursor-pointer text-blue-900 hover:text-blue-700 transition-colors flex items-center justify-center ${isSidebarCollapsed ? "" : ""}`}
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        >
                            {isSidebarCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
                        </div>
                    </div>

                    {!isSidebarCollapsed ? (
                        <ScrollArea className="flex-1 px-1">
                            <div className="space-y-0.5 py-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.name}
                                        onClick={() => setActiveCategory(cat.name)}
                                        className={`w-full text-left px-5 py-2.5 text-[13px] transition-colors rounded-sm truncate ${activeCategory === cat.name
                                            ? "text-gray-900 font-medium bg-gray-50"
                                            : "text-gray-600 hover:bg-gray-50/50"
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex-1" />
                    )}

                    <div className="p-4 overflow-hidden">
                        <Button variant="default" className={`bg-[#001F3F] text-white hover:bg-[#002F5F] text-[13px] font-medium py-6 rounded-md shadow-md transition-all ${isSidebarCollapsed ? "px-0 w-full flex justify-center" : "w-full"}`}>
                            {isSidebarCollapsed ? "80" : "Integrations / 80"}
                        </Button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
                    <div className="px-4 py-6 overflow-y-auto h-full">
                        {/* Tabs - Persistent */}
                        <div className="flex items-center justify-between mb-5 border-b border-gray-100">
                            <div className="flex gap-8 ">
                                <button
                                    onClick={() => setActiveTab("templates")}
                                    className={`pb-4 text-[13px] font-semibold ${activeTab === "templates"
                                        ? "border-b-2 border-blue-900 text-gray-900"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    Automation Templates
                                </button>
                                <button
                                    onClick={() => setActiveTab("manage")}
                                    className={`pb-4 text-[13px] font-semibold ${activeTab === "manage"
                                        ? "border-b-2 border-blue-900 text-gray-900"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    Manage Automations / {automations.length}
                                </button>
                            </div>
                            {activeTab === "manage" && automations.length > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            className="bg-[#001F3F] text-white hover:bg-[#002F5F] text-[13px] font-semibold pl-4 pr-2 py-2 rounded-lg shadow-md mb-1 flex items-center gap-1"
                                        >
                                            Create automation
                                            <div className="h-9 w-[2px] bg-white/60 mx-2" />
                                            <ChevronDown className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[200px]">
                                        <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
                                            Create from scratch
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setActiveTab("templates")}>
                                            Create from templates
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>


                        {activeTab === "templates" ? (
                            <>
                                {/* Search & Header - Dynamic Name */}
                                <div className="flex items-center justify-between mb-7">
                                    <h2 className="text-xl font-semibold text-gray-900">{activeCategory}</h2>
                                    <div className="relative w-80">
                                        <Input
                                            placeholder="Search"
                                            className="pl-4 pr-10 py-5 bg-white border-gray-200 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-blue-100"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 font-light" />
                                    </div>
                                </div>

                                {/* Integration Quick Filters - Persistent */}
                                <div className="grid grid-cols-4 md:grid-cols-4 gap-4 mb-10">
                                    {integrations.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`rounded-lg p-5 flex items-center justify-center cursor-pointer shadow-sm h-[60px] transition-all hover:brightness-105 ${item.isHighlighted ? "bg-opacity-100" : "bg-white border border-gray-100"}`}
                                            style={{ backgroundColor: item.isHighlighted ? item.color : undefined }}
                                        >
                                            <div className="flex items-center">
                                                <Image src={item.icon} width={24} height={24} alt={item.name} className="brightness-0 invert mr-2" />
                                                <span className="text-white text-[13px] font-semibold tracking-tight">{item.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Automation Templates Grid - Dynamic Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                                    {renderCards()}
                                </div>
                            </>
                        ) : (
                            // Manage Automations Tab Content
                            <div className="h-full">
                                {currentView === "history" ? (
                                    <RunHistory onBack={() => setCurrentView("list")} />
                                ) : filteredAutomations.length > 0 ? (
                                    <>
                                        {/* Filter Controls */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                {/* Project Dropdown */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="border-gray-200 text-gray-600 text-[13px] font-normal px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                                        >
                                                            {projectFilter}
                                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-[200px]">
                                                        <DropdownMenuItem onClick={() => setProjectFilter("All Projects")}>
                                                            All Projects
                                                        </DropdownMenuItem>
                                                        {projects.map((project) => (
                                                            <DropdownMenuItem
                                                                key={project.id}
                                                                onClick={() => setProjectFilter(project.name)}
                                                            >
                                                                {project.name}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                {/* Show all Dropdown */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="border-gray-200 text-gray-600 text-[13px] font-normal px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                                        >
                                                            Show all
                                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start">
                                                        <DropdownMenuItem>Show all</DropdownMenuItem>
                                                        <DropdownMenuItem>Active only</DropdownMenuItem>
                                                        <DropdownMenuItem>Inactive only</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Automation Usage Button */}
                                                <Button
                                                    variant="outline"
                                                    className="border-gray-200 bg-[#E5E5EA] text-[#8E8E93] text-[13px] font-normal px-4 py-2 rounded-lg hover:bg-[#8E8E93] flex items-center gap-2"
                                                >
                                                    <ChartNoAxesColumn className="w-4 h-4" />
                                                    Automation Usage
                                                </Button>

                                                {/* Run History Button */}
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        console.log("Global Run History clicked");
                                                        setCurrentView("history");
                                                    }}
                                                    className="border-gray-200 bg-[#E5E5EA] text-[#8E8E93] text-[13px] font-normal px-4 py-2 rounded-lg hover:bg-[#8E8E93] flex items-center gap-2"
                                                >
                                                    <History className="w-4 h-4" />
                                                    Run History
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Automations List */}
                                        <div className="space-y-2">
                                            {filteredAutomations.map((automation, index) => (
                                                <div
                                                    key={automation.id!}
                                                    onClick={() => router.push(`/automations/${automation.id!}`)}
                                                    className="flex items-center gap-6 px-5 py-3 border border-gray-200 border-l-[6px] border-l-[#001F3F] bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                                >
                                                    {/* Toggle Switch */}
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <Switch
                                                            checked={automation.isActive}
                                                            onCheckedChange={() => toggleAutomation(projectId, automation.id!)}
                                                            className="data-[state=checked]:bg-[#001F3F]"
                                                        />
                                                    </div>

                                                    {/* Automation Info */}
                                                    <div className="flex-1">
                                                        <h3 className="text-[15px] font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                                            {automation.name}
                                                        </h3>
                                                        <p className="text-[13px] text-gray-700 mb-0.5">
                                                            {automation.project}
                                                        </p>
                                                        <p className="text-[13px] text-gray-600">
                                                            {automation.description}
                                                        </p>
                                                    </div>

                                                    {/* Last Updated */}
                                                    <div className="text-right">
                                                        <p className="text-[11px] text-gray-400 mb-1">Last updated</p>
                                                        <p className="text-[12px] text-gray-700">{automation.lastUpdated}</p>
                                                    </div>

                                                    {/* Owner */}
                                                    <div className="text-right flex items-center gap-2">
                                                        <div>
                                                            <p className="text-[11px] text-gray-400 mb-1">Owner</p>
                                                        </div>
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarImage src={automation.owner?.avatar} />
                                                            <AvatarFallback className="bg-blue-900 text-white text-xs">
                                                                {automation.owner?.name?.charAt(0) || "U"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </div>

                                                    {/* Menu */}
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="p-3"
                                                                    title="More options"
                                                                >
                                                                    <MoreHorizontal className="w-4 h-4 text-gray-600" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-[200px]">
                                                                <DropdownMenuItem onSelect={() => router.push(`/automations/${automation.id!}`)}>
                                                                    <Edit className="w-4 h-4 mr-2" />
                                                                    <span>Edit Editor</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => {
                                                                    setEditingAutomation({ id: automation.id!, name: automation.name });
                                                                    setIsEditDialogOpen(true);
                                                                }}>
                                                                    <Edit className="w-4 h-4 mr-2 opacity-50" />
                                                                    <span>Rename</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => handleDuplicateAutomation(automation.id!)}>
                                                                    <Copy className="w-4 h-4 mr-2" />
                                                                    <span>Duplicate</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem >
                                                                    <GrTemplate className="w-4 h-4 mr-2" />
                                                                    <span>Save as template</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => {
                                                                    console.log("Dropdown Run history selected");
                                                                    setCurrentView("history");
                                                                }}>
                                                                    <History className="w-4 h-4 mr-2" />
                                                                    <span>Run history</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onSelect={() => deleteAutomation(projectId, automation.id!)}
                                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    <span>Delete</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    // Empty State
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <h2 className="text-[28px] font-semibold text-gray-900 ">
                                            Create you personalized automation to save time
                                        </h2>
                                        <p className="text-gray-500 text-[15px] mb-10">
                                            You can also explore pre-built automation templates.
                                        </p>

                                        <div className="mb-10 relative w-[300px] h-[300px]">
                                            <Image
                                                src="/images/Robotface.svg"
                                                alt="Robot automation"
                                                width={300}
                                                height={300}
                                                className="object-contain"
                                            />
                                        </div>

                                        <Button
                                            onClick={() => setIsCreateDialogOpen(true)}
                                            className="bg-[#001F3F] text-white hover:bg-[#002F5F] px-10 py-6 text-[14px] font-semibold rounded-lg shadow-md"
                                        >
                                            Create automation
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Create Automation Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
                    <DialogHeader className="px-8 pt-8 pb-4 bg-white">
                        <DialogTitle className="text-xl font-bold text-gray-900">Create New Automation</DialogTitle>
                        <p className="text-[13px] text-gray-500 mt-1">
                            Give your automation a name to get started. You can change this later.
                        </p>
                    </DialogHeader>
                    <div className="px-8 py-2">
                        <Label htmlFor="automation-name" className="text-[13px] font-semibold text-gray-700 mb-2 block uppercase tracking-wide">
                            Automation Name
                        </Label>
                        <Input
                            id="automation-name"
                            placeholder="e.g., Weekly Report Notification"
                            value={newAutomationName}
                            onChange={(e) => setNewAutomationName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newAutomationName.trim()) {
                                    handleCreateAutomation();
                                }
                            }}
                            className="w-full h-11 px-4 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-[15px]"
                        />
                    </div>
                    <DialogFooter className="px-8 py-6 bg-gray-50/50 flex items-center gap-3 mt-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsCreateDialogOpen(false);
                                setNewAutomationName("");
                            }}
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateAutomation}
                            disabled={!newAutomationName.trim()}
                            className="bg-[#001F3F] text-white hover:bg-[#003366] shadow-lg shadow-blue-900/10 px-6 h-10 rounded-lg transition-all"
                        >
                            Create Automation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Automation Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
                    <DialogHeader className="px-8 pt-8 pb-4 bg-white">
                        <DialogTitle className="text-xl font-bold text-gray-900">
                            Edit Automation
                        </DialogTitle>
                        <p className="text-[13px] text-gray-500 mt-1">
                            Update the name of your automation.
                        </p>
                    </DialogHeader>
                    <div className="px-8 py-2">
                        <Label htmlFor="edit-automation-name" className="text-[13px] font-semibold text-gray-700 mb-2 block uppercase tracking-wide">
                            Automation Name
                        </Label>
                        <Input
                            id="edit-automation-name"
                            placeholder="Enter automation name"
                            value={editingAutomation?.name || ""}
                            onChange={(e) => setEditingAutomation(
                                editingAutomation
                                    ? { ...editingAutomation, name: e.target.value }
                                    : null
                            )}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && editingAutomation?.name.trim()) {
                                    handleEditAutomation();
                                }
                            }}
                            className="w-full h-11 px-4 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-[15px]"
                        />
                    </div>
                    <DialogFooter className="px-8 py-6 bg-gray-50/50 flex items-center gap-3 mt-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsEditDialogOpen(false);
                                setEditingAutomation(null);
                            }}
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditAutomation}
                            disabled={!editingAutomation?.name.trim()}
                            className="bg-[#001F3F] text-white hover:bg-[#003366] shadow-lg shadow-blue-900/10 px-6 h-10 rounded-lg transition-all"
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AutomationsPage;
