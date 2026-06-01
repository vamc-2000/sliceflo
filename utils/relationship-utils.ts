import { 
    Link2, Copy, Ban, XOctagon, 
    CircleArrowLeft, CircleArrowRight, 
    SkipBack, SkipForward 
} from 'lucide-react';
import React from 'react';

export const getRelationshipIcon = (type: string): React.ElementType => {
    const iconMap: Record<string, React.ElementType> = {
        'relates-to': Link2,
        'duplicate-of': Copy,
        'blocked-by': Ban,
        'blocking': XOctagon,
        'starts-before': CircleArrowLeft,
        'starts-after': CircleArrowRight,
        // 'finishes-before': SkipBack,
        // 'finishes-after': SkipForward,
    };
    return iconMap[type] ?? Link2;
};

export const getRelationshipIconColor = (type: string): string => {
    const colorMap: Record<string, string> = {
        'relates-to': 'text-blue-500',
        'duplicate-of': 'text-purple-500',
        'blocked-by': 'text-red-500',
        'blocking': 'text-orange-500',
        'starts-before': 'text-green-500',
        'starts-after': 'text-teal-500',
        // 'finishes-before': 'text-yellow-600',
        // 'finishes-after': 'text-lime-600',
    };
    return colorMap[type] ?? 'text-muted-foreground';
};

export const getRelationshipLabel = (type: string): string => {
    const labels: Record<string, string> = {
        'relates-to': 'Relates to',
        'duplicate-of': 'Duplicate of',
        'blocked-by': 'Blocked by',
        'blocking': 'Blocking',
        'starts-before': 'Starts Before',
        'starts-after': 'Starts After',
        // 'finishes-before': 'Finishes Before',
        // 'finishes-after': 'Finishes After',
    };
    return labels[type] ?? type;
};
