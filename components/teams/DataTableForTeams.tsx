"use client";

import React, { useEffect, useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useTeamStore } from "@/stores/teams-store";
import { useProjectsStore } from "@/stores/projects-store";
import { ProjectIconAvatar } from "@/components/projects/ProjectIconAvatar";

interface BaseUser {
  name: string;
  avatar?: string;
}

interface DataTableProps<
  TData extends BaseUser,
  TValue
> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  enableGlobalFilter?: boolean;
  enableColumnFilter?: boolean;
  filterColumn?: string;
  filterOptions?: { label: string; value: string }[];
  toolbarActions?: React.ReactNode;
  emptyMessage?: string;
  hidePagination?: boolean;
  externalFilterValue?: string | null;
  toolbarLeft?: React.ReactNode;
}

export function DataTableForTeams<
  TData extends BaseUser,
  TValue
>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  onRowSelectionChange,
  enableGlobalFilter = true,
  enableColumnFilter = false,
  filterColumn,
  filterOptions = [],
  toolbarActions,
  emptyMessage = "No results found.",
  hidePagination = false,
  externalFilterValue,
  toolbarLeft,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const teams = useTeamStore((state) => state.teams);
  const projects = useProjectsStore((state) => state.projects);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updaterOrValue) => {
      setRowSelection(updaterOrValue);

      // Notify parent of selection changes
      if (onRowSelectionChange) {
        const newSelection = typeof updaterOrValue === 'function'
          ? updaterOrValue(rowSelection)
          : updaterOrValue;
        const selectedIds = Object.keys(newSelection);
        const selectedRows = data.filter((_, index) => selectedIds.includes(index.toString()));
        onRowSelectionChange(selectedRows);
      }
    },
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.length;

  useEffect(() => {
    if (!filterColumn) return;

    table
      .getColumn(filterColumn)
      ?.setFilterValue(externalFilterValue ?? undefined);
  }, [externalFilterValue, filterColumn]);

  // Extract unique user names from the "name" column
  const uniqueUsers = React.useMemo(() => {
    const rows = table.getCoreRowModel().flatRows;

    const users = rows.map((row) => ({
      name: row.getValue("name") as string,
      avatar: row.original.avatar,
    }));

    // Remove duplicates by name
    const uniqueMap = new Map();
    users.forEach((user) => {
      if (user.name) {
        uniqueMap.set(user.name, user);
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [data, table]);

  const uniqueProjectsFromTeams = React.useMemo(() => {
    // Collect all unique projectIds across all teams
    const allProjectIds = new Set<string>();
    teams.forEach((team) => {
      (team.projectIds || []).forEach((id) => allProjectIds.add(id));
    });

    // Map IDs to project names using the projects store
    return Array.from(allProjectIds)
      .map((id) => {
        const project = projects.find((p) => p.id === id);
        return project ? {
          id: project.id!,
          name: project.name,
          icon: project.icon,
          iconId: project.iconId,
          color: project.icon ? project.color : '#001F3F' // Ensure fallback is #001F3F
        } : null;
      })
      .filter(Boolean) // remove unmatched IDs
      .sort((a, b) => a!.name.localeCompare(b!.name)) as { id: string; name: string; icon?: any; iconId?: any; color?: string }[];
  }, [teams, projects]);

  const columnFiltersState = table.getState().columnFilters;
  const isAnyFilterActive = columnFiltersState.length > 0;
  const isNameFiltered = columnFiltersState.some((f) => f.id === "name");
  const isStatusFiltered = filterColumn ? columnFiltersState.some((f) => f.id === filterColumn) : false;
  const isProjectFiltered = columnFiltersState.some((f) => f.id === "project");

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center space-x-2">
          {toolbarLeft && <div className="flex items-center">{toolbarLeft}</div>}
          {/* Global Search */}
          {enableGlobalFilter && (
            // <div className="relative w-full max-w-xs">    
            <div className="relative w-64">
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {/* Nested Dropdown Filter */}
          {enableColumnFilter && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-muted text-muted-foreground relative cursor-pointer hover:bg-muted/80">
                  <Filter className="h-4 w-4" />
                  Filter
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {columnFiltersState.length}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-popover text-popover-foreground border-0 border-b-[5px] border-primary">

                {/* User Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center relative text-foreground">
                    {isNameFiltered && (
                      <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full" />
                    )}
                    <span>User</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="bg-popover text-popover-foreground border-0 border-b-[5px] border-primary">
                      <DropdownMenuItem
                        onClick={() => table.getColumn("name")?.setFilterValue(undefined)}
                      >
                        All Users
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      {/* Dynamic list of unique user names */}
                      {uniqueUsers.map((user) => (
                        <DropdownMenuItem
                          key={user.name}
                          onClick={() =>
                            table.getColumn("name")?.setFilterValue(user.name)
                          }
                          className="flex items-center gap-2 relative"
                        >
                          {table.getColumn("name")?.getFilterValue() === user.name && (
                            <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full" />
                          )}
                          {/* <span className={table.getColumn("name")?.getFilterValue() === user.name ? "ml-4" : ""}> */}
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>
                              {user.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {/* </span> */}

                          <span>{user.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Project Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center relative text-foreground">
                    {isProjectFiltered && (
                      <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full" />
                    )}
                    <span>Project</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="bg-popover text-popover-foreground border-0 border-b-[5px] border-primary">
                      <DropdownMenuItem
                        onClick={() => table.getColumn("project")?.setFilterValue(undefined)}
                      >
                        All Projects
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      {uniqueProjectsFromTeams.map((project) => (
                        <DropdownMenuItem
                          key={project.id}
                          onClick={() =>
                            table.getColumn("project")?.setFilterValue(project.name)
                          }
                          className="flex items-center gap-2 relative"
                        >
                          {table.getColumn("project")?.getFilterValue() === project.name && (
                            <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full" />
                          )}
                          <ProjectIconAvatar
                            project={project}
                            size="sm"
                          />
                          <span>{project.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Status Submenu (existing filter logic) */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center relative text-foreground">
                    {isStatusFiltered && (
                      <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full" />
                    )}
                    <span>Status</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="bg-popover text-popover-foreground border-0 border-b-[5px] border-primary">
                      <DropdownMenuItem
                        onClick={() => filterColumn && table.getColumn(filterColumn)?.setFilterValue(undefined)}
                      >
                        All Statuses
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      {filterOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => filterColumn && table.getColumn(filterColumn)?.setFilterValue(option.value)}
                          className="relative"
                        >
                          {filterColumn && table.getColumn(filterColumn)?.getFilterValue() === option.value && (
                            <div className="absolute left-0 w-[3px] h-full bg-primary rounded-r-full" />
                          )}
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {isAnyFilterActive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-center justify-center font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => table.resetColumnFilters()}
                    >
                      Clear All Filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Custom Toolbar Actions */}
        {toolbarActions && <div className="flex items-center space-x-2">{toolbarActions}</div>}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table >
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => (
                  <TableHead key={header.id} className={`text-foreground font-bold border-b border-r border-border ${index === headerGroup.headers.length - 1 ? "border-r-0" : ""
                    }`}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell key={cell.id} className={`border-r border-border ${index === row.getVisibleCells().length - 1 ? "border-r-0" : ""
                      }`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!hidePagination && (
        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {selectedRows > 0 &&
              `${selectedRows} of ${table.getFilteredRowModel().rows.length} row(s) selected.`}
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-17.5">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-25 items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                «
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                ‹
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                ›
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                »
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
