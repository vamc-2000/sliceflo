"use client";

import React, { useEffect, useState } from 'react';
import { X, Search, Zap, CheckCircle2, GitBranch, Layout, Plus, Edit3, RefreshCw, AlertTriangle, Calendar, UserPlus, ListPlus, Eye, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAutomationStore } from "@/stores/automation-store";
import { NodeTemplate } from './AddNodeMenu';

interface LibrarySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template: NodeTemplate) => void;
    typeFilter?: 'trigger' | 'action' | 'condition' | 'delay' | 'wait' | 'all';
}

const LibrarySidebar = ({ isOpen, onClose, onSelect, typeFilter = 'all' }: LibrarySidebarProps) => {
    const { triggerOptions, actionOptions, conditionTypes, fetchMetadata } = useAutomationStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(() => {
        if (typeFilter === 'trigger') return 'Triggers';
        if (typeFilter === 'action') return 'Actions';
        if (typeFilter === 'condition') return 'Conditions';
        return 'All';
    });

    useEffect(() => {
        if (!triggerOptions?.length || !actionOptions?.length || !conditionTypes?.length) {
            fetchMetadata();
        }
    }, [triggerOptions, actionOptions, conditionTypes, fetchMetadata]);

    // Also update activeTab if typeFilter prop changes externally
    useEffect(() => {
        if (typeFilter === 'trigger') setActiveTab('Triggers');
        else if (typeFilter === 'action') setActiveTab('Actions');
        else if (typeFilter === 'condition') setActiveTab('Conditions');
        else setActiveTab('All');
    }, [typeFilter]);

    if (!isOpen) return null;

    const allTemplates: NodeTemplate[] = [
        ...(triggerOptions ?? []).map((t) => {
            const getIcon = (id: string) => {
                switch (id) {
                    case 'TASK_CREATED': return <Plus className="w-4 h-4" />;
                    case 'TASK_UPDATED': return <Edit3 className="w-4 h-4" />;
                    case 'STATUS_CHANGED': return <RefreshCw className="w-4 h-4" />;
                    case 'STATUS_CHANGED_TO': return <CheckCircle2 className="w-4 h-4" />;
                    case 'PRIORITY_CHANGED': return <AlertTriangle className="w-4 h-4" />;
                    case 'DUE_DATE_CHANGED': return <Calendar className="w-4 h-4" />;
                    case 'ASSIGNEE_CHANGED': return <UserPlus className="w-4 h-4" />;
                    case 'SUBTASK_CREATED': return <ListPlus className="w-4 h-4" />;
                    case 'WATCHER_ADDED': return <Eye className="w-4 h-4" />;
                    default: return <Zap className="w-4 h-4" />;
                }
            };
            return {
                type: "trigger" as const,
                apiId: t.id,
                label: t.label,
                description: `Trigger: ${t.category}`,
                icon: getIcon(t.id),
                color: "#00CA72",
            };
        }),
        ...(actionOptions ?? []).map((a) => ({
            type: a.hasBranch ? ("condition" as const) : ("action" as const),
            apiId: a.id,
            label: a.label,
            description: a.hasBranch ? "Branch action" : "Action step",
            icon: a.hasBranch
                ? <GitBranch className="w-4 h-4" />
                : <CheckCircle2 className="w-4 h-4" />,
            color: a.hasBranch ? "#F97316" : "#0073EA",
        })),
        {
            type: "condition" as const,
            apiId: "IF_ELSE",
            label: "If / Else Condition",
            description: "Branch your workflow based on a condition",
            icon: <GitBranch className="w-4 h-4" />,
            color: "#F97316",
        },
        ...(conditionTypes ?? []).map((c) => ({
            type: "condition" as const,
            apiId: c.id,
            label: c.label,
            description: "Check if logic is met",
            icon: <GitBranch className="w-4 h-4" />,
            color: "#F97316",
        })),
    ];

    const filteredTemplates = allTemplates.filter(t => {
        const matchesSearch = t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());

        // Strict prop-level filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;

        // Tab-level filter
        if (activeTab === 'Triggers') return t.type === 'trigger' && matchesSearch;
        if (activeTab === 'Actions') return t.type === 'action' && matchesSearch;
        if (activeTab === 'Conditions') return t.type === 'condition' && matchesSearch;

        return matchesSearch;
    });

    const tabs = typeFilter === 'all'
        ? ['All', 'Triggers', 'Actions', 'Conditions']
        : []; // Hide tabs if we are in a specific mode

    const handleSelect = (template: NodeTemplate) => {
        onSelect(template);
        onClose();
    };

    return (
        <div className="w-[320px] h-fit max-h-[800px] bg-white shadow-xl flex flex-col border border-gray-100 rounded-2xl overflow-hidden shrink-0 z-30 pointer-events-auto">
            {/* Header */}
            <header className="px-5 py-3 flex items-start justify-between bg-white shrink-0 border-b border-gray-50/50">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#001F3F] flex items-center justify-center text-white shadow-md shadow-blue-100/50">
                        <Layout className="w-5 h-5 text-white" />
                    </div>
                    <div className="pt-0.5">
                        <h2 className="text-base font-semibold text-gray-900 leading-tight">Automation Library</h2>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                            Browse and select automation steps
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="rounded-full w-8 h-8 hover:bg-gray-50 -mt-0.5 -mr-1.5 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-5 h-5" />
                </Button>
            </header>

            {/* Search */}
            <div className="px-5 py-4 border-b border-gray-50/50 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for triggers or actions..."
                        className="w-full h-11 pl-10 pr-4 bg-gray-50/50 border-gray-100 rounded-xl text-sm font-medium placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                        autoFocus
                    />
                </div>
            </div>

            {/* Tabs */}
            {tabs.length > 0 && (
                <div className="px-5 py-2 border-b border-gray-50/50 flex gap-1.5 overflow-x-auto shrink-0 bg-white">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1.5 text-[12px] font-bold rounded-lg whitespace-nowrap transition-all ${activeTab === tab
                                ? 'bg-blue-50 text-[#0073EA]'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            )}

            {/* Content Area - Scrollable */}
            <ScrollArea className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-2">
                    {filteredTemplates.length > 0 ? (
                        filteredTemplates.map((template, index) => (
                            <button
                                key={`${template.apiId}-${index}`}
                                onClick={() => handleSelect(template)}
                                className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-blue-50/30 transition-all duration-200 group text-left border border-transparent hover:border-blue-100"
                            >
                                <div
                                    className="w-11 h-11 flex items-center justify-center shrink-0 rounded-xl shadow-sm transition-all group-hover:scale-105"
                                    style={{ backgroundColor: `${template.color}15`, color: template.color }}
                                >
                                    {template.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-[14px] font-bold text-gray-700 group-hover:text-gray-900 leading-tight truncate">
                                            {template.label}
                                        </p>
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-400">
                                            {template.type}
                                        </span>
                                    </div>
                                    <p className="text-[12px] text-gray-400 font-medium truncate">
                                        {template.description}
                                    </p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-gray-200" />
                            </div>
                            <h3 className="text-gray-900 font-bold mb-1">No results found</h3>
                            <p className="text-gray-400 text-sm">Try adjusting your search or filters to find what you're looking for.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-5 border-t border-gray-50 shrink-0 bg-gray-50/30">
                <Button
                    variant="ghost"
                    className="w-full h-11 text-sm font-semibold text-gray-500 hover:text-gray-800 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl transition-all"
                >
                    Learn about automations
                </Button>
            </div>
        </div>
    );
};

export default LibrarySidebar;
