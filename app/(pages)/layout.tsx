
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthHookStore } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header/Header";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useNetworkStore } from "@/stores/network-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isSidebarOpen = useSidebarStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useSidebarStore((state) => state.setSidebarOpen);
  const isAuthenticated = useAuthHookStore(useAuthStore, (state) => state.isAuthenticated);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if current page is settings
  const isSettingsPage = pathname?.startsWith("/settings");

  useEffect(() => {
    if (isAuthenticated === undefined) {
      return;
    } else if (!isAuthenticated) {
      router.replace("/login");
    }
    setCheckingAuth(false);
  }, [isAuthenticated, router]);

  // Auto-close sidebar when navigating to /mailbox
  // useEffect(() => {
  //   if (pathname.startsWith("/mailbox")) {
  //     setSidebarOpen(false); // close sidebar
  //   } else {
  //     setSidebarOpen(true); // open sidebar on other pages
  //   }
  // }, [pathname, setSidebarOpen]);

  // // Auto-close sidebar when navigating to /docs
  //  useEffect(() => {
  //   if (pathname.startsWith("/docs")) {
  //     setSidebarOpen(false); // close sidebar
  //   } else {
  //     setSidebarOpen(true); // open sidebar on other pages
  //   }
  // }, [pathname, setSidebarOpen]);

  //   useEffect(() => {
  //   if (
  //     pathname.startsWith("/mailbox") ||
  //     pathname.startsWith("/docs") 
  //   ) {
  //     setSidebarOpen(false); // close sidebar
  //   } else {
  //     setSidebarOpen(true); // open sidebar
  //   }
  // }, [pathname]);
  useEffect(() => {
    const sidebarClosedRoutes = [
      "/mailbox",
      "/docs",
      "/automations",
      "/workflows",
    ];

    const shouldCloseSidebar = sidebarClosedRoutes.some(route =>
      pathname.startsWith(route)
    );

    setSidebarOpen(!shouldCloseSidebar);
  }, [pathname]);

  if (checkingAuth) {
    return null;
  }

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="relative w-full h-screen flex flex-col">
        {/* Header - Full Width, Fixed Height */}
        {isOnline && (
          <div className="w-full border-b border-muted-foreground flex-shrink-0 z-50 sticky top-0 no-print">
            <Header />
          </div>
        )}

        {/* Main Layout - Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden sticky">
          {/* Sidebar Container with Trigger positioned on right */}
          <div className="relative no-print">
            <AppSidebar />

            {/* SidebarTrigger positioned absolutely on the right edge of sidebar */}
            <div className="absolute -right-8 z-50 p-0 no-print">
              <SidebarTrigger className="h-8 w-8 text-foreground hover:bg-muted" />
            </div>
          </div>

          {/* Main Content */}
          <SidebarInset className="flex-1 overflow-auto">
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
