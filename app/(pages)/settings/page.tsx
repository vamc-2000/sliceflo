
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import ProfileSettingsPage from "@/components/settings/accountSettings/ProfileSettingsPage";
import SettingsLayout from "@/components/layout/SettingPagesLayout";
import Preference from "@/components/settings/accountSettings/Preferences";
import NotificationsPage from "@/components/settings/accountSettings/NotificationsPage";
import SocialLinksPage from "@/components/settings/accountSettings/SocialLinksPage";
import SecurityAndPasswordPage from "@/components/settings/accountSettings/SecurityAndPasswordPage";
import Developer from "@/components/settings/accountSettings/Developer";
import SessionHistory from "@/components/settings/accountSettings/SessionHistory";
import ActivityLog from "@/components/settings/accountSettings/ActivityLog";
import AccountManagementPage from "@/components/settings/accountSettings/AccountManagementPage";
import UserManagementPage from "@/components/settings/workspaceSettings/UserManagementPage";
import GeneralPage from "@/components/settings/workspaceSettings/GeneralPage";
import IntegrationsAuthorizations from "@/components/settings/workspaceSettings/IntegrationsAuthorizations";
import ImportAuthorizationPage from "@/components/settings/workspaceSettings/ImportAuthorizationPage";
import PaymentsSubscriptionsPage from "@/components/settings/accountSettings/PaymentsSubscriptionsPage";
import CleanUp from "@/components/settings/workspaceSettings/CleanUpPage";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import SecurityPage from "@/components/settings/workspaceSettings/SecurityPage";
import UseRole from "@/components/settings/workspaceSettings/UseRole";
import PermissionPage from "@/components/settings/workspaceSettings/PermissionPage";
import FeaturePage from "@/components/settings/workspaceSettings/FeaturePage";



interface MenuItem {
  id: string;
  text: string;
}

const accountMenuItems: MenuItem[] = [
  { id: "profile", text: "Profile" },
  { id: "preferences", text: "Preferences" },
  { id: "notifications", text: "Notifications" },
  { id: "socialLinks", text: "Social links" },
  { id: "billingsubscriptions", text: "Billing & Subscription" },
  { id: "security", text: "Security" },
  { id: "userrole", text: "User Roles" },
  { id: "permissions", text: "Permissions" },
  { id: "sessionhistory", text: "Session History" },
  { id: "acitvitylog", text: "Activity log" },
  { id: "accountmanagement", text: "Account Management" },
  { id: "developer", text: "Developer" },
];

const workspaceMenuItems: MenuItem[] = [
  { id: "general", text: "General" },
  { id: "features", text: "Features" },
  { id: "security", text: "Security" },
  { id: "userManagement", text: "User Management" },
  { id: "integrations", text: "Integrations & Authorizations" },

  { id: "importexport", text: "Export & Import" },
  { id: "permissions", text: "Permissions" },
  { id: "cleanup", text: "Clean Up" },
];

const projectMenuItems: MenuItem[] = [
  { id: "general", text: "General" },
  { id: "permissions", text: "Permissions" },
  { id: "import", text: "Import" },
  { id: "payment", text: "Payment" },
  { id: "cleanUp", text: "Clean Up" },
];

type TabType = "account" | "workspace" | "projects";

const SettingsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get("tab") as TabType) || "account";
  const activeSection = searchParams.get("section") || "";

  const getCurrentMenuItems = (): MenuItem[] => {
    switch (activeTab) {
      case "account":
        return accountMenuItems;
      case "workspace":
        return workspaceMenuItems;
      case "projects":
        return projectMenuItems;
      default:
        return accountMenuItems;
    }
  };

  const currentMenuItems = getCurrentMenuItems();

  const handleTabChange = (tab: string) => {
    const newMenuItems =
      tab === "account"
        ? accountMenuItems
        : tab === "workspace"
          ? workspaceMenuItems
          : projectMenuItems;

    router.replace(`/settings?tab=${tab}&section=${newMenuItems[0].id}`);
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  const renderContent = () => {
    if (activeTab === "account") {
      switch (activeSection || "profile") {
        case "profile":
          return <ProfileSettingsPage />;
        case "preferences":
          return <Preference />;
        case "notifications":
          return <NotificationsPage />;
        case "socialLinks":
          return <SocialLinksPage />;
        case "billingsubscriptions":
          return <PaymentsSubscriptionsPage />;
        case "security":
          return <SecurityAndPasswordPage />;
        case "permissions":
          return <PermissionPage />;
        case "userrole":
          return <UseRole />;
        case "sessionhistory":
          return <SessionHistory />;
        case "acitvitylog":
          return <ActivityLog />;
        case "accountmanagement":
          return <AccountManagementPage />;
        case "developer":
          return <Developer />;
        default:
          return <ProfileSettingsPage />;
      }
    } else if (activeTab === "workspace") {
      switch (activeSection || "general") {
        case "general":
          return <GeneralPage />;
        case "features":
          return <FeaturePage />;
        case "security":
          return <SecurityPage />;
        case "userManagement":
          return <UserManagementPage />;
        case "integrations":
          return <IntegrationsAuthorizations />;
        case "importexport":
          return <ImportAuthorizationPage />;
        case "permissions":
          return <div className="p-6 text-muted-foreground">permissions section comming soon</div>;
        case "cleanup":
          return <CleanUp />;
        default:
          return <GeneralPage />;
      }
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background transition-colors duration-200">
      <div className="flex w-full min-h-0">
        <SettingsLayout
          title={
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-1.5 bg-muted/50 border border-border hover:bg-muted dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded transition-colors flex items-center justify-center"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </button>

              <div className="flex flex-col">
                <span className="text-base font-semibold text-[#001F3F] dark:text-foreground">
                  Settings
                </span>

                <span className="text-xs text-muted-foreground font-normal">
                  Manage your account and workspace settings
                </span>
              </div>
            </div>
          }
          menuItems={currentMenuItems}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        >
          {renderContent()}
        </SettingsLayout>
      </div>
    </div>
  );
};

export default SettingsPage;
