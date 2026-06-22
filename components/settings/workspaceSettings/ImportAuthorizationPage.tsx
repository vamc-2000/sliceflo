


"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NextImage from "next/image";
import { Eye, Trash2, FileText, Table as TableIcon, Download, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useImpler } from "@impler/react";
import { useProjectsStore } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useImportStore } from "@/stores/import-store";
import { SettingsCard } from "../SettingsCard";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// ─── Static app-authorization data ───────────────────────────────────────────
const appAuthData = [
  { id: 1, appName: "Clickup",  icon: "/assets/asanalogo.png", lastActivity: "Never",        action: "Deauthorize" },
  { id: 2, appName: "Monday",   icon: "/assets/asanalogo.png", lastActivity: "Aug 3, 2025",  action: "Deauthorize" },
  { id: 3, appName: "Linear",   icon: "/assets/asanalogo.png", lastActivity: "Sep 5, 2024",  action: "Deauthorize" },
  { id: 4, appName: "Asana",    icon: "/assets/asanalogo.png", lastActivity: "Never",        action: "Deauthorize" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PROJECT_COLORS = ["#3B82F6","#10B981","#F59E0B","#8B5CF6","#EF4444","#06B6D4","#F97316","#EC4899"];
const randomColor = () => PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

// ─── Static seed rows (always visible) ───────────────────────────────────────
const staticRecords = [
  { id: "s1", type: "Asana",       status: "Completed", importedNumber: "33 of 33 tasks imported",       expiryDate: "Nov 7, 2025 at 10:24 AM", statusColor: "success" },
  { id: "s2", type: "Document",    status: "Completed", importedNumber: "1 of 1 docs imported",          expiryDate: "Nov 7, 2025 at 10:24 AM", statusColor: "success" },
  { id: "s3", type: "Spreadsheet", status: "Completed", importedNumber: "1 of 1 spreadsheet imported",   expiryDate: "Nov 7, 2025 at 10:24 AM", statusColor: "success" },
  { id: "s4", type: "Monday.com",  status: "Ongoing",   importedNumber: "5 of 8 tasks imported",         expiryDate: "Nov 7, 2025 at 10:24 AM", statusColor: "warning" },
];

// ─── Component ────────────────────────────────────────────────────────────────
const ImportAuthorizationPage = () => {
  const { projects, addProject } = useProjectsStore();
  const {
    exports = [],
    exportProject,
    fetchExports,
    downloadExport,
    isLoadingExports
  } = useWorkspaceStore();
  const { importRecords, addImportRecord, deleteImportRecord } = useImportStore();
  const [activeSection, setActiveSection] = useState<"imports" | "exports" | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("excel");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Fetch exports when activeSection becomes "exports"
  useEffect(() => {
    if (activeSection === "exports") {
      fetchExports({ limit: 50, offset: 0 }).catch((err) => {
        console.error("Error fetching exports:", err);
      });
    }
  }, [activeSection, fetchExports]);

  // Poller for pending exports
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const hasPending = exports.some((exp) => exp.status === "pending");

    if (hasPending && activeSection === "exports") {
      intervalId = setInterval(() => {
        fetchExports({ limit: 50, offset: 0 }).catch(console.error);
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [exports, activeSection, fetchExports]);

  const handleExportData = async () => {
    if (!selectedProjectId) {
      toast("error", { title: "Error", description: "Please select a project to export." });
      return;
    }

    setIsExporting(true);
    try {
      await exportProject(selectedProjectId);
      toast("success", { title: "Success", description: "Project export initiated successfully!" });
      // Refresh exports list
      fetchExports({ limit: 50, offset: 0 });
    } catch (err: any) {
      toast("error", {
        title: "Export Failed",
        description: err.response?.data?.message || "Failed to start export.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadExport = async (exportId: string) => {
    try {
      const response = await downloadExport(exportId);
      if (response?.downloadUrl) {
        window.open(response.downloadUrl, "_blank");
        toast("success", { title: "Success", description: "Download link opened." });
      } else {
        toast("error", { title: "Error", description: "Download link not found." });
      }
    } catch (err: any) {
      toast("error", {
        title: "Download Failed",
        description: err.response?.data?.message || "Failed to retrieve download link.",
      });
    }
  };

  // ── Impler callback ─────────────────────────────────────────────────────────
const onDataImported = useCallback(async (uploadData: any) => {
  console.log("🔥 RAW uploadData:", uploadData);

  const uploadId = uploadData?._id ?? uploadData?.id;
  const validRecords = uploadData?.validRecords ?? 0;
  const totalRecords = uploadData?.totalRecords ?? 0;

  if (!uploadId || validRecords === 0) {
    toast("error", { title: "Error", description: "No valid records found!" });
    return;
  }

  try {
    // Fetch actual row data from Impler API using uploadId
    const response = await fetch(
      `https://api.impler.io/v1/upload/${uploadId}/rows?limit=1000&page=1`,
      {
        headers: {
          "x-access-token": "08d5c9662f940c967daaa3167630b32d",
        },
      }
    );

    const result = await response.json();
    console.log("📦 Fetched rows from API:", result);

    const rows: Record<string, any>[] = result?.data ?? result?.records ?? result ?? [];

    if (!rows.length) {
      // Fallback — create import record without projects
      addImportRecord({
        type:           "Spreadsheet",
        status:         "Completed",
        statusColor:    "success",
        importedNumber: `${validRecords} of ${totalRecords} records uploaded`,
        expiryDate:     formatDate(new Date()),
        projectIds:     [],
      });
      toast("success", { title: "Success", description: `✅ ${validRecords} records uploaded to Impler!` });
      return;
    }

    const now = new Date();
    const importedProjectIds: string[] = [];
    let successCount = 0;

    for (const row of rows) {
      try {
        const rawName =
          row.name || row.Name || row["Project Name"] || `Imported-${Date.now()}`;

        const projectPayload = {
          name:        rawName,
          description: row.description || row.Description || "",
          status:      (row.status || "active").toLowerCase(),
          priority:    (row.priority || "medium").toLowerCase(),
          slug:        rawName
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .slice(0, 50),
        };

        const projectId = await addProject(projectPayload as any);
        importedProjectIds.push(projectId);
        successCount++;
      } catch (err) {
        console.error(" Failed row:", row, err);
      }
    }

    addImportRecord({
      type:           "Spreadsheet",
      status:         successCount === rows.length ? "Completed" : successCount > 0 ? "Ongoing" : "Failed",
      statusColor:    successCount === rows.length ? "success"   : successCount > 0 ? "warning" : "error",
      importedNumber: `${successCount} of ${rows.length} projects imported`,
      expiryDate:     formatDate(now),
      projectIds:     importedProjectIds,
    });

    if (successCount > 0) {
      toast("success", { title: "Success", description: ` ${successCount} project${successCount > 1 ? "s" : ""} imported successfully!` });
    } else {
      toast("error", { title: "Error", description: "No projects created. Check column names in your file." });
    }

  } catch (err) {
    console.error(" Failed to fetch rows from Impler:", err);
    // Still show import record even if fetch fails
    addImportRecord({
      type:           "Spreadsheet",
      status:         "Completed",
      statusColor:    "success",
      importedNumber: `${validRecords} of ${totalRecords} records uploaded`,
      expiryDate:     formatDate(new Date()),
      projectIds:     [],
    });
    toast("success", { title: "Success", description: ` ${validRecords} records uploaded successfully!` });
  }

}, [addProject, addImportRecord]);



  // ── Impler hook ─────────────────────────────────────────────────────────────
  const { showWidget, isImplerInitiated } = useImpler({
    projectId:        "69a7d77ce7922340d1c6f217",
    templateId:       "69a7d7a5e7922340d1c6f220",
    accessToken:      "08d5c9662f940c967daaa3167630b32d",
    onUploadComplete: onDataImported,
    onWidgetClose:    () => console.log(" Widget closed without data"), 
  });

  // ── Renderers ────────────────────────────────────────────────────────────────
  const getStatusBadge = (status: string, colorType: string) => {
    if (colorType === "success")
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{status}</Badge>;
    if (colorType === "warning")
      return (
        <div className="relative inline-flex items-center px-3 py-1 rounded bg-orange-100 text-orange-800 text-sm font-medium">
          {status}
          <div className="absolute bottom-0 left-12 transform -translate-x-12 w-45 h-0.5 bg-orange-500 rounded" />
        </div>
      );
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{status}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "document":    return <FileText className="w-5 h-5 text-gray-600" />;
      case "spreadsheet": return <TableIcon className="w-5 h-5 text-gray-600" />;
      case "csv":         return <TableIcon className="w-5 h-5 text-gray-600" />;
      default:
        return (
          <NextImage
            src="/assets/asanalogo.png"
            alt={type}
            width={20}
            height={20}
            className="object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        );
    }
  };

  // Merge live + static records
  const allRecords = [...importRecords, ...staticRecords];

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-2">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-brand tracking-tight" data-testid="import-auth-title">Import &amp; Authorization</h2>
        <p className="text-xs text-muted-foreground">Manage your imports and app authorization</p>
      </div>

      {/* My Imports */}
      <SettingsCard
        id="imports"
        title="My Imports"
        subtitle="See all imported files"
        icon={<NextImage src="/images/Myimports.svg" alt="imports" width={40} height={40} className="w-10 h-10" />}
        isActive={activeSection === "imports"}
        onToggle={() => setActiveSection((prev) => (prev === "imports" ? null : "imports"))}
        actionButton={
          <div className="flex flex-col items-end gap-2">
            <Button
              className="bg-brand hover:bg-brand/90 text-brand-foreground"
              onClick={() => showWidget({})}
              disabled={!isImplerInitiated}
              data-testid="import-auth-import-btn"
            >
              {isImplerInitiated ? "Import file" : "Loading..."}
            </Button>
          </div>
        }
        data-testid="import-auth-imports-card"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border rounded-lg" data-testid="import-auth-imports-table">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border px-4 py-3 text-xs font-semibold text-brand text-center">Type of import</th>
                <th className="border border-border px-4 py-3 text-xs font-semibold text-brand text-center">Import Status</th>
                <th className="border border-border px-4 py-3 text-xs font-semibold text-brand text-center">Imported number</th>
                <th className="border border-border px-4 py-3 text-xs font-semibold text-brand text-center">Expiry Date &amp; Time</th>
                <th className="border border-border px-4 py-3 text-xs font-semibold text-brand text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {allRecords.map((item) => (
                <tr key={item.id} className="hover:bg-muted bg-card" data-testid={`import-auth-import-row-${item.id}`}>
                  <td className="border border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 flex items-center justify-center">{getTypeIcon(item.type)}</div>
                      <span className="text-sm text-foreground">{item.type}</span>
                    </div>
                  </td>
                  <td className="border border-border px-4 py-3 text-center">
                    {getStatusBadge(item.status, item.statusColor)}
                  </td>
                  <td className="border border-border px-4 py-3 text-sm text-foreground">{item.importedNumber}</td>
                  <td className="border border-border px-4 py-3 text-sm text-foreground">{item.expiryDate}</td>
                  <td className="border border-border px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="p-2 hover:bg-muted rounded transition-colors"
                        onClick={() => toast("info", { title: "Info", description: item.importedNumber })}
                        data-testid={`import-auth-import-view-btn-${item.id}`}
                      >
                        <Eye className="w-4 h-4 text-brand" />
                      </button>
                      <button
                        className="p-2 hover:bg-muted rounded transition-colors"
                        onClick={() => {
                          if (item.id.startsWith("s")) {
                            toast("error", { title: "Error", description: "Cannot delete static records" });
                          } else {
                            deleteImportRecord(item.id);
                            toast("success", { title: "Success", description: "Import record deleted" });
                          }
                        }}
                        data-testid={`import-auth-import-delete-btn-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsCard>

      {/* My Exports */}
      <SettingsCard
        id="exports"
        title="My Exports"
        subtitle="Export files in any format"
        icon={<NextImage src="/images/Myexports.svg" alt="exports" width={40} height={40} className="w-10 h-10" />}
        isActive={activeSection === "exports"}
        onToggle={() => setActiveSection((prev) => (prev === "exports" ? null : "exports"))}
        data-testid="import-auth-exports-card"
      >
        <div className="px-6 py-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Choose the project you want to export
              </Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-full h-11 bg-card border-border" data-testid="import-auth-project-select-trigger">
                  <SelectValue placeholder="Select Project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.length > 0 ? (
                    projects.map((p) => (
                      <SelectItem key={p.id} value={p.id!} data-testid={`import-auth-project-select-item-${p.id}`}>
                        {p.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No projects found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Choose the format in which you want to export
              </Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="w-full h-11 bg-card border-border" data-testid="import-auth-format-select-trigger">
                  <SelectValue placeholder="Select format..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv" data-testid="import-auth-format-select-item-csv">CSV</SelectItem>
                  <SelectItem value="json" data-testid="import-auth-format-select-item-json">JSON</SelectItem>
                  <SelectItem value="excel" data-testid="import-auth-format-select-item-excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
             <Button 
               className="bg-brand hover:bg-brand/90 text-brand-foreground px-8 h-10 rounded-md font-medium"
               onClick={handleExportData}
               disabled={isExporting}
               data-testid="import-auth-export-submit-btn"
             >
               {isExporting ? "Exporting..." : "Export Data"}
             </Button>
          </div>

          {/* Recent Exports list */}
          {activeSection === "exports" && (
            <div className="mt-6 space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-brand">Recent Exports</h4>
                <button
                  onClick={() => fetchExports({ limit: 50, offset: 0 })}
                  className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground"
                  disabled={isLoadingExports}
                  title="Refresh Exports"
                  data-testid="import-auth-exports-refresh-btn"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingExports ? "animate-spin" : ""}`} />
                </button>
              </div>
              
              {exports.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border rounded-lg" data-testid="import-auth-exports-table">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border border-border px-4 py-3 text-xs font-semibold text-brand text-left">Project Name</th>
                        <th className="border border-border px-4 py-3 text-xs font-semibold text-brand text-center">Format</th>
                        <th className="border border-border px-4 py-3 text-xs font-semibold text-brand text-center">Status</th>
                        <th className="border border-border px-4 py-3 text-xs font-semibold text-brand text-center">Requested At</th>
                        <th className="border border-border px-4 py-3 text-xs font-semibold text-brand text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exports.map((item) => (
                        <tr key={item.id} className="hover:bg-muted transition-colors" data-testid={`import-auth-export-row-${item.id}`}>
                          <td className="border border-border px-4 py-3 text-sm text-foreground font-medium">
                            {item.projectName}
                          </td>
                          <td className="border border-border px-4 py-3 text-sm text-foreground text-center font-medium">
                            {item.format.toUpperCase()}
                          </td>
                          <td className="border border-border px-4 py-3 text-center">
                            {item.status === "completed" && (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
                            )}
                            {item.status === "pending" && (
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 animate-pulse">Pending</Badge>
                            )}
                            {item.status === "failed" && (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>
                            )}
                          </td>
                          <td className="border border-border px-4 py-3 text-sm text-foreground text-center">
                            {formatDate(new Date(item.requestedAt))}
                          </td>
                          <td className="border border-border px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {item.status === "completed" ? (
                                <button
                                  className="p-2 hover:bg-green-50 rounded transition-colors text-green-600 cursor-pointer"
                                  onClick={() => handleDownloadExport(item.id)}
                                  title="Download Export File"
                                  data-testid={`import-auth-export-download-btn-${item.id}`}
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              ) : item.status === "failed" ? (
                                <button
                                  className="p-2 hover:bg-red-50 rounded transition-colors text-red-500 font-semibold cursor-pointer"
                                  onClick={() => toast("error", { title: "Export Error", description: item.errorMessage || "Unknown error occurred" })}
                                  title="View Error Details"
                                  data-testid={`import-auth-export-error-btn-${item.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">Processing...</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
                  No export runs found yet.
                </div>
              )}
            </div>
          )}
        </div>
      </SettingsCard>
    </div>
  );
};

export default ImportAuthorizationPage;
