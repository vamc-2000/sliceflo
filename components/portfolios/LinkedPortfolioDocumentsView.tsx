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

interface LinkedPortfolioDocumentsViewProps {
  portfolioId: string;
}

export function LinkedPortfolioDocumentsView({ portfolioId }: LinkedPortfolioDocumentsViewProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const {
    documents,
    loadDocuments,
    removePortfolioFromDocument,
    updateDocument,
  } = useDocStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLinkedDocs, setExpandedLinkedDocs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // const allDocs = Array.from(documents.values());
  const allDocs = useMemo(() => Array.from(documents.values()), [documents]);

  useEffect(() => {
    console.log("[LinkedPortfolioDocumentsView] Component mounted/updated with portfolioId:", portfolioId);
    const load = async () => {
      try {
        setIsLoading(true);
        const { documents: rootDocs } = await listRootDocuments();
        console.log("[LinkedPortfolioDocumentsView] API returned rootDocs count:", rootDocs.length);
        loadDocuments(rootDocs as any);
      } catch (error) {
        console.error("[LinkedPortfolioDocumentsView] Failed to load documents:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [loadDocuments, portfolioId]);

const linkedItems = useMemo(() => {
  const filtered = allDocs.filter(doc => {
    const isLinked = doc.linkedPortfolios?.includes(portfolioId) ||
                    doc.pageLinkedPortfolios?.includes(portfolioId);
    return isLinked;
  });

  // Sort by updatedAt descending so new documents appear at the top
  const sorted = [...filtered].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  console.log("[LinkedPortfolioDocumentsView] Filtered & Sorted linked items:", sorted.length, "out of total:", allDocs.length);
  return sorted;
}, [allDocs, portfolioId]);

 

  const filteredDocs = useMemo(() => {
    return linkedItems.filter((doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [linkedItems, searchQuery]);

  const getSubPageCount = useCallback(
    (docId: string): number => {
      const children = allDocs.filter((d) => d.parentId === docId);
      let count = children.length;
      children.forEach((child) => {
        count += getSubPageCount(child.id);
      });
      return count;
    },
    [allDocs]
  );

  const formatDate = useCallback((timestamp?: number) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  const getDocCreator = useCallback(
    (docId: string) => {
      const doc = documents.get(docId);
      if (!doc) return null;
      if (doc.createdBy) return doc.createdBy;
      if (doc.parentId) return getDocCreator(doc.parentId);
      return null;
    },
    [documents]
  );

  const handleUnlink = useCallback(
    async (docId: string) => {
      const doc = documents.get(docId);
      if (!doc) return;

      const updatedLinkedPortfolios = (doc.linkedPortfolios || []).filter(
        (id) => id !== portfolioId
      );
      const updatedPageLinkedPortfolios = (doc.pageLinkedPortfolios || []).filter(
        (id) => id !== portfolioId
      );

      removePortfolioFromDocument(docId, portfolioId); // instant UI

      try {
        const res = await updateDocumentApi(docId, {
          linkedPortfolios: updatedLinkedPortfolios,
          pageLinkedPortfolios: updatedPageLinkedPortfolios,
        });
        if (res) updateDocument(docId, res as any);
        toast('success', { title: "Document unlinked" });
      } catch {
        toast('error', { title: "Failed to unlink document" });
      }
    },
    [portfolioId, documents, removePortfolioFromDocument, updateDocument]
  );

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="p-5">
        {linkedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Streamline Your Workflow with Smart Documentation
            </h2>
            <p className="text-gray-500 mb-8 max-w-md">
              Real-time collaboration, version control, and seamless knowledge sharing.
            </p>
            <div className="mb-8">
              <img
                src="/images/docs-image.png"
                alt="Documentation Illustration"
                className="max-w-md h-auto mx-auto"
              />
            </div>
            <p className="text-gray-400 italic mb-8 max-w-lg">
              "Good documentation doesn't just record what was done — it empowers what comes next"
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-[#0b213e] hover:bg-[#162e4d] text-white px-8 py-2 rounded-lg font-medium transition-colors"
            >
              Create or attach a new Doc
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Linked Documents</h2>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-[#0b213e] hover:bg-[#162e4d] text-white px-4 h-9 rounded-lg font-medium transition-colors text-xs"
                >
                  Create or attach a new Doc
                </Button>
                <div className="relative w-72">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 bg-gray-50 border-gray-200 focus:ring-1 focus:ring-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {filteredDocs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No documents match your search
                </div>
              ) : (
                filteredDocs.map((doc) => {
                  const pageCount = getSubPageCount(doc.id);
                  return (
                    <div key={doc.id} className="flex items-center gap-4 group">
                      <div className="w-5 h-5 border-2 border-gray-200 rounded flex-shrink-0 cursor-pointer hover:border-gray-400 transition-colors" />
                      <div className="flex-1 flex flex-col border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden">
                        <div className="flex items-center justify-between p-4 flex-1">
                          <Link
                            href={`/docs/${doc.id}?from=portfolio&portfolioId=${portfolioId}`}
                            className="flex items-center gap-4 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                          >
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner group/icon">
                              {!doc.parentId ? (
                                <img src="/images/docsidebar.svg" alt="doc" className="w-6 h-6" />
                              ) : (
                                <FileText className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                                {doc.title}
                              </h3>
                              <div className="flex flex-col gap-0.5 mt-0.5">
                                {!doc.parentId && (
                                  <span className="text-xs text-gray-500 font-medium">
                                    {pageCount} Pages
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-400">
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
                                className="h-8 w-8 text-gray-400"
                                onClick={() => {
                                  setExpandedLinkedDocs((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(doc.id)) next.delete(doc.id);
                                    else next.add(doc.id);
                                    return next;
                                  });
                                }}
                              >
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 transition-transform",
                                    expandedLinkedDocs.has(doc.id) && "rotate-180"
                                  )}
                                />
                              </Button>
                            )}
                            {(() => {
                              const creator = getDocCreator(doc.id);
                              return (
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-200 flex items-center justify-center group/creator relative">
                                  {creator?.profilePictureUrl ? (
                                    <img
                                      src={creator.profilePictureUrl}
                                      alt={creator.name || "Creator"}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium text-gray-600">
                                      {creator?.name?.charAt(0)?.toUpperCase() || "?"}
                                    </span>
                                  )}
                                  {creator?.name && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover/creator:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
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
                              className="h-8 px-6 rounded-full bg-[#f1f2f6] text-gray-600 border-none hover:bg-red-50 hover:text-red-600 transition-all font-medium text-xs"
                            >
                              Unlink
                            </Button>
                          </div>
                        </div>

                        {/* Expansion section for subpages */}
                        {!doc.parentId && expandedLinkedDocs.has(doc.id) && (
                          <div className="px-4 pb-4 space-y-2 border-t pt-3 mt-1 bg-gray-50/30">
                            {pageCount > 0 ? (
                              allDocs
                                .filter((d) => d.parentId === doc.id)
                                .map((page) => (
                                  <div key={page.id} className="flex items-center gap-3 pl-4">
                                    <FileText className="w-3.5 h-3.5 text-gray-400 opacity-60" />
                                    <span className="text-sm text-gray-600">{page.title}</span>
                                  </div>
                                ))
                            ) : (
                              <div className="px-4 py-2 text-[10px] text-gray-400 italic pl-8">
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
        portfolioId={portfolioId}
      />
    </div>
  );
}