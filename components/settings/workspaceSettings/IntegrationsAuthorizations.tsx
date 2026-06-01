"use client";

import React, { useState } from "react";
import ExploreApps from "./IntegrationsAndAuthorizations/ExploreApps";
import MicrosoftTeamsConfigure from "./IntegrationsAndAuthorizations/MicrosoftTeamsConfigure";
import GitLabConfigure from "./IntegrationsAndAuthorizations/GitLabConfigure";
import SlackConfigure from "./IntegrationsAndAuthorizations/SlackConfigure";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowUpDown, ExternalLink, Plus, DollarSign, AlertTriangle, PhoneCall, Settings, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import Image from "next/image";
import { DataTable } from "@/components/layout/DataTable";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// App interface
interface App {
  id: string;
  appName: string;
  appIcon: string;
  type: string;
  userAvatar: string;
  installedDate: string;
  planType: string;
  subscription: "active" | "expiring";
  updateVersion: "active" | "expiring";
}

// Sample data from screenshot
const appsData: App[] = [
  {
    id: "1",
    appName: "Slack",
    appIcon: "/images/Slack.svg",
    type: "Listed",
    userAvatar: "/images/Avatar1.png",
    installedDate: "12 Dec, 2024",
    planType: "Free",
    subscription: "active",
    updateVersion: "active",
  },
  {
    id: "2",
    appName: "Discord",
    appIcon: "/images/Discard.svg",
    type: "Unlisted",
    userAvatar: "/images/Avatar1.png",
    installedDate: "12 Dec, 2024",
    planType: "Paid",
    subscription: "active",
    updateVersion: "active",
  },
  {
    id: "3",
    appName: "Hubspot",
    appIcon: "/images/hubspot.svg",
    type: "Listed",
    userAvatar: "/images/Avatar1.png",
    installedDate: "12 Dec, 2024",
    planType: "Free",
    subscription: "expiring",
    updateVersion: "expiring",
  },
];

export default function IntegrationsAuthorizations() {
  const [apps, setApps] = useState<App[]>(appsData);
  const [selectedApps, setSelectedApps] = useState<App[]>([]);
  const [view, setView] = useState<"main" | "explore" | "configure-teams" | "configure-gitlab" | "configure-slack">("main");

  const AppActionsMenu = ({ app }: { app: App }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">

        <DropdownMenuItem onClick={() => toast("success", { title: "Success", description: "App page opened" })}>
          <Plus className="h-4 w-4 mr-2 text-muted-foreground" />
          App page
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => toast("success", { title: "Success", description: "Billing opened" })}>
          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
          Billing
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => toast("success", { title: "Success", description: "Permissions opened" })}>
          <AlertTriangle className="h-4 w-4 mr-2 text-muted-foreground" />
          Permissions
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => toast("success", { title: "Success", description: "Support opened" })}>
          <PhoneCall className="h-4 w-4 mr-2 text-muted-foreground" />
          Support and issues
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => toast("success", { title: "Success", description: "Settings opened" })}>
          <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator className="dark:bg-border/50" />

        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
          onClick={() => {
            setApps(apps.filter((a) => a.id !== app.id));
            toast("success", { title: "Success", description: "App uninstalled" });
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Uninstall
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );


  const columns: ColumnDef<App>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "appName",
      header: ({ column }) => (
        <div
          className="flex items-center justify-center gap-2 cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          App Name
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3 pl-4">
          <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-white dark:bg-zinc-800/50 overflow-hidden p-1.5">
            <img src={row.original.appIcon} alt="" className="w-full h-full object-contain" />
          </div>
          <span className="font-medium text-[14px] text-foreground">
            {row.getValue("appName")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: () => <div className="text-center">Type</div>,
      cell: ({ row }) => (
        <div className="text-center text-[13px] text-muted-foreground">
          {row.getValue("type")}
        </div>
      ),
    },
    {
      accessorKey: "userAvatar",
      header: () => <div className="text-center">User</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Avatar className="w-8 h-8 border border-white dark:border-zinc-800 shadow-sm">
            <AvatarImage src={row.original.userAvatar} />
            <AvatarFallback className="text-[10px]">U</AvatarFallback>
          </Avatar>
        </div>
      ),
    },
    {
      accessorKey: "installedDate",
      header: () => <div className="text-center">Installed Date</div>,
      cell: ({ row }) => (
        <div className="text-center text-[13px] text-muted-foreground">
          {row.getValue("installedDate")}
        </div>
      ),
    },
    {
      accessorKey: "planType",
      header: () => <div className="text-center">Plan Type</div>,
      cell: ({ row }) => (
        <div className="text-center text-[13px] text-muted-foreground">
          {row.getValue("planType")}
        </div>
      ),
    },
    {
      accessorKey: "subscription",
      header: () => <div className="text-center">Subscription</div>,
      cell: ({ row }) => {
        const status = row.getValue("subscription") as string;
        const isExpiring = status === "expiring";
        return (
          <div className="text-center">
            <button
              className={cn(
                "text-[13px] font-medium underline underline-offset-4 hover:opacity-80 transition-opacity",
                isExpiring ? "text-[#D04545]" : "text-[#007AFF]"
              )}
              onClick={() => toast("success", { title: "Success", description: isExpiring ? "Renewal process started" : "Subscription details" })}
            >
              {isExpiring ? "Renew" : "See Plans"}
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: "updateVersion",
      header: () => <div className="text-center">Update Version</div>,
      cell: ({ row }) => {
        const status = row.getValue("updateVersion") as string;
        const isExpiring = status === "expiring";
        return (
          <div className="text-center">
            <button
              className={cn(
                "text-[13px] font-medium underline underline-offset-4 hover:opacity-80 transition-opacity",
                isExpiring ? "text-[var(--logout-button)]" : "text-[#007AFF]"
              )}
              onClick={() => toast("success", { title: "Success", description: isExpiring ? "Update process started" : "Update details" })}
            >
              {isExpiring ? "Renew" : "See Plans"}
            </button>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Action</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <AppActionsMenu app={row.original} />
        </div>
      ),
    },
  ]


  if (view === "configure-slack") {
    return (
      <div className="w-full space-y-4">
        <SlackConfigure
          onBack={() => setView("explore")}
          onBackToIntegrations={() => setView("main")}
        />
      </div>
    );
  }

  if (view === "configure-gitlab") {
    return (
      <div className="w-full space-y-4">
        <GitLabConfigure
          onBack={() => setView("explore")}
          onBackToIntegrations={() => setView("main")}
        />
      </div>
    );
  }

  if (view === "configure-teams") {
    return (
      <div className="w-full space-y-4">
        <MicrosoftTeamsConfigure
          onBack={() => setView("explore")}
          onBackToIntegrations={() => setView("main")}
        />
      </div>
    );
  }

  if (view === "explore") {
    return (
      <div className="w-full space-y-4">
        <ExploreApps
          onBack={() => setView("main")}
          onConfigureApp={(appId) => {
            if (appId === "teams") setView("configure-teams");
            if (appId === "gitlab") setView("configure-gitlab");
            if (appId === "slack") setView("configure-slack");
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-1">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--primary)] tracking-tight">Integrations &amp; Authorizations</h2>
        <p className="text-xs text-muted-foreground">
          Manage your app integrations and their authorization settings
        </p>
      </div>
      <DataTable
        columns={columns}
        data={apps}
        // searchPlaceholder="Search Apps"
        enableGlobalFilter={true}
        onRowSelectionChange={setSelectedApps}
        emptyMessage="No apps installed."
        toolbarActions={
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 h-10 px-6 text-primary-foreground font-medium rounded-md"
            onClick={() => setView("explore")}
          >
            Explore Apps
          </Button>
        }
      />
    </div>
  );
}
