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
  taskIdStr?: string;
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
      const taskIdStr = row.original.taskIdStr;

      return (
        <Center>
          <div className="flex flex-col items-start leading-tight text-left max-w-[200px] w-full gap-1">

            <span
              data-testid="cell-task-name"
              className="font-medium text-sm text-foreground truncate w-full"
              title={task || ""}
            >
              {task || "-"}
            </span>
            {taskIdStr && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium shrink-0">
                {taskIdStr}
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
    accessorKey: "projectName",
    header: () => <Center>Project</Center>,
    cell: ({ row }) => {
      const projectName = row.getValue("projectName") as string;
      return <Center>{projectName || "-"}</Center>;
    },
  },

  // {
  //   accessorKey: "billable",
  //   header: () => <Center>Billable</Center>,
  //   cell: ({ row }) => {
  //     const isBillable = row.getValue("billable") as boolean;

  //     return (
  //       <Center>
  //         <Button
  //           data-testid="cell-billable-icon"
  //           variant="outline"
  //           size="icon"
  //           className={`h-7 w-7 rounded-full transition-colors
  //           ${isBillable
  //               ? "text-white bg-green-600 dark:bg-green-500"
  //               : "bg-muted text-muted-foreground"
  //             }
  //         `}
  //         >
  //           $
  //         </Button>
  //       </Center>
  //     );
  //   },
  // },
  {
    accessorKey: "tags",
    header: () => <Center>Labels</Center>,
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
