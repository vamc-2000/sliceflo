"use client";
import Image from 'next/image';
import { iconComponentMap } from '@/components/ColorIconPicker';

interface TeamIconProps {
  team: any;
  size?: number;
  className?: string;
}

export const TeamIcon: React.FC<TeamIconProps> = ({ team, size = 24, className = '' }) => {
  const renderTeamIcon = () => {
    const iconColor = team?.icon?.color || '#6366f1';

    // Handle new icon object structure from API (presigned URL)
    if (team?.icon?.type === "file" && team.icon.presignedUrl) {
      return (
        <Image
          src={team.icon.presignedUrl}
          alt={team.name || 'Team'}
          width={size}
          height={size}
          className={`w-${size} h-${size} object-cover rounded-md ${className}`}
          unoptimized // Required for presigned S3 URLs
        />
      );
    }

    // Icon library fallback
    if (team?.icon?.type === "icon" && team.icon.name) {
      const IconComp = iconComponentMap[team.icon.name as keyof typeof iconComponentMap];
      if (IconComp) {
        return (
          <div
            className={`flex items-center justify-center rounded-md ${className}`}
            style={{
              backgroundColor: iconColor,
              width: `${size * 4}px`, // Using standard Tailwind scale (1 = 4px)
              height: `${size * 4}px`
            }}
          >
            <IconComp
              size={size * 2.5} // Scale icon relative to background
              className="text-white"
            />
          </div>
        );
      }
    }

    // Fallback initials
    return (
      <div
        className={`rounded-md flex items-center justify-center text-white text-xs font-bold ${className}`}
        style={{
          backgroundColor: iconColor,
          width: `${size * 4}px`,
          height: `${size * 4}px`
        }}
      >
        {team?.name?.[0]?.toUpperCase() || 'T'}
      </div>
    );
  };

  return (
    <div className={`flex-shrink-0 ${className}`}>
      {renderTeamIcon()}
    </div>
  );
};

export default TeamIcon;
