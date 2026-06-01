


"use client";

import React, { useState, useEffect } from 'react';
import {
    Search, Zap, Plus, Edit3, RefreshCw, CheckCircle2,
    AlertTriangle, Calendar, UserPlus, ListPlus, Eye,
    MessageSquare, Clock3, Tag, Layout
} from 'lucide-react';
import { useAutomationStore } from "@/stores/automation-store";
import { type NodeTemplate } from './AddNodeMenu';

interface InitialTriggerMenuProps {
    onSelect: (template: NodeTemplate) => void;
    onExploreAll: () => void;
}

const InitialTriggerMenu = ({ onSelect, onExploreAll }: InitialTriggerMenuProps) => {
    const { triggerOptions, fetchMetadata } = useAutomationStore();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!triggerOptions?.length) fetchMetadata();
    }, [triggerOptions, fetchMetadata]);

    const getIcon = (id: string) => {
        const cls = "w-3 h-3 flex-shrink-0";
        switch (id) {
            case 'TASK_CREATED':      return <Plus className={cls} />;
            case 'TASK_UPDATED':      return <Edit3 className={cls} />;
            case 'STATUS_CHANGED':    return <RefreshCw className={cls} />;
            case 'STATUS_CHANGED_TO': return <CheckCircle2 className={cls} />;
            case 'PRIORITY_CHANGED':  return <AlertTriangle className={cls} />;
            case 'DUE_DATE_CHANGED':  return <Calendar className={cls} />;
            case 'ASSIGNEE_CHANGED':  return <UserPlus className={cls} />;
            case 'SUBTASK_CREATED':   return <ListPlus className={cls} />;
            case 'WATCHER_ADDED':     return <Eye className={cls} />;
            case 'COMMENT_ADDED':     return <MessageSquare className={cls} />;
            case 'TIME_TRACKED':      return <Clock3 className={cls} />;
            case 'TAG_ADDED':         return <Tag className={cls} />;
            default:                  return <Zap className={cls} />;
        }
    };

    const handleSelect = (t: any) => {
        onSelect({
            type: 'trigger',
            apiId: t.id,
            label: t.label,
            description: `Trigger: ${t.category || ''}`,
            icon: getIcon(t.id),
            color: '#00CA72',
        });
    };

    const list = (triggerOptions ?? []).filter(t =>
        !searchQuery ||
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.category ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        /* ── Compact popup: 230px wide, max 280px tall ── */
        <div
            className="bg-white rounded-xl border border-gray-200 shadow-xl flex flex-col overflow-hidden"
            style={{ width: 230 }}
        >
            {/* ── Search ── */}
            <div className="px-2 pt-2 pb-1">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search triggers..."
                        autoFocus
                        className="w-full h-6 pl-6 pr-2 text-[11px] font-medium bg-gray-50 border border-gray-100 rounded-md outline-none focus:border-[#00CA72] focus:bg-white transition-all placeholder:text-gray-300"
                    />
                </div>
            </div>

            {/* ── Section label ── */}
            <p className="px-2.5 pt-1 pb-0.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                {searchQuery ? `${list.length} result${list.length !== 1 ? 's' : ''}` : 'All Triggers'}
            </p>

            {/* ── Trigger list ── */}
            <div className="overflow-y-auto flex-1" style={{ maxHeight: 190 }}>
                {list.length > 0 ? (
                    <div className="px-1 pb-1">
                        {list.map(t => (
                            <button
                                key={t.id}
                                onClick={() => handleSelect(t)}
                                className="w-full flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group"
                            >
                                {/* Tiny icon pill */}
                                <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 group-hover:bg-[#e6faf2] group-hover:text-[#00CA72] transition-colors">
                                    {getIcon(t.id)}
                                </div>
                                <span className="text-[11px]  font-semibold text-gray-600 group-hover:text-gray-900 truncate leading-tight">
                                    {t.label}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="py-3 text-center">
                        <p className="text-[10px] text-gray-400 font-medium">No triggers found</p>
                    </div>
                )}
            </div>

            {/* ── Footer ── */}
            <div className="border-t border-gray-100 px-1 py-1">
                <button
                    onClick={onExploreAll}
                    className="w-full flex items-center justify-center gap-1 h-6 rounded-lg hover:bg-gray-50 text-[10px] font-bold text-gray-400 hover:text-gray-700 transition-colors"
                >
                    <Zap className="w-2.5 h-2.5 text-[#00CA72] fill-[#00CA72]" />
                    <Layout className="w-2.5 h-2.5 text-blue-400" />
                    <span className="ml-0.5">Explore all</span>
                </button>
            </div>
        </div>
    );
};

export default InitialTriggerMenu;
