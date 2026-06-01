"use client";
import { useState } from "react";
import Image from "next/image";
import { FileAttachment } from "@/types/attachment.types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, Trash2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ConfirmationModal";

interface PortfolioAttachmentsProps {
  file: FileAttachment;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

const getFileImage = (mimeType: string) => {
  if (!mimeType) return "/images/default.png";

  if (mimeType.includes("pdf")) return "/images/discussions/pdf.svg";
  if (mimeType.includes("doc")) return "/images/discussions/word.svg";
  if (mimeType.includes("ppt")) return "/images/discussions/ppt.svg";
  if (mimeType.includes("png") || mimeType.includes("jpg"))
    return "/images/discussions/imgs.png";

  return "/images/default.png";
};

export function PortfolioAttachments({
  file,
  onDownload,
  onDelete,
  onView,
}: PortfolioAttachmentsProps) {
  const [expanded, setExpanded] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(file.id);
      }
      setIsDeleteModalOpen(false);
    } catch (error) {
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 p-3 border border-[#8E8E93] rounded-md bg-white hover:shadow-sm transition">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Image
            src={getFileImage(file.type)}
            alt={file.type}
            width={20}
            height={20}
            className="object-contain"
          />

          <div className="flex-1 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p
                    onClick={() => setExpanded(!expanded)}
                    className={`text-sm font-medium cursor-pointer hover:text-primary transition-colors ${expanded ? "break-all" : "truncate"
                      }`}
                  >
                    {file.name.length > 10 && !expanded
                      ? file.name.substring(0, 10) + "..."
                      : file.name}
                  </p>
                </TooltipTrigger>

                {!expanded && (
                  <TooltipContent>
                    <p className="text-xs max-w-xs break-all">{file.name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <p className="text-[10px] text-[#8E8E93]">{file.size}</p>
          </div>
        </div>

        {/* RIGHT SECTION - ACTION ICONS WITH TOOLTIPS */}
        <div className="flex items-center gap-1 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDownload?.(file.id)}
                  className="bg-[#F2F2F7] rounded-full cursor-pointer"
                >
                  <Download className="h-3 w-3 text-[#8E8E93]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Download</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView ? onView(file.id) : setExpanded(!expanded)}
                  className="bg-[#F2F2F7] rounded-full cursor-pointer"
                >
                  <Maximize2 className="h-3 w-3 text-[#8E8E93]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">View</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="bg-[#F2F2F7] rounded-full cursor-pointer"
                >
                  <Trash2 className="h-3 w-3 text-[#EC221F]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Delete</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        title="Delete File"
        description={`Are you sure you want to delete "${file.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
        loadingLabel="Deleting..."
      />
    </>
  );
}
