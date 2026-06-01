"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Plus, Search, FolderPlus, Settings, Home, Mail, User, List, Layout, PlusSquare, Folder, Layers, Briefcase } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Image from "next/image";
import MobileAppPopup from "@/components/settings/Mobileappspopup";
import InviteMembersModal from "@/components/settings/InviteMembersModal";
import UserSettings from "./UserSettings";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/stores/profile-store";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "react-hot-toast";
import LogoutConfirmModal from "@/components/LogoutConfirmModal";
export function Header() {
    const { user: profile, fetchUserProfile } = useProfileStore();
    const { theme } = useTheme();

    const [showMobilePopup, setShowMobilePopup] = useState(false);
    const [showInvitePopup, setShowInvitePopup] = useState(false);
    const [isUserPopOpen, setUserPopOpen] = useState(false);
    const [isSearchOpen, setSearchOpen] = useState(false);
    const router = useRouter();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [mounted, setMounted] = useState(false);

    const authStore = useAuthStore();

    useEffect(() => {
        setMounted(true);
        fetchUserProfile();
    }, [fetchUserProfile]);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            if (authStore.logout) {
                await authStore.logout().catch(console.error);
            }
            toast.success("Logout successful");
            router.push("/logout");
            setShowLogoutModal(false);
        } catch (error) {
            console.error("Logout failed:", error);
            toast.error("An error occurred while logging out. Please try again.");
        } finally {
            setIsLoggingOut(false);
        }
    };

    const userName = profile?.name || "User";
    const profilePictureUrl = profile?.profilePictureUrl || "";

   
    const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || "";
    const fullProfileUrl = profilePictureUrl
        ? profilePictureUrl.startsWith("http")
            ? profilePictureUrl
            : `${s3BaseUrl.replace(/\/$/, "")}/${profilePictureUrl}` // Remove trailing slash, add one back
        : "";

    const initials = userName
        ? userName
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
        : "U";

    return (
        <header className="flex items-center justify-between px-4 py-1.5 bg-header transition-colors duration-300 border-b border-border/10">
            <div className="flex items-center">
                          <Image
                            src="/sidebarlogo.png"
                            alt="SliceFlo Logo"
                            width={120}
                            height={32}
                            className={cn(
                                "transition-all duration-200",
                                mounted && theme === "light" && "filter invert hue-rotate-180 grayscale-0 contrast-125"
                            )}
                          />
                        </div>

            <div className="ml-8">
                <Popover open={isSearchOpen} onOpenChange={setSearchOpen}>
                    <PopoverTrigger asChild>
                        <div className={cn(
                            "relative group cursor-pointer transition-all duration-300 ease-in-out overflow-hidden",
                            isSearchOpen ? "w-[500px]" : "w-90"
                        )}>
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-header-foreground/50 group-hover:text-header-foreground transition-colors" />
                            </div>
                            <div className="h-9 w-full rounded-md bg-header-foreground/10 text-header-foreground/50 flex items-center px-10 text-xs border border-transparent hover:bg-header-foreground/15 transition-all whitespace-nowrap overflow-hidden">
                                Search documentation...
                            </div>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[500px] shadow-2xl border-border/50 animate-in fade-in zoom-in-95 duration-200" align="start" sideOffset={4}>
                        <Command className="rounded-xl border shadow-md">
                            <CommandInput placeholder="Search commands..." className="h-12" />
                            <CommandList className="max-h-[450px] scrollbar-none">
                                <CommandEmpty>No results found.</CommandEmpty>
                                
                                <CommandGroup heading="Create" className="px-2">
                                    <CommandItem className="rounded-lg flex items-center gap-2 py-2.5 cursor-pointer">
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">New work item</span>
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">N</kbd>
                                            <span className="text-[10px] text-muted-foreground">then</span>
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">I</kbd>
                                        </div>
                                    </CommandItem>
                                    <CommandItem 
                                        className="rounded-lg flex items-center gap-2 py-2.5 cursor-pointer"
                                        onSelect={() => {
                                            router.push("/project");
                                            setSearchOpen(false);
                                        }}
                                    >
                                        <FolderPlus className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">New project</span>
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">N</kbd>
                                            <span className="text-[10px] text-muted-foreground">then</span>
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">P</kbd>
                                        </div>
                                    </CommandItem>
                                    <CommandItem className="rounded-lg flex items-center gap-2 py-2.5 cursor-pointer">
                                        <PlusSquare className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">New workspace</span>
                                    </CommandItem>
                                </CommandGroup>

                                <CommandSeparator />

                                <CommandGroup heading="Navigate" className="px-2">
                                    <CommandItem className="rounded-lg flex items-center gap-2 py-2.5 cursor-pointer" 
                                    onSelect={() => {
                                            router.push("/project");
                                            setSearchOpen(false);
                                        }}>
                                        <Folder className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Open a project</span>
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">O</kbd>
                                            <span className="text-[10px] text-muted-foreground">then</span>
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">P</kbd>
                                        </div>
                                    </CommandItem>
                                    <CommandItem className="rounded-lg flex items-center gap-2 py-2.5 cursor-pointer"
                                   
                                   onSelect={() => {
                                            router.push("/settings?tab=workspace&section=general");
                                            setSearchOpen(false);
                                        }}>
                                        <Settings className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Open a workspace setting</span>
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">O</kbd>
                                            <span className="text-[10px] text-muted-foreground">then</span>
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">S</kbd>
                                        </div>
                                    </CommandItem>
                                    <CommandItem className="rounded-lg flex items-center gap-2 py-2.5 cursor-pointer">
                                        <Layout className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Open a workspace</span>
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">O</kbd>
                                            <span className="text-[10px] text-muted-foreground">then</span>
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">W</kbd>
                                        </div>
                                    </CommandItem>
                                    <CommandItem 
                                        className="rounded-lg flex items-center gap-2 py-2.5 cursor-pointer"
                                        onSelect={() => {
                                            router.push("/dashboard");
                                            setSearchOpen(false);
                                        }}
                                    >
                                        <Home className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Go to home</span>
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">G</kbd>
                                            <span className="text-[10px] text-muted-foreground">then</span>
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">H</kbd>
                                        </div>
                                    </CommandItem>
                                    <CommandItem className="rounded-lg flex items-center gap-2 py-2.5 cursor-pointer"
                                    onSelect={() => {
                                            router.push("/mailbox");
                                            setSearchOpen(false);
                                        }}>
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Go to inbox</span>
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">G</kbd>
                                            <span className="text-[10px] text-muted-foreground">then</span>
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">X</kbd>
                                        </div>
                                    </CommandItem>
                                    <CommandItem className="rounded-lg flex items-center gap-2 py-2.5 cursor-pointer"
                                    onSelect={() => {
                                            router.push("/mywork");
                                            setSearchOpen(false);
                                        }}>
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Go to your work</span>
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">G</kbd>
                                            <span className="text-[10px] text-muted-foreground">then</span>
                                            <kbd className="h-5 min-w-[20px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] flex">Y</kbd>
                                        </div>
                                    </CommandItem>
                                    <CommandItem className="rounded-lg flex items-center gap-2 py-2.5 cursor-pointer">
                                        <Layers className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Go to all work items</span>
                                    </CommandItem>
                                </CommandGroup>
                            </CommandList>
                            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                                <span className="text-xs text-muted-foreground font-medium">Workspace level</span>
                                <Switch className="scale-75" />
                            </div>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>


            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-header-foreground/10 text-header-foreground border-header-foreground/20 hover:bg-header-foreground/20 transition-all font-inter text-[12px] h-8"
                >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Create New
                </Button>

                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                </Button>

                <Popover open={isUserPopOpen} onOpenChange={setUserPopOpen}>
                    <PopoverTrigger asChild>
                        <button className="focus:outline-none">
                            <Avatar className="w-9 h-9">
                                <AvatarImage 
                                    src={fullProfileUrl?.trim() ? fullProfileUrl : undefined} 
                                    alt={userName} 
                                />
                                <AvatarFallback className="bg-gray-300 text-gray-700 text-xs font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </PopoverTrigger>

                    <PopoverContent
                        className="p-0 w-auto border-none shadow-xl"
                        align="end"
                        sideOffset={5}
                    >
                        <UserSettings
                            onClose={() => setUserPopOpen(false)}
                            onOpenMobileApp={() => {
                                setUserPopOpen(false);
                                setShowMobilePopup(true);
                            }}
                            onOpenInvite={() => {
                                setUserPopOpen(false);
                                setShowInvitePopup(true);
                            }}
                            onOpenLogout={() => {
                                setUserPopOpen(false);
                                setShowLogoutModal(true);
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <MobileAppPopup open={showMobilePopup} onClose={() => setShowMobilePopup(false)} />
            <InviteMembersModal open={showInvitePopup} onClose={() => setShowInvitePopup(false)} />
            <LogoutConfirmModal 
                open={showLogoutModal} 
                onClose={() => setShowLogoutModal(false)} 
                onConfirm={handleLogout} 
                isLoading={isLoggingOut} 
            />
        </header>
    );
}


// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Bell, Plus, Settings, Menu } from "lucide-react";
// import { SidebarTrigger } from "@/components/ui/sidebar";
// import Image from "next/image";
// import MobileAppPopup from "@/components/settings/Mobileappspopup";
// import InviteMembersModal from "@/components/settings/InviteMembersModal";
// import UserSettings from "./UserSettings";

// export function Header() {
//   // Mock data for UI demonstration
//   const mockUser = {
//     name: "John Doe",
//     profilePictureUrl: "",
//   };

//   const [showMobilePopup, setShowMobilePopup] = useState(false);
//   const [showInvitePopup, setShowInvitePopup] = useState(false);
//   const [isUserPopOpen, setUserPopOpen] = useState(false);
//   const [isThemeOpen, setIsThemeOpen] = useState(false);

//   const userName = mockUser.name;
//   const profilePictureUrl = mockUser.profilePictureUrl;

//   const initials = userName
//     ? userName
//         .split(" ")
//         .filter(Boolean)
//         .map((n) => n[0])
//         .slice(0, 2)
//         .join("")
//         .toUpperCase()
//     : "U";

//   return (
//     <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
//       {/* Mobile Sidebar Trigger - if you want Only visible on mobile(lg:hidden) */}
//       {/* <SidebarTrigger className="lg" /> */}
      
//       {/* Spacer to push content to the right */}
//       <div className="flex-1" />

//       {/* Header Actions */}
//       <div className="flex items-center gap-2">
//         {/* Create New Button */}
//         <Button
//           variant="outline"
//           size="sm"
//           className="hidden sm:flex border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
//         >
//           <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary transition-colors">
//             <Plus className="h-3 w-3 text-primary-foreground" />
//           </div>
//           Create New
//         </Button>

//         {/* Mobile Create Button */}
//         <Button
//           variant="outline"
//           size="icon"
//           className="sm:hidden border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
//         >
//           <Plus className="h-4 w-4" />
//         </Button>

//         {/* Theme Settings Popover */}
//         <Popover open={isThemeOpen} onOpenChange={setIsThemeOpen}>
//           <PopoverTrigger asChild>
//             <Button 
//               variant="ghost" 
//               size="icon" 
//               className="hover:bg-muted transition-colors"
//             >
//               <Settings className="h-4 w-4 text-muted-foreground transition-colors" />
//             </Button>
//           </PopoverTrigger>
//           <PopoverContent 
//             className="w-48 p-0" 
//             align="end"
//             sideOffset={8}
//           >
//             <div className="rounded-lg border border-border bg-card shadow-lg">
//               <p className="px-4 py-2 text-sm font-semibold text-card-foreground border-b">
//                 Theme
//               </p>
//               <div className="p-2">
//                 <p className="text-sm text-muted-foreground">Theme options coming soon...</p>
//               </div>
//             </div>
//           </PopoverContent>
//         </Popover>

//         {/* Notification Icon */}
//         <Button 
//           variant="ghost" 
//           size="icon"
//           className="hover:bg-muted transition-colors"
//         >
//           <Bell className="h-4 w-4 text-muted-foreground transition-colors" />
//         </Button>

//         {/* User Profile Popover */}
//         <Popover open={isUserPopOpen} onOpenChange={setUserPopOpen}>
//           <PopoverTrigger asChild>
//             <Button
//               variant="ghost"
//               size="icon"
//               className="rounded-full p-0 overflow-hidden hover:bg-muted transition-colors"
//             >
//               {profilePictureUrl?.trim() ? (
//                 <div className="rounded-full overflow-hidden w-8 h-8 bg-muted transition-colors">
//                   <Image
//                     src={profilePictureUrl}
//                     alt="Profile"
//                     width={32}
//                     height={32}
//                     style={{ objectFit: "cover" }}
//                   />
//                 </div>
//               ) : (
//                 <div className="bg-muted rounded-full w-8 h-8 flex items-center justify-center transition-colors">
//                   <span className="text-muted-foreground text-xs font-semibold transition-colors">
//                     {initials}
//                   </span>
//                 </div>
//               )}
//             </Button>
//           </PopoverTrigger>
//           <PopoverContent 
//             className="w-[410px] max-w-[calc(100vw-2rem)] p-0" 
//             align="end"
//             sideOffset={8}
//           >
//             <UserSettings
//                             onClose={() => setUserPopOpen(false)}
//                             onOpenMobileApp={() => {
//                                 setUserPopOpen(false);
//                                 setShowMobilePopup(true);
//                             }}
//                             onOpenInvite={() => {
//                                 setUserPopOpen(false);
//                                 setShowInvitePopup(true);
//                             }}
//                         />
           
//           </PopoverContent>
//         </Popover>
//       </div>
      
//       <MobileAppPopup 
//         open={showMobilePopup} 
//         onClose={() => setShowMobilePopup(false)} 
//       />
      
//       <InviteMembersModal 
//         open={showInvitePopup} 
//         onClose={() => setShowInvitePopup(false)} 
//       />
//     </header>
//   );
// }

