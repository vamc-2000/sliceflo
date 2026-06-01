"use client";

import React, { useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import Image from "next/image";
import {
    Layout,
    CheckSquare,
    PieChart,
    GitBranch,
    FileText,
    Users,
    MessageSquare,
    ShieldAlert,
    Clock,
    ChevronDown
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NotificationItem from "../accountSettings/NotificationItem";
import { useProfileStore } from "@/stores/profile-store";
import { ProjectIcon } from "@/public/icons/project";
import DocsIcon from "@/public/icons/docs";
import TimesheetIcon from "@/public/icons/timesheet";



const permissionGroups = [
    { 
        id: "account", 
      title: "Account",
       icon: <div className="w-10 h-10"><Image src="/images/Male User.svg" alt="Account" width={40} height={40} /></div> },
    { id: "projects", title: "Projects", icon: <div className="w-10 h-10"><Image src="/images/Blueprint.svg" alt="Projects" width={40} height={40} /></div> },
    { id: "tasks", title: "Tasks", icon: <div className="w-10 h-10 rounded-lg flex items-center justify-center"><Image src="/images/List.svg" alt="Tasks" width={40} height={40} /></div> },
    { id: "dashboards", title: "Dashboards", icon: <div className="w-10 h-10  rounded-lg flex items-center justify-center"><Image src="/images/Control Panel.svg" alt="Dashboards" width={40} height={40} /></div> },
    { id: "workflow", title: "Workflow", icon: <div className="w-10 h-10"><Image src="/images/Tree Structure.svg" alt="Workflow" width={40} height={40} /></div> },
    { id: "docs", title: "Docs", icon: <div className="w-10 h-10  rounded-lg flex items-center justify-center"><Image src="/images/Spreadsheet.svg" alt="Docs" width={40} height={40} /></div> },
    { id: "user-management", title: "User Management", icon: <div className="w-10 h-10  rounded-lg flex items-center justify-center"><Image src="/images/User Management.svg" alt="User Management" width={40} height={40} /></div> },
    { id: "discussions", title: "Discussions", icon: <div className="w-10 h-10  rounded-lg flex items-center justify-center"><Image src="/images/Communication.svg" alt="Discussions" width={40} height={40} /></div> },
    { id: "admin-privileges", title: "Admin Privileges", icon: <div className="w-10 h-10  rounded-lg flex items-center justify-center"><Image src="/images/Administrator Male.svg" alt="Admin Privileges" width={40} height={40} /></div> },
    { id: "timesheet", title: "Timesheet-Working capacity", icon: <div className="w-10 h-10  rounded-lg flex items-center justify-center"><Image src="/images/Spreadsheet.svg" alt="Timesheet" width={40} height={40} /></div> },
];
export default function PermissionPage() {
    const { workspaceRoles } = useProfileStore();
    const [activeTab, setActiveTab] = useState("Admin");
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // Permission states for Account
    const [accountPermissions, setAccountPermissions] = useState({
        inviteUsers: false,
        inviteGuests: false,
        uploadFiles: false,
        deleteFiles: false,
        createWorkspaces: false,
        mentionEveryone: false,
        generateTokens: false,
        createAutomations: false,
        createIntegrations: false,
        experimentalFeatures: false,
        editSchedules: false,
        viewAutomationUsage: false,
        createProjectsPortfolios: false,
        workspaceOwnerAssets: false,
    });

    // Permission states for Projects
    const [projectPermissions, setProjectPermissions] = useState({
        createMainProjects: false,
        createPrivateProjects: false,
        createShareableProjects: false,
        deleteArchiveSelfProjects: false,
        broadcastWeb: false,
        createProjectViews: false,
        deleteSelfViews: false,
        deleteOtherViews: false,
        exportExcel: false,
        moveGroups: false,
    });

    // Permission states for Tasks
    const [tasksPermissions, setTasksPermissions] = useState({
        deleteSelfItems: false,
        deleteOtherItems: false,
        moveItems: false,
        createDocsOnItems: false,
    });

    // Permission states for Dashboards
    const [dashboardsPermissions, setDashboardsPermissions] = useState({
        createMainDashboards: false,
    });

    // Permission states for Workflow
    const [workflowPermissions, setWorkflowPermissions] = useState({
        createMainWorkflow: false,
        createPrivateWorkflow: false,
    });

    // Permission states for Docs
    const [docsPermissions, setDocsPermissions] = useState({
        createMainDocs: false,
        createPrivateDocs: false,
        createShareableDocs: false,
    });

    // Permission states for User Management
    const [userManagementPermissions, setUserManagementPermissions] = useState({
        createTeams: false,
        deleteTeamsOwnedByUser: false,
        editTeamNameImage: false,
        addRemoveMembers: false,
        manageAllTeams: false,
        viewTeamsPage: false,
        uploadProfilePicture: false,
        assignUsersToSchedules: false,
    });

    // Permission states for Discussions
    const [discussionsPermissions, setDiscussionsPermissions] = useState({
        muteBoardNotifications: false,
        createItemUpdates: false,
        editSelfUpdates: false,
        deleteSelfUpdates: false,
        dynamicEmails: false,
    });

    // Permission states for Admin Privileges
    const [adminPrivilegesPermissions, setAdminPrivilegesPermissions] = useState({
        viewPermissions: false,
        accessUserManagement: false,
        accessSecurity: false,
        accessBilling: false,
        accessContentDirectory: false,
        accessApps: false,
    });

    // Permission states for Timesheet
    const [timesheetPermissions, setTimesheetPermissions] = useState({
        capacityType: "daily",
        hours: 0,
    });

    const renderGroupContent = (groupId: string) => {
        switch (groupId) {
            case "account":
                return (
                    <div className="py-4 space-y-4">
                        <NotificationItem
                            label="Invite users from non-authorized domains"
                            checked={accountPermissions.inviteUsers}
                            onChange={(checked) => setAccountPermissions(prev => ({ ...prev, inviteUsers: checked }))}
                        />
                        <NotificationItem
                            label="Invite guests"
                            checked={accountPermissions.inviteGuests}
                            onChange={(checked) => setAccountPermissions(prev => ({ ...prev, inviteGuests: checked }))}
                        />
                        <div className="flex items-center justify-between pr-4">
                            <NotificationItem
                                label="Upload files in boards and docs"
                                checked={accountPermissions.uploadFiles}
                                onChange={(checked) => setAccountPermissions(prev => ({ ...prev, uploadFiles: checked }))}
                            />
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <NotificationItem
                            label="Delete files"
                            checked={accountPermissions.deleteFiles}
                            onChange={(checked) => setAccountPermissions(prev => ({ ...prev, deleteFiles: checked }))}
                        />
                        <div className="flex items-center justify-between pr-4">
                            <NotificationItem
                                label="Create workspaces"
                                checked={accountPermissions.createWorkspaces}
                                onChange={(checked) => setAccountPermissions(prev => ({ ...prev, createWorkspaces: checked }))}
                            />
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <NotificationItem
                            label="@Mention/Subscribe everyone at account"
                            checked={accountPermissions.mentionEveryone}
                            onChange={(checked) => setAccountPermissions(prev => ({ ...prev, mentionEveryone: checked }))}
                        />
                        <NotificationItem
                            label="Generate API tokens"
                            checked={accountPermissions.generateTokens}
                            onChange={(checked) => setAccountPermissions(prev => ({ ...prev, generateTokens: checked }))}
                        />
                        <NotificationItem
                            label="Create automations / integrations"
                            checked={accountPermissions.createAutomations}
                            onChange={(checked) => setAccountPermissions(prev => ({ ...prev, createAutomations: checked }))}
                        />
                        <div className="flex items-center justify-between pr-4">
                            <NotificationItem
                                label="Create integrations"
                                checked={accountPermissions.createIntegrations}
                                onChange={(checked) => setAccountPermissions(prev => ({ ...prev, createIntegrations: checked }))}
                            />
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <NotificationItem
                            label="Examine experimental features using SliceFlo.labs"
                            checked={accountPermissions.experimentalFeatures}
                            onChange={(checked) => setAccountPermissions(prev => ({ ...prev, experimentalFeatures: checked }))}
                        />
                        <NotificationItem
                            label="Edit schedules"
                            checked={accountPermissions.editSchedules}
                            onChange={(checked) => setAccountPermissions(prev => ({ ...prev, editSchedules: checked }))}
                        />
                        <NotificationItem
                            label="View automation usage page"
                            checked={accountPermissions.viewAutomationUsage}
                            onChange={(checked) => setAccountPermissions(prev => ({ ...prev, viewAutomationUsage: checked }))}
                        />
                        <NotificationItem
                            label="Create projects and portfolios"
                            checked={accountPermissions.createProjectsPortfolios}
                            onChange={(checked) => setAccountPermissions(prev => ({ ...prev, createProjectsPortfolios: checked }))}
                        />
                        <NotificationItem
                            label="Workspace owners can add themselves as owners to assets in their workspace"
                            checked={accountPermissions.workspaceOwnerAssets}
                            onChange={(checked) => setAccountPermissions(prev => ({ ...prev, workspaceOwnerAssets: checked }))}
                        />
                    </div>
                );
            case "projects":
                return (
                    <div className="py-4 space-y-4">
                        <NotificationItem
                            label="Create main projects"
                            checked={projectPermissions.createMainProjects}
                            onChange={(checked) => setProjectPermissions(prev => ({ ...prev, createMainProjects: checked }))}
                        />
                        <NotificationItem
                            label="Create private projects"
                            checked={projectPermissions.createPrivateProjects}
                            onChange={(checked) => setProjectPermissions(prev => ({ ...prev, createPrivateProjects: checked }))}
                        />
                        <NotificationItem
                            label="Create shareable projects"
                            checked={projectPermissions.createShareableProjects}
                            onChange={(checked) => setProjectPermissions(prev => ({ ...prev, createShareableProjects: checked }))}
                        />
                        <NotificationItem
                            label="Delete/Archive self owned projects"
                            checked={projectPermissions.deleteArchiveSelfProjects}
                            onChange={(checked) => setProjectPermissions(prev => ({ ...prev, deleteArchiveSelfProjects: checked }))}
                        />
                        <NotificationItem
                            label="Broadcast projects on the web using public link"
                            checked={projectPermissions.broadcastWeb}
                            onChange={(checked) => setProjectPermissions(prev => ({ ...prev, broadcastWeb: checked }))}
                        />
                        <NotificationItem
                            label="Create project views"
                            checked={projectPermissions.createProjectViews}
                            onChange={(checked) => setProjectPermissions(prev => ({ ...prev, createProjectViews: checked }))}
                        />
                        <NotificationItem
                            label="Delete self-created views"
                            checked={projectPermissions.deleteSelfViews}
                            onChange={(checked) => setProjectPermissions(prev => ({ ...prev, deleteSelfViews: checked }))}
                        />
                        <NotificationItem
                            label="Delete views created by other users"
                            checked={projectPermissions.deleteOtherViews}
                            onChange={(checked) => setProjectPermissions(prev => ({ ...prev, deleteOtherViews: checked }))}
                        />
                        <NotificationItem
                            label="Export data to excel"
                            checked={projectPermissions.exportExcel}
                            onChange={(checked) => setProjectPermissions(prev => ({ ...prev, exportExcel: checked }))}
                        />
                        <NotificationItem
                            label="Move groups to other projects"
                            checked={projectPermissions.moveGroups}
                            onChange={(checked) => setProjectPermissions(prev => ({ ...prev, moveGroups: checked }))}
                        />
                    </div>
                );
            case "tasks":
                return (
                    <div className="py-4 space-y-4">
                        <NotificationItem
                            label="Delete self-created items"
                            checked={tasksPermissions.deleteSelfItems}
                            onChange={(checked) => setTasksPermissions(prev => ({ ...prev, deleteSelfItems: checked }))}
                        />
                        <NotificationItem
                            label="Delete items created by other users"
                            checked={tasksPermissions.deleteOtherItems}
                            onChange={(checked) => setTasksPermissions(prev => ({ ...prev, deleteOtherItems: checked }))}
                        />
                        <NotificationItem
                            label="Move items to other boards"
                            checked={tasksPermissions.moveItems}
                            onChange={(checked) => setTasksPermissions(prev => ({ ...prev, moveItems: checked }))}
                        />
                        <NotificationItem
                            label="Create docs on items"
                            checked={tasksPermissions.createDocsOnItems}
                            onChange={(checked) => setTasksPermissions(prev => ({ ...prev, createDocsOnItems: checked }))}
                        />
                    </div>
                );
            case "dashboards":
                return (
                    <div className="py-4 space-y-4">
                        <NotificationItem
                            label="Create main dashboards"
                            checked={dashboardsPermissions.createMainDashboards}
                            onChange={(checked) => setDashboardsPermissions(prev => ({ ...prev, createMainDashboards: checked }))}
                        />
                    </div>
                );
            case "workflow":
                return (
                    <div className="py-4 space-y-4">
                        <NotificationItem
                            label="Create main workflow"
                            checked={workflowPermissions.createMainWorkflow}
                            onChange={(checked) => setWorkflowPermissions(prev => ({ ...prev, createMainWorkflow: checked }))}
                        />
                        <NotificationItem
                            label="Create private workflow"
                            checked={workflowPermissions.createPrivateWorkflow}
                            onChange={(checked) => setWorkflowPermissions(prev => ({ ...prev, createPrivateWorkflow: checked }))}
                        />
                    </div>
                );
            case "docs":
                return (
                    <div className="py-4 space-y-4">
                        <NotificationItem
                            label="Create main docs"
                            checked={docsPermissions.createMainDocs}
                            onChange={(checked) => setDocsPermissions(prev => ({ ...prev, createMainDocs: checked }))}
                        />
                        <NotificationItem
                            label="Create private docs"
                            checked={docsPermissions.createPrivateDocs}
                            onChange={(checked) => setDocsPermissions(prev => ({ ...prev, createPrivateDocs: checked }))}
                        />
                        <NotificationItem
                            label="Create shareable docs"
                            checked={docsPermissions.createShareableDocs}
                            onChange={(checked) => setDocsPermissions(prev => ({ ...prev, createShareableDocs: checked }))}
                        />
                    </div>
                );
            case "user-management":
                return (
                    <div className="py-4 space-y-4">
                        <NotificationItem
                            label="Create teams"
                            checked={userManagementPermissions.createTeams}
                            onChange={(checked) => setUserManagementPermissions(prev => ({ ...prev, createTeams: checked }))}
                        />
                        <NotificationItem
                            label="Delete teams owned by the user"
                            checked={userManagementPermissions.deleteTeamsOwnedByUser}
                            onChange={(checked) => setUserManagementPermissions(prev => ({ ...prev, deleteTeamsOwnedByUser: checked }))}
                        />
                        <NotificationItem
                            label="Edit team name and image for teams owned by the user"
                            checked={userManagementPermissions.editTeamNameImage}
                            onChange={(checked) => setUserManagementPermissions(prev => ({ ...prev, editTeamNameImage: checked }))}
                        />
                        <NotificationItem
                            label="Add/Remove members from teams owned by the user"
                            checked={userManagementPermissions.addRemoveMembers}
                            onChange={(checked) => setUserManagementPermissions(prev => ({ ...prev, addRemoveMembers: checked }))}
                        />
                        <NotificationItem
                            label="Manage all teams"
                            checked={userManagementPermissions.manageAllTeams}
                            onChange={(checked) => setUserManagementPermissions(prev => ({ ...prev, manageAllTeams: checked }))}
                        />
                        <NotificationItem
                            label="View the Teams page and team cards"
                            checked={userManagementPermissions.viewTeamsPage}
                            onChange={(checked) => setUserManagementPermissions(prev => ({ ...prev, viewTeamsPage: checked }))}
                        />
                        <NotificationItem
                            label="Upload profile picture"
                            checked={userManagementPermissions.uploadProfilePicture}
                            onChange={(checked) => setUserManagementPermissions(prev => ({ ...prev, uploadProfilePicture: checked }))}
                        />
                        <NotificationItem
                            label="Assign users to schedules"
                            checked={userManagementPermissions.assignUsersToSchedules}
                            onChange={(checked) => setUserManagementPermissions(prev => ({ ...prev, assignUsersToSchedules: checked }))}
                        />
                    </div>
                );
            case "discussions":
                return (
                    <div className="py-4 space-y-4">
                        <NotificationItem
                            label="Project owners can mute board notifications for all users"
                            checked={discussionsPermissions.muteBoardNotifications}
                            onChange={(checked) => setDiscussionsPermissions(prev => ({ ...prev, muteBoardNotifications: checked }))}
                        />
                        <NotificationItem
                            label="Create item updates and doc comments"
                            checked={discussionsPermissions.createItemUpdates}
                            onChange={(checked) => setDiscussionsPermissions(prev => ({ ...prev, createItemUpdates: checked }))}
                        />
                        <NotificationItem
                            label="Edit self-owned item updates and doc comments"
                            checked={discussionsPermissions.editSelfUpdates}
                            onChange={(checked) => setDiscussionsPermissions(prev => ({ ...prev, editSelfUpdates: checked }))}
                        />
                        <NotificationItem
                            label="Delete self-owned item updates and doc comments"
                            checked={discussionsPermissions.deleteSelfUpdates}
                            onChange={(checked) => setDiscussionsPermissions(prev => ({ ...prev, deleteSelfUpdates: checked }))}
                        />
                        <NotificationItem
                            label="Receive and interact with dynamic emails (AMP / Actionable messages)"
                            checked={discussionsPermissions.dynamicEmails}
                            onChange={(checked) => setDiscussionsPermissions(prev => ({ ...prev, dynamicEmails: checked }))}
                        />
                    </div>
                );
            case "admin-privileges":
                return (
                    <div className="py-4 space-y-4">
                        <NotificationItem
                            label="View the Permissions section"
                            checked={adminPrivilegesPermissions.viewPermissions}
                            onChange={(checked) => setAdminPrivilegesPermissions(prev => ({ ...prev, viewPermissions: checked }))}
                        />
                        <NotificationItem
                            label="Access the User management section"
                            checked={adminPrivilegesPermissions.accessUserManagement}
                            onChange={(checked) => setAdminPrivilegesPermissions(prev => ({ ...prev, accessUserManagement: checked }))}
                        />
                        <NotificationItem
                            label="Access the Security section"
                            checked={adminPrivilegesPermissions.accessSecurity}
                            onChange={(checked) => setAdminPrivilegesPermissions(prev => ({ ...prev, accessSecurity: checked }))}
                        />
                        <NotificationItem
                            label="Access the Billing section"
                            checked={adminPrivilegesPermissions.accessBilling}
                            onChange={(checked) => setAdminPrivilegesPermissions(prev => ({ ...prev, accessBilling: checked }))}
                        />
                        <NotificationItem
                            label="Access the Content Directory section"
                            checked={adminPrivilegesPermissions.accessContentDirectory}
                            onChange={(checked) => setAdminPrivilegesPermissions(prev => ({ ...prev, accessContentDirectory: checked }))}
                        />
                        <NotificationItem
                            label="Access the Apps section"
                            checked={adminPrivilegesPermissions.accessApps}
                            onChange={(checked) => setAdminPrivilegesPermissions(prev => ({ ...prev, accessApps: checked }))}
                        />
                    </div>
                );
            case "timesheet":
                return (
                    <div className="py-6 space-y-6 pl-14 pr-6">
                        {/* Members capacity row */}
                        <div className="flex items-center">
                            <Label className="text-sm font-medium text-[var(--muted-foreground)] w-40 shrink-0">Members capacity</Label>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setTimesheetPermissions(prev => ({ ...prev, capacityType: "daily" }))}
                                    className={cn(
                                        "h-9 w-28 text-sm font-medium transition-all rounded-lg",
                                        timesheetPermissions.capacityType === "daily"
                                            ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                                    )}
                                >
                                    Daily
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setTimesheetPermissions(prev => ({ ...prev, capacityType: "weekly" }))}
                                    className={cn(
                                        "h-9 w-28 text-sm font-medium transition-all rounded-lg",
                                        timesheetPermissions.capacityType === "weekly"
                                            ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                                    )}
                                >
                                    Weekly
                                </Button>
                            </div>
                        </div>

                        {/* Hours row */}
                        <div className="flex items-center">
                            <Label className="text-sm font-medium text-[var(--muted-foreground)] w-40 shrink-0">
                                {timesheetPermissions.capacityType === "daily" ? "Daily hours" : "Weekly hours"}
                            </Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={timesheetPermissions.hours || ""}
                                onChange={(e) => setTimesheetPermissions(prev => ({ ...prev, hours: e.target.value === "" ? 0 : parseFloat(e.target.value) }))}
                                className="w-[240px] text-right bg-background border-border rounded-lg h-10"
                            />
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="px-6 py-4 text-sm text-muted-foreground bg-muted dark:bg-gray-800/20 rounded-b-lg border-t border-gray-100 dark:border-gray-700">
                        <p>Configure {groupId} permissions for the {activeTab} role.</p>
                    </div>
                );
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div>
                <h2 className="text-[16px] font-semibold text-foreground tracking-tight">Permissions</h2>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                    Configure granular access levels and functional permissions for each user role in your workspace.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-xl w-fit">
                {workspaceRoles.map((role) => (
                    <Button
                        key={role.id}
                        variant="ghost"
                        onClick={() => setActiveTab(role.name)}
                        className={cn(
                            "h-8 px-5 text-[13px] font-medium transition-all rounded-lg",
                            activeTab === role.name
                                ? "bg-background text-foreground shadow-sm hover:bg-background"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                    >
                        {role.name}
                    </Button>
                ))}
            </div>

            {/* Accordion List */}
            <div className="space-y-2 mt-2">
                {permissionGroups.map((group) => (
                    <SettingsCard
                        key={group.id}
                        id={group.id}
                        title={group.title}
                        icon={group.icon}
                        isActive={activeSection === group.id}
                        onToggle={() => setActiveSection((prev) => (prev === group.id ? null : group.id))}
                    >
                        {renderGroupContent(group.id)}
                    </SettingsCard>
                ))}
            </div>
        </div>
    );
}
