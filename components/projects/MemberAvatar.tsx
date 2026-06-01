import { Avatar as UIAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

export function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface MemberAvatarProps {
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    src?: string | null;
    className?: string;
}

export function MemberAvatar({ name, size = 'sm', src, className }: MemberAvatarProps) {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-7 h-7',
        lg: 'w-8 h-8 text-xs',
        xl: 'w-10 h-10 text-sm'
    };

    const dim = sizeClasses[size];

    if (!name && !src) {
        return (
            <div className={cn(dim, "rounded-full bg-muted border border-dashed border-input flex items-center justify-center text-muted-foreground", className)}>
                <User className={cn(size === 'sm' ? "h-3 w-3" : "h-4 w-4")} />
            </div>
        );
    }

    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

    return (
        <UIAvatar className={cn(dim, "border shrink-0", className)}>
            {src && <AvatarImage src={src} className="object-cover" />}
            <AvatarFallback
                className="font-semibold text-primary-foreground bg-muted text-[10px]"
                style={{ backgroundColor: name ? getAvatarColor(name) : undefined }}
            >
                {name ? initials : <User className="h-3 w-3" />}
            </AvatarFallback>
        </UIAvatar>
    );
}
