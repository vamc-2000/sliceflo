"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";
import { TimesheetRowActions } from "./TimesheetRowActions";

const Center = ({ children }: { children: React.ReactNode }) => (
  <div className="flex justify-center text-center">
    {children}
  </div>
);

type TableRow = {
  task: string;
  projectName?: string;
  description: string;
  billable: boolean;
  tags: string[];
  startTime: string;
  endTime: string;
  trackedTime: string;
  originalEntry: import("@/types/timesheet.types").TimesheetWithUser;
};

export const timesheetColumns: ColumnDef<TableRow>[] = [
  {
    accessorKey: "task",
    header: () => <Center>Task</Center>,
    cell: ({ row }) => {
      const task = row.getValue("task") as string;
      const projectName = row.original.projectName;

      return (
        <Center>
          <div className="flex flex-col items-start leading-tight text-left max-w-[200px] w-full">
            <span
              data-testid="cell-task-name"
              className="font-medium text-sm text-foreground truncate w-full"
              title={task || ""}
            >
              {task || "-"}
            </span>
            {projectName && (
              <span
                className="text-xs text-muted-foreground truncate w-full"
                title={projectName}
              >
                {projectName}
              </span>
            )}
          </div>
        </Center>
      );
    },
  },
  {
    accessorKey: "description",
    header: () => <Center>Description</Center>,
    cell: ({ row }) => {
      const html = row.getValue("description") as string;

      return (
        <Center>
          {html ? (
            <div
              data-testid="cell-description"
              className="max-w-[220px] truncate text-left text-sm"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            "-"
          )}
        </Center>
      );
    },
  },

  {
    accessorKey: "billable",
    header: () => <Center>Billable</Center>,
    cell: ({ row }) => {
      const isBillable = row.getValue("billable") as boolean;

      return (
        <Center>
          <Button
            data-testid="cell-billable-icon"
            variant="outline"
            size="icon"
            className={`h-7 w-7 rounded-full transition-colors
            ${isBillable
                ? "text-white bg-green-600 dark:bg-green-500"
                : "bg-muted text-muted-foreground"
              }
          `}
          >
            $
          </Button>
        </Center>
      );
    },
  },
  {
    accessorKey: "tags",
    header: () => <Center>Tags</Center>,
    cell: () => (
      <Center>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-full bg-muted text-muted-foreground "
        >
          <Tag />
        </Button>
      </Center>
    ),
  },
  {
    accessorKey: "startTime",
    header: () => <Center>Start Time</Center>,
    cell: ({ row }) => (
      <Center>{row.getValue("startTime") || "-"}</Center>
    ),
  },
  {
    accessorKey: "endTime",
    header: () => <Center>End Time</Center>,
    cell: ({ row }) => (
      <Center>{row.getValue("endTime") || "-"}</Center>
    ),
  },
  {
    accessorKey: "trackedTime",
    header: () => <Center>Tracked Time</Center>,
    cell: ({ row }) => (
      <Center>{row.getValue("trackedTime") || "-"}</Center>
    ),
  },
  {
    id: "actions",
    header: () => <Center>Action</Center>,
    cell: ({ row }) => (
      <Center>
        <TimesheetRowActions row={row} />
      </Center>
    ),
  },
];
