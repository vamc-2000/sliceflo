"use client";

import { Maximize2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { AddTimesheetEntryModal } from "./AddTimesheetEntryModal";
import { TimesheetWithUser } from "@/types/timesheet.types";
import { useTimesheetStore } from "@/stores/timesheet-store";
import { toast } from "sonner";

type TimesheetTableRow = {
  task: string;
  projectName?: string;
  description: string;
  billable: boolean;
  tags: string[];
  startTime: string;
  endTime: string;
  trackedTime: string;
  originalEntry: TimesheetWithUser;
};

interface TimesheetRowActionsProps {
  row: Row<TimesheetTableRow>;
}

export function TimesheetRowActions({ row }: TimesheetRowActionsProps) {
  const data = row.original;

  const { deleteTimesheet } = useTimesheetStore();

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const success = await deleteTimesheet(data.originalEntry.id);
      if (success) {
        toast.success("Timesheet entry deleted successfully");
      } else {
        toast.error("Failed to delete timesheet entry");
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("An error occurred while deleting the entry");
    } finally {
      setOpenDeleteModal(false);
    }
  };

  return (
    <>
      {/* Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            data-testid="btn-row-actions"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-36 border-0 border-b-[5px] border-primary rounded-lg"
        >
          
          <DropdownMenuItem
            data-testid="menu-item-edit-entry"
            className="text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setIsEditModalOpen(true)}
            disabled={["Pending", "Approved"].includes(data.originalEntry.status)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Entry
          </DropdownMenuItem>

          <DropdownMenuItem
            data-testid="menu-item-delete-entry"
            className="text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setOpenDeleteModal(true)}
            disabled={["Pending", "Approved"].includes(data.originalEntry.status)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Entry
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        title="Are you sure you want to remove this entry?"
        description="Deleting entry is permanent and cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />

      {/* Edit Modal */}
      <AddTimesheetEntryModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={data.originalEntry as any}
      />
    </>
  );
}
