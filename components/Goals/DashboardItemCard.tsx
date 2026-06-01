"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Share2, MoreHorizontal, FileText, Folder, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReactNode } from "react";
import { BiExpandAlt } from "react-icons/bi";
import { PiLinkSimple } from "react-icons/pi";
import { CgFileDocument } from "react-icons/cg";

interface DashboardItemCardProps {
  id: string;
  title: string;
  icon?: string | ReactNode;
  isFavorite?: boolean;
  isPurple?: boolean;
  createdBy?: {
    name: string;
    initials?: string;
    image?: string;
  };
  color?: string;
  fileSize?: string;
  navigateTo: string;
  onToggleFavorite?: (id: string) => void;
  onShare?: (id: string) => void;
  onMore?: (id: string) => void;
  // Custom action icons
  actionIcons?: {
    star?: LucideIcon;
    share?: LucideIcon;
    more?: LucideIcon;
  };
}

export const DashboardItemCard = ({
  id,
  title,
  icon,
  isFavorite = false,
  isPurple = false,
  createdBy,
  fileSize,
  color,
  navigateTo,
  onToggleFavorite,
  onShare,
  onMore,
  actionIcons,
}: DashboardItemCardProps) => {
  const router = useRouter();

  // Use custom icons or defaults
  const StarIcon = actionIcons?.star || Star;


  // const renderIcon = () => {
  //   if (typeof icon === "string") {

  //     if (icon === "📁") {
  //       return <CgFileDocument className="w-3.5 h-3.5 text-gray-700" />;
  //     }
  //     return <CgFileDocument className="w-3.5 h-3.5 text-gray-700" />;
  //   }
  //   // Custom React component
  //   return icon;
  // };
  const getHeaderStyle = () => {
    // If color prop is provided, use it
    if (color) {
      return {
        backgroundColor: color,
      };
    }
    // Fallback to isPurple for backward compatibility
    if (isPurple) {
      return {};
    }
    return {};
  };


  return (
    <Card
      className={cn(
        "flex-shrink-0 cursor-pointer transition-all hover:shadow-lg overflow-hidden p-0",
        "border-[0.2px] border-border hover:border-border/80",
        "w-[270px] min-w-[210px] h-[110px] rounded-[6px] ml-2.5"
      )}
      onClick={() => router.push(navigateTo)}
    >
      <div
        className={cn(
          "px-3 py-1.5 rounded-t-[6px] flex items-center justify-end",
          "transition-all duration-200 group-hover:shadow-inner",
          color ? "" : "bg-muted"
        )}
        style={color ? {
          background: `linear-gradient(120deg, ${color} 0%, ${color}ee 100%)`,
          boxShadow: `inset 0 -1px 0 0 ${color}44`,
        } : undefined}
      >
        {/* Removed Icon Section */}


        {/* Buttons with circular white backgrounds */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Star Icon */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 rounded-full shrink-0 p-0",
              "transition-all duration-150 hover:scale-110 active:scale-95",
              "bg-background text-foreground hover:bg-muted shadow-sm"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleFavorite) {
                onToggleFavorite(id);
              }
            }}
          >
            <StarIcon
              className={cn(
                "h-2 w-2 transition-all",
                isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
              )}
            />
          </Button>

          {/* Share Icon */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 rounded-full shrink-0 p-0",
              "transition-all duration-200 hover:scale-110 hover:rotate-12",
              "bg-background text-foreground hover:bg-muted shadow-sm"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (onShare) {
                onShare(id);
              }
            }}
          >
            <BiExpandAlt className="h-2 w-2 text-foreground" />
          </Button>

          {/* More Icon */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 rounded-full shrink-0 p-0",
              "transition-all duration-200 hover:scale-110",
              "bg-background text-foreground hover:bg-muted shadow-sm"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (onMore) {
                onMore(id);
              }
            }}
          >
            <PiLinkSimple className="h-2 w-2 text-foreground" />
          </Button>
        </div>


      </div>




      {/* Content Section */}
      <div className="px-3 mb-1 py-2 space-y-2 rounded-b-[6px] -mt-4">
        {/* Title */}
        <h3 className="font-semibold text-[13px] leading-tight text-foreground line-clamp-2">
          {title}
        </h3>

        {/* Metadata */}
        {(createdBy || fileSize) && (
          <div className="flex items-center gap-1">
            {createdBy && (
              <>
                <Avatar className="h-5 w-5 border border-border">
                  {createdBy.image && (
                    <AvatarImage src={createdBy.image.startsWith('http') ? createdBy.image : `${process.env.NEXT_PUBLIC_S3_BASE_URL}/${createdBy.image}`} alt={createdBy.name} />
                  )}
                  <AvatarFallback className="text-[10px] font-medium bg-muted text-muted-foreground">
                    {createdBy.initials ||
                      createdBy.name
                        ?.split(" ")
                        .map((n) => n?.[0])
                        .filter(Boolean)
                        .join("")
                        .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground truncate">
                  {createdBy.name}
                </span>
              </>
            )}
            {createdBy && fileSize && (
              <span className="text-[10px] text-muted-foreground/30">•</span>
            )}
            {fileSize && (
              <span className="text-[10px] text-muted-foreground">{fileSize}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
