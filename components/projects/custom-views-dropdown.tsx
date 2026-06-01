// components/projects/custom-views-dropdown.tsx

"use client";

import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    FileText,
    Paperclip,
    StickyNote,
    ListTree,
    Presentation,
    MessageSquare,
    Star,
    Users,
    MessageCircle,
    Palette,
    FolderOpen,
    ListTodo,
    Video,
    ChevronDown,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectsStore } from "@/stores/projects-store";

interface CustomViewsDropdownProps {
    onAdd: (name: string, type: string, iconName: string) => void;
    projectId: string;
}

const POPULAR_VIEWS = [
    { id: "form", name: "Form", icon: FileText, iconName: "FileText" },
    { id: "attachments", name: "Attachments", icon: Paperclip, iconName: "Paperclip" },
    { id: "notes", name: "Notes", icon: StickyNote, iconName: "StickyNote" },
    { id: "listTree", name: "ListTree", icon: ListTree, iconName: "ListTree" },
    { id: "whiteboard", name: "Whiteboard", icon: Presentation, iconName: "Presentation" },
    { id: "discussions", name: "Discussions", icon: MessageSquare, iconName: "MessageSquare" },
];

// const EMBED_VIEWS = [
//     { id: "featured", name: "Featured", icon: Star, iconName: "Star" },
//     { id: "calendar-embed", name: "Calendar", icon: Calendar, iconName: "Calendar" },
//     { id: "collaboration", name: "Collaboration", icon: Users, iconName: "Users" },
//     { id: "communication", name: "Communication", icon: MessageCircle, iconName: "MessageCircle" },
//     { id: "design", name: "Design", icon: Palette, iconName: "Palette" },
//     { id: "file-storage", name: "File Storage", icon: FolderOpen, iconName: "FolderOpen" },
//     { id: "productivity", name: "Productivity", icon: ListTodo, iconName: "ListTodo" },
//     { id: "video", name: "Video", icon: Video, iconName: "Video" },
// ];

export function CustomViewsDropdown({ onAdd, projectId }: CustomViewsDropdownProps) {
    const [open, setOpen] = useState(false);
    const { customViews } = useProjectsStore();

    // Get the current custom view for this project
    const currentCustomView = customViews.find(
        (view) => view.projectId === projectId
    );

    const handleViewClick = (viewType: string, viewName: string, iconName: string) => {
        onAdd(viewName, viewType, iconName);
        setOpen(false);
    };

    // Check if a view is currently selected
    const isViewSelected = (viewName: string) => {
        return currentCustomView?.name === viewName;
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 h-8 rounded text-xs text-muted-foreground bg-background hover:bg-muted hover:text-foreground">
                    More
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[320px] p-2 border-b-[5px] border-b-primary bg-popover">
                <Tabs defaultValue="popular" className="w-full">
                    {/* <TabsList className="w-full grid grid-cols-2 rounded p-0"> */}
                    <TabsList className="w-full rounded p-0">
                        <TabsTrigger
                            value="popular"
                            className="rounded text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                            Popular
                        </TabsTrigger>
                        {/* <TabsTrigger
                            value="embeds"
                            className="rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                            Embeds
                        </TabsTrigger> */}
                    </TabsList>

                    {/* Popular Views Tab */}
                    <TabsContent value="popular" className="p-2 mt-0">
                        <div className="grid grid-cols-2 gap-1">
                            {POPULAR_VIEWS.map((view) => {
                                const Icon = view.icon;
                                const isSelected = isViewSelected(view.name);
                                return (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        key={view.id}
                                        onClick={() => handleViewClick(view.id, view.name, view.iconName)}
                                        disabled={isSelected}
                                        className="flex justify-start items-center gap-2 p-1.5 transition-colors text-left h-auto"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                            <Icon className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <span className="text-xs font-medium text-foreground">
                                            {view.name}
                                        </span>
                                    </Button>
                                );
                            })}
                        </div>
                    </TabsContent>

                    {/* Embeds Tab */}
                    {/* <TabsContent value="embeds" className="p-2 mt-0">
                        <div className="grid grid-cols-2 gap-2">
                            {EMBED_VIEWS.map((view) => {
                                const Icon = view.icon;
                                const isSelected = isViewSelected(view.name);
                                return (
                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        key={view.id}
                                        onClick={() => handleViewClick(view.id, view.name, view.iconName)}
                                        disabled={isSelected}
                                        className="flex justify-start items-center gap-3 p-3 transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <span className="text-xs font-medium text-foreground">
                                            {view.name}
                                        </span>
                                    </Button>
                                );
                            })}
                        </div>
                    </TabsContent> */}
                </Tabs>
            </DropdownMenuContent>
        </DropdownMenu >
    );
}
