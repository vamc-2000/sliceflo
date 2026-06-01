// components/portfolios/portfolio-custom-views-dropdown.tsx

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
    ChevronDown,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePortfoliosStore } from "@/stores/portfolios-store";

interface Props {
    onAdd: (name: string, type: string, iconName: string) => void;
    portfolioId: string;
}

const POPULAR_VIEWS = [
    { id: "form", name: "Form", icon: FileText, iconName: "FileText" },
    { id: "attachments", name: "Attachments", icon: Paperclip, iconName: "Paperclip" },
    { id: "notes", name: "Notes", icon: StickyNote, iconName: "StickyNote" },
    { id: "listTree", name: "ListTree", icon: ListTree, iconName: "ListTree" },
    { id: "whiteboard", name: "Whiteboard", icon: Presentation, iconName: "Presentation" },
    { id: "discussions", name: "Discussions", icon: MessageSquare, iconName: "MessageSquare" },
];

export function PortfolioCustomViewsDropdown({ onAdd, portfolioId }: Props) {
    const [open, setOpen] = useState(false);
    const { customViews } = usePortfoliosStore();

    // Get the current custom view for this portfolio
    const currentCustomView = customViews.find(
        (view) => view.projectId === portfolioId // Reusing projectId field for portfolioId in common View interface
    );

    const handleViewClick = (viewType: string, viewName: string, iconName: string) => {
        onAdd(viewName, viewType, iconName);
        setOpen(false);
    };

    const isViewSelected = (viewName: string) => {
        return currentCustomView?.name === viewName;
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 h-9 rounded text-gray-600 bg-background hover:bg-gray-100">
                    More
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[400px] p-2">
                <Tabs defaultValue="popular" className="w-full">
                    <TabsList className="w-full rounded p-0">
                        <TabsTrigger
                            value="popular"
                            className="rounded data-[state=active]:bg-[#001F3F] data-[state=active]:text-background"
                        >
                            Popular
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="popular" className="p-2 mt-0">
                        <div className="grid grid-cols-2 gap-2">
                            {POPULAR_VIEWS.map((view) => {
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
                                        <div className="w-8 h-8 rounded-full bg-muted-foreground/30 flex items-center justify-center flex-shrink-0">
                                            <Icon className="h-4 w-4 text-gray-600" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">
                                            {view.name}
                                        </span>
                                    </Button>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
