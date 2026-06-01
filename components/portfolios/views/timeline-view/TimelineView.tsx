"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { usePortfoliosStore } from '@/stores/portfolios-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useProfileStore } from '@/stores/profile-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Button } from '@/components/ui/button';
import {
    GanttProvider,
    GanttTimeline,
    GanttHeader,
    GanttFeatureList,
    GanttFeatureItem,
    GanttToday,
    type GanttFeature,
    type Range,
} from '@/components/ui/shadcn-io/gantt';
import { transformProjectToGanttFeature } from '@/lib/gantt-helpers';
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Search, Plus, Minus, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { CustomGanttCalendarPicker } from '@/components/projects/views/gantt-view/CustomGanttCalendarPicker';
import LinkPortfolioProjectDialog from "../PortfolioOverview/LinkPortfolioProjectDialog";

interface TimelineViewProps {
    portfolioId: string;
}

export function TimelineView({ portfolioId }: TimelineViewProps) {
    const { portfolios } = usePortfoliosStore();
    const { projects, updateProjectDates } = useProjectsStore();
    const { user: profile } = useProfileStore();
    const { projectPhases } = useWorkspaceStore();

    // Configuration
    const weekendDays = useMemo(() => {
        if (!profile?.preferences?.weekendDays) return [0, 6];
        const dayMap: Record<string, number> = {
            'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
            'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };
        return profile.preferences.weekendDays.map((day: string) => dayMap[day] ?? 0);
    }, [profile?.preferences?.weekendDays]);

    // View state
    const [range, setRange] = useState<Range>('monthly'); // Default to monthly
    const [zoom, setZoom] = useState(100);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState("");
    const [openLinkProjectDialog, setOpenLinkProjectDialog] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);

    const portfolio = portfolios.find(p => p.id === portfolioId);
    const projectsList = portfolio?.projects || [];

    const portfolioProjects = useMemo(() => {
        return projects
            .filter(p => projectsList.includes(p.id!))
            .filter(p => searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true);
    }, [projects, portfolio?.projects, searchQuery]);

    const ganttFeatures = useMemo(() => {
        return portfolioProjects
            .map(p => {
                const phase = projectPhases
                    .flatMap(pp => [pp, ...(pp.children || [])])
                    .find(pp => pp.value === p.phase);
                return transformProjectToGanttFeature(p, phase?.color || '#ffffff');
            })
            .filter((f): f is GanttFeature => !!f);
    }, [portfolioProjects, projectPhases]);

    // Handlers
    const handleMoveFeature = (id: string, startAt: Date, endAt: Date | null) => {
        if (!endAt) return;
        updateProjectDates(id, startAt.toISOString(), endAt.toISOString());
    };

    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        if (direction === 'today') {
            setCurrentDate(new Date());
            return;
        }
        const delta = direction === 'prev' ? -1 : 1;
        const newDate = new Date(currentDate);
        if (range === 'daily') newDate.setDate(newDate.getDate() + delta);
        else if (range === 'weekly') newDate.setDate(newDate.getDate() + (delta * 7));
        else if (range === 'monthly') newDate.setMonth(newDate.getMonth() + delta);
        else if (range === 'quarterly') newDate.setMonth(newDate.getMonth() + (delta * 3));
        else if (range === 'half-yearly') newDate.setMonth(newDate.getMonth() + (delta * 6));
        else if (range === 'yearly') newDate.setFullYear(newDate.getFullYear() + delta);
        setCurrentDate(newDate);
    };

    const getDateLabel = () => {
        if (range === 'daily') return format(currentDate, 'MMMM d, yyyy');
        if (range === 'weekly') {
            const start = new Date(currentDate);
            start.setDate(currentDate.getDate() - currentDate.getDay());
            const end = addDays(start, 6);
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        }
        if (range === 'monthly') return format(currentDate, 'MMMM yyyy');
        if (range === 'quarterly') return `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${currentDate.getFullYear()}`;
        if (range === 'half-yearly') return `H${Math.floor(currentDate.getMonth() / 6) + 1} ${currentDate.getFullYear()}`;
        if (range === 'yearly') return format(currentDate, 'yyyy');
        return format(currentDate, 'MMMM yyyy');
    };

    return (
        <div className="w-full h-full flex flex-col bg-background">
            {/* Header */}
            <div className="bg-white border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative flex">
                        <Input
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-2 pr-8 rounded"
                        />
                        <Search className="absolute top-2.5 right-3 h-4 w-4 text-gray-400" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleNavigate('today')}>
                        Today
                    </Button>
                    <div className="flex items-center gap-1">
                        <Button onClick={() => handleNavigate('prev')} variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" className="h-8 px-3 text-sm font-semibold hover:bg-gray-100 flex items-center gap-1">
                                    {getDateLabel()}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3" align="center">
                                <CustomGanttCalendarPicker
                                    selectedDate={currentDate}
                                    onDateSelect={(newDate) => setCurrentDate(newDate)}
                                    range={range}
                                    currentLabel={getDateLabel()}
                                />
                            </PopoverContent>
                        </Popover>
                        <Button onClick={() => handleNavigate('next')} variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="h-8 flex items-center gap-1 bg-gray-100 rounded p-1 ml-4">
                        {(['monthly', 'quarterly', 'half-yearly', 'yearly'] as Range[]).map((r) => {
                            const labels: Record<string, string> = {
                                monthly: 'Month',
                                quarterly: 'Quarter',
                                'half-yearly': 'Half Year',
                                yearly: 'Year'
                            };
                            return (
                                <Button
                                    key={r}
                                    variant={range === r ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setRange(r)}
                                    className={cn(
                                        "h-7 px-2 rounded text-xs",
                                        range === r ? "bg-[#001F3F] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                                    )}
                                >
                                    {labels[r]}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Timeline Area */}
            <div className="flex-1 h-full flex border rounded-lg mx-4 my-2 overflow-hidden shadow-sm">
                {/* Timeline Only - No Sidebar */}
                <div className="flex-1 min-h-0 relative">
                    <GanttProvider
                        range={range}
                        startDate={currentDate}
                        zoom={zoom}
                        headerHeight={60}
                        rowHeight={48}
                        className="h-full w-full overflow-hidden"
                        weekendDays={weekendDays}
                        containerRef={timelineRef}
                    >
                        <div className="absolute inset-0 flex flex-col">
                            <GanttTimeline
                                ref={timelineRef}
                                className="flex-1 overflow-auto scroll-container"
                            >
                                <GanttHeader />
                                <GanttFeatureList className='space-y-0'>
                                    {portfolioProjects.map((project) => {
                                        const feature = ganttFeatures.find(f => f.id === project.id);
                                        return feature ? (
                                            <GanttFeatureItem
                                                key={feature.id}
                                                {...feature}
                                                onMove={handleMoveFeature}
                                                hideLabels={false} // Set to false so user can see project names on the bars
                                            />
                                        ) : (
                                            <div key={project.id} style={{ height: 48 }} className="border-b border-gray-100/50" />
                                        );
                                    })}
                                    <div style={{ height: 48 }} className="border-b border-gray-100/50 w-full" />
                                </GanttFeatureList>
                                <GanttToday />
                            </GanttTimeline>
                        </div>
                    </GanttProvider>

                    {/* Zoom Controls */}
                    <div className="absolute bottom-6 right-6 z-20 flex overflow-hidden rounded-md border bg-white shadow-md">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setZoom(z => Math.min(200, z + 10))}
                            disabled={zoom >= 200}
                            className="h-9 w-9"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <div className="w-px bg-border" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setZoom(z => Math.max(100, z - 10))}
                            disabled={zoom <= 100}
                            className="h-9 w-9"
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <LinkPortfolioProjectDialog
                open={openLinkProjectDialog}
                onClose={() => setOpenLinkProjectDialog(false)}
                portfolioId={portfolioId}
                existingProjectIds={portfolio?.projects || []}
            />
        </div>
    );
}
