// @ts-nocheck
"use client";

import { useState } from "react";
import { X, Link as LinkIcon, FileText, Unlink } from "lucide-react";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { useDocStore } from "@/stores/useDoc-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useTeamStore } from "@/stores/teams-store";
import { usePortfoliosStore } from "@/stores/portfolios-store";

interface PageDetailsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentTitle: string;
    documentId: string;
}

export function PageDetailsPanel({ isOpen, onClose, currentTitle, documentId }: PageDetailsPanelProps) {
    const { getDocument, documents, activeDetailsTab, setDetailsTab } = useDocStore();
    const { projects } = useProjectsStore();
    const { teams } = useTeamStore();
    const { portfolios } = usePortfoliosStore();

    const document = getDocument(documentId);

    let rootDoc = document;
    while (rootDoc?.parentId) {
        rootDoc = getDocument(rootDoc.parentId);
    }

    const [selectedFont, setSelectedFont] = useState("default");
    const [fontSize, setFontSize] = useState(2);

    const linkedProjects = rootDoc?.linkedProjects?.map(projectId =>
        projects.find(p => p.id === projectId)
    ).filter(Boolean) || [];

    const linkedPortfolios = rootDoc?.linkedPortfolios?.map(id =>
        portfolios.find(p => p.id === id)
    ).filter(Boolean) || [];

    const linkedDocuments = rootDoc?.linkedDocuments?.map(id =>
        documents.get(id)
    ).filter(Boolean) || [];

    const linkedTeams = rootDoc?.linkedTeams?.map(teamId =>
        teams.find(t => t.id === teamId)
    ).filter(Boolean) || [];

    const pageLinkedProjects = document?.pageLinkedProjects?.map(projectId =>
        projects.find(p => p.id === projectId)
    ).filter(Boolean) || [];

    const pageLinkedTeams = document?.pageLinkedTeams?.map(teamId =>
        teams.find(t => t.id === teamId)
    ).filter(Boolean) || [];

    const pageLinkedPortfolios = document?.pageLinkedPortfolios?.map(id =>
        portfolios.find(p => p.id === id)
    ).filter(Boolean) || [];

    const pageLinkedDocuments = document?.pageLinkedDocuments?.map(id =>
        documents.get(id)
    ).filter(Boolean) || [];


    return (
        <div className="h-full w-full bg-white border-l border-gray-200 flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 flex-shrink-0 bg-white border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 truncate pr-8">
                    {currentTitle}
                </h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 absolute right-2 top-2"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                    {/* Relationships Section */}
                    <div className="space-y-6">
                        <h3 className="text-gray-500 font-medium text-sm">Relationships</h3>

                        {/* Document Links - Always show header */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-gray-900">Document links</Label>
                                <span className="bg-[#fdf2e9] text-[#F68C1F] border border-[#F68C1F] min-w-[18px] h-[18px] flex items-center justify-center rounded-sm text-[10px] font-bold px-1">
                                    {linkedProjects.length + linkedTeams.length + linkedPortfolios.length + linkedDocuments.length}
                                </span>
                            </div>

                            {/* Show linked projects and teams as list */}
                            {(linkedProjects.length > 0 || linkedTeams.length > 0 || linkedPortfolios.length > 0 || linkedDocuments.length > 0) ? (
                                <div className="space-y-2 pl-1">
                                    {/* Projects */}
                                    {linkedProjects.map((project) => (
                                        <div key={project.id} className="flex items-center gap-2 text-gray-500">
                                            <span className="text-sm">📦</span>
                                            <span className="text-sm text-gray-600">{project.name}</span>
                                        </div>
                                    ))}

                                    {/* Portfolios */}
                                    {linkedPortfolios.map((portfolio) => (
                                        <div key={portfolio.id} className="flex items-center gap-2 text-gray-500">
                                            <span className="text-sm">📂</span>
                                            <span className="text-sm text-gray-600">{portfolio.name}</span>
                                        </div>
                                    ))}

                                    {/* Teams */}
                                    {linkedTeams.map((team) => (
                                        <div key={team.id} className="flex items-center gap-2 text-gray-500">
                                            <span className="text-xs">👥</span>
                                            <span className="text-sm text-gray-600">{team.name}</span>
                                        </div>
                                    ))}

                                    {/* Documents */}
                                    {linkedDocuments.map((doc) => (
                                        <div key={doc.id} className="flex items-center gap-2 text-gray-500">
                                            <span className="text-sm">📄</span>
                                            <span className="text-sm text-gray-600">{doc.title}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400 italic pl-1">No document links</div>
                            )}
                        </div>

                        {/* Page Links - Always show header */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-gray-900">Page links</Label>
                                <span className="bg-[#fdf2e9] text-[#F68C1F] border border-[#F68C1F] min-w-[18px] h-[18px] flex items-center justify-center rounded-sm text-[10px] font-bold px-1">
                                    {pageLinkedProjects.length + pageLinkedTeams.length + pageLinkedPortfolios.length + pageLinkedDocuments.length}
                                </span>
                            </div>

                            {/* Show page linked projects and teams */}
                            {(pageLinkedProjects.length > 0 || pageLinkedTeams.length > 0 || pageLinkedPortfolios.length > 0 || pageLinkedDocuments.length > 0) ? (
                                <div className="space-y-2 pl-1">
                                    {/* Projects */}
                                    {pageLinkedProjects.map((project) => (
                                        <div key={project.id} className="flex items-center gap-2 text-gray-500">
                                            <span className="text-sm">📦</span>
                                            <span className="text-sm text-gray-600">{project.name}</span>
                                        </div>
                                    ))}

                                    {/* Portfolios */}
                                    {pageLinkedPortfolios.map((portfolio) => (
                                        <div key={portfolio.id} className="flex items-center gap-2 text-gray-500">
                                            <span className="text-sm">📂</span>
                                            <span className="text-sm text-gray-600">{portfolio.name}</span>
                                        </div>
                                    ))}

                                    {/* Teams */}
                                    {pageLinkedTeams.map((team) => (
                                        <div key={team.id} className="flex items-center gap-2 text-gray-500">
                                            <span className="text-xs">👥</span>
                                            <span className="text-sm text-gray-600">{team.name}</span>
                                        </div>
                                    ))}

                                    {/* Documents */}
                                    {pageLinkedDocuments.map((doc) => (
                                        <div key={doc.id} className="flex items-center gap-2 text-gray-500">
                                            <span className="text-sm">📄</span>
                                            <span className="text-sm text-gray-600">{doc.title}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400 italic pl-1">No page links</div>
                            )}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
