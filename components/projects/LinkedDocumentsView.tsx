"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useDocStore } from "@/stores/useDoc-store";
import { FileText, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { CreateDocumentDialog } from "@/components/docs/CreateDocumentDialog";
import { listRootDocuments, updateDocument as updateDocumentApi } from "@/lib/api/documents-api";
import { toast } from "@/components/ui/sonner";
interface LinkedDocumentsViewProps {
  projectId: string;
}

export function LinkedDocumentsView({ projectId }: LinkedDocumentsViewProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { documents, loadDocuments, removeProjectFromDocument, updateDocument } = useDocStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLinkedDocs, setExpandedLinkedDocs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const allDocs = Array.from(documents.values());

  useEffect(() => {
    const load = async () => {
      try {
        const { documents: rootDocs } = await listRootDocuments();
        loadDocuments(rootDocs as any);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [loadDocuments]);
  const linkedItems = useMemo(() => {
    return allDocs.filter(doc =>
      doc.linkedProjects?.includes(projectId) ||
      doc.pageLinkedProjects?.includes(projectId)
    );
  }, [allDocs, projectId]);

  const filteredDocs = useMemo(() => {
    return linkedItems.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [linkedItems, searchQuery]);

  const getSubPageCount = useCallback((docId: string): number => {
    const children = allDocs.filter(d => d.parentId === docId);
    let count = children.length;
    children.forEach(child => {
      count += getSubPageCount(child.id);
    });
    return count;
  }, [allDocs]);

  const formatDate = useCallback((timestamp?: number) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  }, []);

  const getDocCreator = useCallback((docId: string) => {
    const doc = documents.get(docId);
    if (!doc) return null;
    if (doc.createdBy) return doc.createdBy;
    if (doc.parentId) return getDocCreator(doc.parentId);
    return null;
  }, [documents]);

  const handleUnlink = useCallback(async (docId: string) => {
    const doc = documents.get(docId);
    if (!doc) return;

    const updatedLinkedProjects = (doc.linkedProjects || []).filter(id => id !== projectId);
    const updatedPageLinkedProjects = (doc.pageLinkedProjects || []).filter(id => id !== projectId);

    removeProjectFromDocument(docId, projectId); // instant UI

    try {
      const res = await updateDocumentApi(docId, {
        linkedProjects: updatedLinkedProjects,
        pageLinkedProjects: updatedPageLinkedProjects,
      });
      if (res) updateDocument(docId, res as any);
      toast('success', { title: "Document unlinked" });
    } catch {
      toast('error', { title: "Failed to unlink document" });
    }
  }, [projectId, documents, removeProjectFromDocument, updateDocument]);
  return (
    <div className="h-full overflow-y-auto bg-card">
      <div className="p-5">
        {linkedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Streamline Your Workflow with Smart Documentation
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Real-time collaboration, version control, and seamless knowledge sharing.
            </p>

            <div className="mb-8">
              <img
                src="/images/docs-image.png"
                alt="Documentation Illustration"
                className="max-w-md h-auto mx-auto"
              />
            </div>

            <p className="text-muted-foreground italic mb-8 max-w-lg">
              "Good documentation doesn't just record what was done — it empowers what comes next"
            </p>

            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 rounded-lg font-medium transition-colors"
            >
              Create or attach a new Doc
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Linked Documents</h2>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 h-9 rounded-lg font-medium transition-colors text-xs"
                >
                  Create or attach a new Doc
                </Button>
                <div className="relative w-72">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 bg-muted border-border focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {filteredDocs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No documents match your search
                </div>
              ) : (
                filteredDocs.map((doc) => {
                  const pageCount = getSubPageCount(doc.id);

                  // DEBUG LOG
                  console.log(`Linked Item ${doc.id} title: ${doc.title}`);

                  return (
                    <div key={doc.id} className="flex items-center gap-4 group">
                      <div className="w-5 h-5 border-2 border-border rounded flex-shrink-0 cursor-pointer hover:border-muted-foreground transition-colors" />

                      <div className="flex-1 flex flex-col border border-border rounded-xl bg-card shadow-sm hover:shadow-md hover:border-border transition-all overflow-hidden">
                        <div className="flex items-center justify-between p-4 flex-1">
                          <Link href={`/docs/${doc.id}?from=project&projectId=${projectId}`} className="flex items-center gap-4 min-w-0 flex-1 hover:opacity-80 transition-opacity">
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0 shadow-inner group/icon">
                              {!doc.parentId ? (
                                <img src="/images/docsidebar.svg" alt="doc" className="w-6 h-6" />
                              ) : (
                                <FileText className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors">
                                {doc.title}
                              </h3>
                              <div className="flex flex-col gap-0.5 mt-0.5">
                                {!doc.parentId && (
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {pageCount} Pages
                                  </span>
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  Last updated on: {formatDate(doc.updatedAt)}
                                </span>
                              </div>
                            </div>
                          </Link>

                          <div className="flex items-center gap-3">
                            {!doc.parentId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                onClick={() => {
                                  setExpandedLinkedDocs(prev => {
                                    const next = new Set(prev);
                                    if (next.has(doc.id)) next.delete(doc.id);
                                    else next.add(doc.id);
                                    return next;
                                  });
                                }}
                              >
                                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedLinkedDocs.has(doc.id) && "rotate-180")} />
                              </Button>
                            )}
                            {(() => {
                              const creator = getDocCreator(doc.id);
                              return (
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-border flex-shrink-0 bg-muted flex items-center justify-center group/creator relative">
                                  {creator?.profilePictureUrl ? (
                                    <img
                                      src={creator.profilePictureUrl}
                                      alt={creator.name || "Creator"}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {creator?.name?.charAt(0)?.toUpperCase() || "?"}
                                    </span>
                                  )}
                                  {creator?.name && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-primary-foreground text-[10px] rounded opacity-0 group-hover/creator:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                      Created by: {creator.name}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnlink(doc.id)}
                              className="h-8 px-6 rounded-full bg-muted text-muted-foreground border-none hover:bg-red-50 hover:text-red-600 transition-all font-medium text-xs"
                            >
                              Unlink
                            </Button>
                          </div>
                        </div>

                        {/* Expansion section for subpages */}
                        {!doc.parentId && expandedLinkedDocs.has(doc.id) && (
                          <div className="px-4 pb-4 space-y-2 border-t pt-3 mt-1 bg-muted/30">
                            {pageCount > 0 ? (
                              allDocs.filter(d => d.parentId === doc.id).map(page => (
                                <div key={page.id} className="flex items-center gap-3 pl-4">
                                  <FileText className="w-3.5 h-3.5 text-muted-foreground opacity-60" />
                                  <span className="text-xs text-muted-foreground">{page.title}</span>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-[10px] text-muted-foreground italic pl-8">
                                No pages found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <CreateDocumentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}
