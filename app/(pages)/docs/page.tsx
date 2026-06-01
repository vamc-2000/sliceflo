"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDocStore } from "@/stores/useDoc-store";
import { Button } from "@/components/ui/button";
import { Plus, Star, Share2, MoreHorizontal, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { DashboardSection } from "@/components/Goals/DashboardSection";
import { DashboardItemCard } from "@/components/Goals/DashboardItemCard";
import { DataTable } from "@/components/layout/DataTable";
import { LandingPage } from "@/components/LandingPage";
import { CreateDocumentDialog } from "@/components/docs/CreateDocumentDialog";
import { BiExpandAlt } from "react-icons/bi";
import { PiLinkSimple } from "react-icons/pi";

export default function DocsPage() {
  const router = useRouter();
  const { documents, setActiveDoc, fetchRootDocuments, toggleFavorite } = useDocStore();
  const [activeTab, setActiveTab] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const loading = useDocStore(state => state.isLoading);

  // Initial load of root documents
  useEffect(() => {
    fetchRootDocuments();
  }, [fetchRootDocuments]);

  // Convert Map to Array and focus on root documents for the dashboard
  const allDocs = Array.from(documents.values());
  const rootDocsList = allDocs.filter(doc => !doc.parentId);

  // Helper: recursive subpage count
  const countAllSubpages = (docId: string): number => {
    const directChildren = allDocs.filter(d => d.parentId === docId);
    let count = directChildren.length;
    directChildren.forEach(child => {
      count += countAllSubpages(child.id);
    });
    return count;
  };

  // Creator info helper
  const getCreatorInfo = (doc: any) => {
    const creator = doc.createdBy;
    if (typeof creator === 'object' && creator) {
      return {
        name: creator.name || "Unknown",
        image: creator.profilePictureUrl || undefined,
      };
    }
    return { name: "You", initials: "Y" };
  };

  // Favorite documents (top 5 for cards)
  const favoriteDocs = rootDocsList
    .filter((doc) => doc.isFavorite)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 5);

  // Recent documents (top 5 for cards)
  const recentDocs = rootDocsList
    .filter((doc) => !doc.isFavorite)
    .sort((a, b) => (b.viewedAt || b.updatedAt || 0) - (a.viewedAt || a.updatedAt || 0))
    .slice(0, 5);

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "-";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "-";
      return format(date, "d MMM");
    } catch {
      return "-";
    }
  };

  const getFilteredDocs = () => {
    switch (activeTab) {
      case "favorites":
        return rootDocsList.filter((doc) => doc.isFavorite);
      case "recent":
        return [...rootDocsList].sort((a, b) => (b.viewedAt || b.updatedAt || 0) - (a.viewedAt || a.updatedAt || 0));
      default:
        return rootDocsList;
    }
  };

  const filteredDocs = getFilteredDocs();

  // DataTable columns
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Document Name",
        cell: ({ row }) => {
          const doc = row.original;
          return (
            <div className="flex items-center gap-3">
              <span className="text-lg">{doc.icon || "📄"}</span>
              <span className="font-medium cursor-pointer hover:underline" onClick={() => router.push(`/docs/${doc.id}`)}>
                {doc.title}
              </span>
              <div className="flex gap-1 ml-auto">
                <button
                  className="h-8 w-8 rounded-full flex items-center justify-center bg-muted/50 border border-border transition-colors group"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(doc.id);
                  }}
                >
                  <Star
                    className={cn(
                      "h-4 w-4 transition-colors",
                      doc.isFavorite
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground group-hover:text-primary"
                    )}
                  />
                </button>
                <button
                  className="h-8 w-8 rounded-full flex items-center justify-center bg-muted/50 border border-border transition-colors group"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/docs/${doc.id}`);
                  }}
                >
                  <BiExpandAlt className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
                <button
                  className="h-8 w-8 rounded-full flex items-center justify-center bg-muted/50 border border-border transition-colors group"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Copy link logic or similar
                  }}
                >
                  <PiLinkSimple className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "subpages",
        header: () => <div className="text-center">Subpages</div>,
        cell: ({ row }) => {
          const count = countAllSubpages(row.original.id);
          return <div className="text-center">{count > 0 ? count : "-"}</div>;
        },
      },
      {
        accessorKey: "viewedAt",
        header: () => <div className="text-center">Date viewed</div>,
        cell: ({ row }) => {
          const viewedAt = row.original.viewedAt;
          return <div className="text-center">{formatDate(viewedAt)}</div>;
        },
      },
      {
        accessorKey: "updatedAt",
        header: () => <div className="text-center">Date updated</div>,
        cell: ({ row }) => {
          const updatedAt = row.original.updatedAt;
          return <div className="text-center">{formatDate(updatedAt)}</div>;
        },
      },
      {
        accessorKey: "sharing",
        header: () => <div className="text-center">Sharing</div>,
        cell: ({ row }) => {
          const creator = getCreatorInfo(row.original);
          return (
            <div className="text-center">
              <Avatar className="h-8 w-8 inline-flex border border-border">
                {creator.image && <AvatarImage src={creator.image} />}
                <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-medium">
                  {creator.initials || creator.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          );
        },
      },
    ],
    [router, toggleFavorite]
  );

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground animate-pulse">Loading documents...</p>
      </div>
    );
  }

  if (rootDocsList.length === 0) {
    return (
      <>
        <LandingPage
          title="Welcome to Docs!"
          description="Track and organize your documents with ease."
          extraText="Create your first document to get started."
          imageSrc="/images/docs-image.png"
          imageAlt="No documents yet"
          buttonText="Create Your First Document"
          onButtonClick={() => setShowCreateDialog(true)}
        />
        <CreateDocumentDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Breadcrumbs />
      <div className="w-full px-6 pt-0 py-5 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Docs</h1>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-primary text-primary-foreground hover:opacity-90 gap-2 rounded-lg px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            Create new Doc
          </Button>
        </div>

        {/* Favourites Section */}
        {favoriteDocs.length > 0 && (
          <DashboardSection
            title="Favourites"
            viewAllType="dropdown"
            allItems={rootDocsList.filter((d) => d.isFavorite)}
            onItemClick={(doc) => router.push(`/docs/${doc.id}`)}
            onItemDelete={(doc) => {
              if (confirm(`Delete "${doc.title}"?`)) {
                // Delete logic
              }
            }}
            emptyMessage="No favorite documents"
          >
            {favoriteDocs.map((doc, index) => (
              <DashboardItemCard
                key={doc.id}
                id={doc.id}
                title={doc.title}
                icon={doc.icon || "📄"}
                isFavorite={doc.isFavorite}
                isPurple={index === 0}
                createdBy={getCreatorInfo(doc)}
                fileSize={countAllSubpages(doc.id) > 0 ? `${countAllSubpages(doc.id)} subpages` : undefined}
                navigateTo={`/docs/${doc.id}`}
                onToggleFavorite={(id) => toggleFavorite(id)}
                onShare={(id) => console.log("Share doc:", id)}
                onMore={(id) => console.log("More options:", id)}
              />
            ))}
          </DashboardSection>
        )}

        {/* Recents Section */}
        <DashboardSection
          title="Recents"
          viewAllType="dropdown"
          allItems={rootDocsList.filter((d) => !d.isFavorite)}
          onItemClick={(doc) => router.push(`/docs/${doc.id}`)}
          onItemDelete={(doc) => {
            if (confirm(`Delete "${doc.title}"?`)) {
              // Delete logic
            }
          }}
          emptyMessage="No recent documents"
        >
          {recentDocs.map((doc) => (
            <DashboardItemCard
              key={doc.id}
              id={doc.id}
              title={doc.title}
              icon={doc.icon || "📄"}
              isFavorite={doc.isFavorite}
              createdBy={getCreatorInfo(doc)}
              fileSize={countAllSubpages(doc.id) > 0 ? `${countAllSubpages(doc.id)} subpages` : undefined}
              navigateTo={`/docs/${doc.id}`}
              onToggleFavorite={(id) => toggleFavorite(id)}
              onShare={(id) => console.log("Share doc:", id)}
              onMore={(id) => console.log("More options:", id)}
            />
          ))}
        </DashboardSection>

        {/* Tabs and DataTable */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2 gap-1">
          <TabsList>
            <TabsTrigger value="all">All Docs</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <DataTable
              columns={columns}
              data={filteredDocs}
              searchPlaceholder="Search documents..."
              enableGlobalFilter={true}
              emptyMessage="No documents found"
            />
          </TabsContent>
        </Tabs>
      </div>

      <CreateDocumentDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}
