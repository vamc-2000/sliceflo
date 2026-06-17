
"use client";

import React, { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

interface MenuItem {
  id: string;
  text: string;
}

interface SettingsLayoutProps {
  title: ReactNode;
  subtitle?: ReactNode;
  menuItems: MenuItem[];
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const SettingsLayout = ({
  title,
  subtitle,
  menuItems,
  children,
  activeTab,
  onTabChange,
}: SettingsLayoutProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const activeSection = searchParams.get("section") || menuItems[0].id;

  const handleSectionChange = (sectionId: string) => {
    router.replace(`/settings?tab=${activeTab}&section=${sectionId}`);
    setMobileOpen(false);
  };

  const Sidebar = () => (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm transition-colors duration-200">
      {menuItems.map((item, index) => (
        <React.Fragment key={item.id}>
          <button
            onClick={() => handleSectionChange(item.id)}
            className={cn(
              "w-full text-left px-4 py-3 font-inter text-[14px] font-normal leading-5 transition-all relative bg-card dark:bg-neutral-900 tracking-[0px]",
              activeSection === item.id
                ? "text-foreground font-semibold"
                : "text-foreground hover:bg-muted dark:hover:bg-neutral-800"
            )}
          >
            {activeSection === item.id && (
              <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-foreground" />
            )}
            <span className={cn(activeSection === item.id ? "ml-2" : "")}>
              {item.text}
            </span>
          </button>
          {index < menuItems.length - 1 && (
            <div className="border-b border-border" />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-background font-inter overflow-hidden transition-colors duration-200">
      {/* FIXED SETTINGS HEADER */}
      <div className="bg-background flex-shrink-0 transition-colors duration-200 min-h-12 flex items-center py-2">
        <div className="pl-10 pr-4 md:pr-6 w-full">
          <div className="flex flex-row items-center justify-between gap-4 w-full">
            {/* Left Title */}
            <div className="font-inter text-[18px] font-semibold leading-[1.2] text-foreground tracking-[0px]">
              {title}
              {subtitle && (
                <div className="text-sm text-muted-foreground mt-0">
                  {subtitle}
                </div>
              )}
            </div>

            {/* Right Tabs */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-muted dark:bg-neutral-800 transition-colors duration-200">
              <button
                onClick={() => onTabChange("account")}
                className={cn(
                  "px-4 py-1 font-inter text-[14px] font-medium leading-5 transition-all whitespace-nowrap tracking-[0px] rounded-md",
                  activeTab === "account"
                    ? "bg-white text-black shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground bg-transparent"
                )}
              >
                Account
              </button>
              <button
                onClick={() => onTabChange("workspace")}
                className={cn(
                  "px-4 py-1 font-inter text-[14px] font-medium leading-5 transition-all whitespace-nowrap tracking-[0px] rounded-md",
                  activeTab === "workspace"
                    ? "bg-white text-black shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground bg-transparent"
                )}
              >
                Workspace
              </button>

              {/* Mobile Menu Button */}
              <Button
                variant="outline"
                size="icon"
                className="md:hidden ml-1 border-border"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>

          </div>
        </div>
      </div>
      <Separator className="mt-1 mb-0" />

      {/* MOBILE SIDEBAR */}
      {mobileOpen && (
        <div className="md:hidden px-4 py-4 border-b bg-muted/30 dark:bg-neutral-900 flex-shrink-0 max-h-96 overflow-y-auto">
          <Sidebar />
        </div>
      )}

      {/* MAIN CONTENT AREA - SCROLLABLE */}
      <div className="flex w-full overflow-hidden">
        <div className="h-full w-full px-4 md:px-6 py-6">
          <div className="flex gap-6 h-full w-full">
            {/* FIXED SIDEBAR - Desktop */}
            <aside className="hidden md:block w-60 flex-shrink-0">
              <Sidebar />
            </aside>

            {/* SCROLLABLE CONTENT ONLY */}
            <main className="flex flex-col w-full overflow-y-auto font-inter text-[14px] font-normal leading-5 tracking-[0px] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
