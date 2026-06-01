
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGoalsStore } from "@/stores/goals-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Button } from "@/components/ui/button";
import { Plus, Star, Share2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { DashboardSection } from "@/components/Goals/DashboardSection";
import { DashboardItemCard } from "@/components/Goals/DashboardItemCard";
import { DataTable } from "@/components/layout/DataTable";
import { BiExpandAlt } from "react-icons/bi";
import { PiLinkSimple } from "react-icons/pi";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useProfileStore } from "@/stores/profile-store";
import { Goal } from "@/types/goal.types";
import { LandingPage } from "@/components/LandingPage";
import Image from "next/image";



import { TestLoader } from "@/components/TestLoader";
import { GoalsSkeleton } from "@/components/Goals/GoalsSkeleton";


export default function GoalsPage() {
  const router = useRouter();
  const { goals, fetchGoals, isLoading, toggleFavorite } = useGoalsStore();
  const { currentWorkspace, workspaceMembers, fetchWorkspaceMembers } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchGoals(currentWorkspace.id);
      fetchWorkspaceMembers(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchGoals, fetchWorkspaceMembers]);

  const getCreatorInfo = (goal: any) => {
    const creator = goal.createdBy;
    if (typeof creator === 'object' && creator) {
      return {
        name: creator.name || "Unknown",
        image: creator.profilePictureUrl || creator.profilePicture || creator.avatar || undefined,
      };
    }

    if (typeof creator === 'string' && workspaceMembers.length > 0) {
      const member = workspaceMembers.find((m: any) => m.userId === creator || m.id === creator || m._id === creator);
      if (member) {
        return {
          name: member.name || "Unknown",
          image: member.profilePicture || member.avatar || (member as any).profilePictureUrl || undefined,
        };
      }
    }

    return { name: "Unknown", image: undefined };
  };

  const favoriteGoals = goals
    .filter((goal: any) => goal.isFavorite && goal.id)
    .slice(0, 5)
    .map((goal: any, index: number) => ({
      ...goal,
      uniqueKey: `${goal.id}-${index}`
    }));

  const recentGoals = goals
    .filter((goal: any) => !goal.isFavorite && goal.id)
    .sort((a: any, b: any) => {
      const dateA = new Date(a.dateViewed || a.updatedAt || '1970-01-01').getTime();
      const dateB = new Date(b.dateViewed || b.updatedAt || '1970-01-01').getTime();
      return dateB - dateA;
    })
    .slice(0, 5)
    .map((goal: any, index: number) => ({
      ...goal,
      uniqueKey: `${goal.id}-${index}`
    }));

  const getIconForGoal = (goal: any) => {
    if (goal.icon) return goal.icon;
    return goal.type === "Organization" || goal.type === "Team" ? "📁" : "📄";
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMM");
    } catch {
      return dateString;
    }
  };

  const getFilteredGoals = () => {
    switch (activeTab) {
      case "my":
        return goals.filter((goal: any) => goal.type === "Personal");
      case "organization":
        return goals.filter((goal: any) => goal.type === "Organization");
      case "team":
        return goals.filter((goal: any) => goal.type === "Team");
      case "private":
        return goals.filter((goal: any) => goal.isPrivate);
      default:
        return goals;
    }
  };

  const filteredGoals = getFilteredGoals();

  const columns = useMemo<ColumnDef<Goal>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Goal Name",
        cell: ({ row }) => {
          const goal = row.original;
          return (
            <div className="flex items-center gap-3">
              <span className="text-lg">{getIconForGoal(goal)}</span>
              <span className="font-medium">{goal.title || goal.name}</span>
              <div className="flex gap-1 ml-auto">
                {/* Star Button */}
                {/* Star Button */}
                <button
                  className="h-8 w-8 rounded-full flex items-center justify-center bg-muted/50 border border-border transition-colors group"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(goal.id, currentWorkspace?.id);
                  }}
                >
                  <Star
                    className={cn(
                      "h-4 w-4 transition-colors",
                      goal.isFavorite
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground group-hover:text-primary"
                    )}
                  />
                </button>

                {/* Edit/Expand Button */}
                <button
                  className="h-8 w-8 rounded-full flex items-center justify-center bg-muted/50 border border-border transition-colors group"
                  onClick={(e) => e.stopPropagation()}
                >
                  <BiExpandAlt className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>

                {/* Link Button */}
                <button
                  className="h-8 w-8 rounded-full flex items-center justify-center bg-muted/50 border border-border transition-colors group"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PiLinkSimple className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>


              </div>
            </div>
          );
        },
      },
      // Type column
      {
        accessorKey: "type",
        header: () => <div className="text-center">Type</div>,
        cell: ({ row }) => (
          <div className="text-center">{row.original.type || "Personal"}</div>
        ),
      },

      // Date viewed column
      {
        accessorKey: "dateViewed",
        header: () => <div className="text-center">Date viewed</div>,
        cell: ({ row }) => {
          const dateViewed = row.original.dateViewed;
          return <div className="text-center">{dateViewed ? formatDate(dateViewed) : "-"}</div>;
        },
      },

      // Date updated column
      {
        accessorKey: "updatedAt",
        header: () => <div className="text-center">Date updated</div>,
        cell: ({ row }) => {
          const goal = row.original;
          return <div className="text-center">{formatDate(goal.updatedAt || goal.createdAt || "")}</div>;
        },
      },

      // Sharing column — change text-right to text-center
      {
        accessorKey: "sharing",
        header: () => <div className="text-center">Sharing</div>,
        cell: ({ row }) => {
          const goal = row.original;
          const createdByName = typeof goal.createdBy === "string"
            ? "RM"
            : goal.createdBy?.name?.substring(0, 2).toUpperCase() || "RM";

          return (
            <div className="text-center">
              <Avatar className="h-8 w-8 inline-flex bg-muted">
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                  {createdByName}
                </AvatarFallback>
              </Avatar>
            </div>
          );
        },
      },

    ],
    [toggleFavorite]
  );

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <TestLoader gifSrc="/interchanging.gif" message="Loading goals..." size="md" />
  //     </div>
  //   );
  // }
  
if (isLoading) {
  return <GoalsSkeleton />  // ✅ Done!
}

  if (!isLoading && goals.length === 0) {
    return (
      <LandingPage
        title="Welcome to Goals!"
        description="Track and achieve your goals with ease."
        extraText="Create your first goal to get started on your journey to success."
        imageSrc="/images/goals-image.png"
        imageAlt="No goals yet"
        buttonText="Create Your First Goal"
        onButtonClick={() => router.push("/goals/create")}
      />
    );
  }
  // if (!isLoading && goals.length === 0) {
  //   return (
  //     <div className="flex flex-col items-center justify-center h-screen gap-6">
  //       <div className="text-center">
  //         <h1 className="text-3xl font-bold">Welcome to Goals!</h1>
  //         <p className="text-gray-600">Track and achieve your goals with ease.</p>
  //         <p className="text-sm text-gray-500">Create your first goal to get started.</p>
  //       </div>

  //       {/* ✅ Smaller image */}
  //       <div className="relative w-full h-90"> {/* Control size here */}
  //         <Image
  //           src="/images/goals-image.png"
  //           alt="No goals yet"
  //           fill
  //           className="object-contain"
  //         />
  //       </div>

  //       <Button
  //         onClick={() => router.push("/goals/create")}
  //         className="bg-gray-900 hover:bg-gray-800 text-white"
  //       >
  //         Create Your First Goal
  //       </Button>
  //     </div>
  //   );
  // }


  return (
    <div className="min-h-screen bg-background">
      <Breadcrumbs />
      <div className="w-full px-6 pt-0 py-5 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Goals</h1>
          <Button
            onClick={() => router.push("/goals/create")}
            className="bg-primary text-primary-foreground hover:opacity-90 gap-2 rounded-lg px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            Create new Goal
          </Button>
        </div>

        {/* Favourites Section */}
        {favoriteGoals.length > 0 && (
          <DashboardSection
            title="Favourites"
            viewAllType="dropdown"
            allItems={goals.filter((g: any) => g.isFavorite)}
            onItemClick={(goal) => router.push(`/goals/${goal.id}`)}
            onItemDelete={(goal) => {
              if (confirm(`Delete "${goal.title || goal.name}"?`)) {
                // Add your delete logic here
                console.log("Delete goal:", goal.id);
              }
            }}
            emptyMessage="No favorite goals"
          >
            {favoriteGoals.map((goal: any, index: number) => (
              <DashboardItemCard
                key={goal.id}
                id={goal.id}
                title={goal.title || goal.name}
                icon={getIconForGoal(goal)}
                color={goal.color}
                isFavorite={goal.isFavorite}
                isPurple={index === 0}
                createdBy={getCreatorInfo(goal)}
                fileSize={goal.fileSize || "2.1 KB"}
                navigateTo={`/goals/${goal.id}`}
                onToggleFavorite={(id) => toggleFavorite(id, currentWorkspace?.id)}
                onShare={(id) => console.log("Share goal:", id)}
                onMore={(id) => console.log("More options:", id)}
              />
            ))}
          </DashboardSection>
        )}

        {/* Recents Section */}
        <DashboardSection
          title="Recents"
          viewAllType="dropdown"
          allItems={goals.filter((g: any) => !g.isFavorite)}
          onItemClick={(goal) => router.push(`/goals/${goal.id}`)}
          onItemDelete={(goal) => {
            if (confirm(`Delete "${goal.title || goal.name}"?`)) {
              console.log("Delete goal:", goal.id);
            }
          }}
          emptyMessage="No recent goals"
        >
          {recentGoals.map((goal: any) => (
            <DashboardItemCard
              key={goal.uniqueKey || goal.id}
              id={goal.id}
              title={goal.title || goal.name}
              icon={getIconForGoal(goal)}
              color={goal.color}
              isFavorite={goal.isFavorite}
              isPurple={false}
              createdBy={getCreatorInfo(goal)}
              fileSize={goal.fileSize || "2.1 KB"}
              navigateTo={`/goals/${goal.id}`}
              onToggleFavorite={(id) => toggleFavorite(id, currentWorkspace?.id)}
              onShare={(id) => console.log("Share goal:", id)}
              onMore={(id) => console.log("More options:", id)}
            />
          ))}
        </DashboardSection>


        {/* Tabs and DataTable */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2 gap-1">
          <TabsList>
            <TabsTrigger value="all">All Goals</TabsTrigger>
            <TabsTrigger value="my">My Goals</TabsTrigger>
            <TabsTrigger value="organization">Organization Goals</TabsTrigger>
            <TabsTrigger value="team">Team Goals</TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <DataTable
              columns={columns}
              data={filteredGoals as any}
              searchPlaceholder="Search goals..."
              enableGlobalFilter={true}
              emptyMessage="No goals found"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


