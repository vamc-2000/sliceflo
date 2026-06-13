"use client"

import * as React from "react"
import { FileSpreadsheet, FileText, Plus, LayoutGrid, Table2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useProjectsStore } from "@/stores/projects-store"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useImpler } from "@impler/react"
import { useImportStore } from "@/stores/import-store"
import { toast } from "../ui/sonner"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
const formatImportDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })


export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { addProject } = useProjectsStore()
  const router = useRouter()
  const { addImportRecord } = useImportStore()
  const [importRows, setImportRows] = React.useState<any[]>([])


const fileInputRef = React.useRef<HTMLInputElement | null>(null)

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // TODO: parse CSV/XLSX here, for now assume you get `rows`
  const rows:any[] = [] // parsed rows

  setImportRows(rows)
  onOpenChange(false)
  router.push("/project/import-preview") // or /project?mode=import
}

  const handleCreateEmptyBoard = () => {
    // const newProject = {
    //   id: `project-${Date.now()}`,
    //   name: "New Project",
    //   status: "planning" as const,
    //   description: "A new project",
    //   icon: "📋",
    //   color: "#3B82F6",
    // }
    
    // addProject(newProject)
    onOpenChange(false)
    
    // Navigate to the new project if needed
    router.push(`/project`)
  }

  const handleImportFromSpreadsheet = () => {
    // Implement spreadsheet import logic
    // console.log("Import from spreadsheet")
    // onOpenChange(false)
      fileInputRef.current?.click()
  }

  const handleUseTemplates = () => {
    // Implement templates logic
    console.log("Use templates")
    onOpenChange(false)
  }
    // ── Impler callback ─────────────────────────────────────────────────────────
  const onDataImported = React.useCallback(async (uploadData: any) => {
    const uploadId = uploadData?._id ?? uploadData?.id
    const validRecords = uploadData?.validRecords ?? 0
    const totalRecords = uploadData?.totalRecords ?? 0

    if (!uploadId || validRecords === 0) {
      toast("error", { title: "No valid records found in the imported file." })
      return
    }

    try {
      const response = await fetch(
        `https://api.impler.io/v1/upload/${uploadId}/rows?limit=1000&page=1`,
        {
          headers: {
            "x-access-token": process.env.NEXT_PUBLIC_IMPLER_ACCESS_TOKEN!,
          },
        }
      )
      const result = await response.json()
      const rows: Record<string, any>[] = result?.data ?? result?.records ?? result ?? []

      if (!rows.length) {
        addImportRecord({
          type: "Spreadsheet",
          status: "Completed",
          statusColor: "success",
          importedNumber: `${validRecords} of ${totalRecords} records uploaded`,
          expiryDate: formatImportDate(new Date()),
          projectIds: [],
        })
        toast("success", { title: `${validRecords} records uploaded!` })
        return
      }

      const now = new Date()
      const importedProjectIds: string[] = []
      let successCount = 0

      for (const row of rows) {
        try {
          const rawName = row.name || row.Name || row["Project Name"] || `Imported-${Date.now()}`
          const projectPayload = {
            name: rawName,
            description: row.description || row.Description || "",
            status: (row.status || "active").toLowerCase(),
            priority: (row.priority || "medium").toLowerCase(),
            slug: rawName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50),
          }
          const pid = await addProject(projectPayload as any)
          importedProjectIds.push(pid)
          successCount++
        } catch (err) {
          console.error("Failed row:", row, err)
        }
      }

      addImportRecord({
        type: "Spreadsheet",
        status: successCount === rows.length ? "Completed" : successCount > 0 ? "Ongoing" : "Failed",
        statusColor: successCount === rows.length ? "success" : successCount > 0 ? "warning" : "error",
        importedNumber: `${successCount} of ${rows.length} projects imported`,
        expiryDate: formatImportDate(now),
        projectIds: importedProjectIds,
      })

      if (successCount > 0) {
        toast("success", { title: `${successCount} project${successCount > 1 ? "s" : ""} imported successfully!` })
      } else {
        toast("error", { title: "No projects created. Check column names in your file." })
      }
    } catch (err) {
      console.error("Failed to fetch rows from Impler:", err)
      addImportRecord({
        type: "Spreadsheet",
        status: "Completed",
        statusColor: "success",
        importedNumber: `${validRecords} of ${totalRecords} records uploaded`,
        expiryDate: formatImportDate(new Date()),
        projectIds: [],
      })
      toast("success", { title: `${validRecords} records uploaded successfully!` })
    }
  }, [addProject, addImportRecord])

  // ── Impler hook ──────────────────────────────────────────────────────────────
  const { showWidget, isImplerInitiated } = useImpler({
    projectId:        process.env.NEXT_PUBLIC_IMPLER_PROJECT_ID!,
    templateId:       process.env.NEXT_PUBLIC_IMPLER_TEMPLATE_ID!,
    accessToken:      process.env.NEXT_PUBLIC_IMPLER_ACCESS_TOKEN!,
    onUploadComplete: onDataImported,
    onWidgetClose:    () => console.log("Impler widget closed"),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-16 gap-0 bg-muted">
        <DialogHeader className="px-6 p-4 gap-0">
          <DialogTitle className="text-2xl font-semibold text-center text-foreground">
            Create a new Project?
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            How would you like to start?
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 px-6 pb-6">
          {/* Left Column - Import Options */}
          <div className="space-y-4 min-h-xs p-2 rounded-md bg-card shadow-md border border-border">
            {/* Import from Spreadsheet */}
            <button
              onClick={handleImportFromSpreadsheet}
              className="w-full flex justify-start p-4 rounded-md bg-muted hover:bg-muted/80 transition-colors text-left group cursor-pointer"
              data-testid="create-project-dialog-import-btn"
            >
              <div className="flex items-center gap-4">
                <div className="bg-card py-2 rounded-lg w-20">
                  <Image alt="spreadsheet" width={100} height={100} src="/images/projects/Spreadsheet.svg" />
                </div>
                <span className="text-xs font-medium text-foreground">
                  Import from Spreadsheet
                </span>
              </div>
            </button>

            {/* Use Templates */}
            <button
              onClick={handleUseTemplates}
              className="w-full flex justify-start p-4 rounded-md bg-muted hover:bg-muted/80 transition-colors text-left group cursor-pointer"
              data-testid="create-project-dialog-templates-btn"
            >
              <div className="flex items-center gap-4">
                <div className="bg-card p-2 rounded-lg w-20">
                  <Image alt="spreadsheet" width={100} height={100} src="/images/projects/Template.svg" />
                </div>
                <span className="text-xs font-medium text-foreground">
                  Use templates
                </span>
              </div>
            </button>
          </div>

          {/* Right Column - Create Empty Board */}
          <div>
            <button
              onClick={handleCreateEmptyBoard}
              className="w-full h-full min-h-xs p-8 rounded-md bg-card shadow-md border border-border transition-all group cursor-pointer hover:bg-muted/50"
              data-testid="create-project-dialog-empty-btn"
            >
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="relative">
                  <div className="bg-muted p-5 rounded-full group-hover:bg-muted/80 transition-colors">
                    <Table2 className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 bg-accent rounded-full p-1 border-2 border-background">
                    <Plus className="w-4 h-4 text-foreground" />
                  </div>
                </div>
                <span className="text-xs font-medium text-foreground">
                  Create empty project
                </span>
              </div>
            </button>
          </div>
        </div>
      </DialogContent>
       <input
        ref={fileInputRef}
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="hidden"
        onChange={handleFileChange}
      />
    </Dialog>
  )
}
