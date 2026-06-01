// components/portfolios/CreatePortfolioDialog.tsx
"use client";

import * as React from "react";
import { Plus, Table2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface CreatePortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePortfolioDialog({
  open,
  onOpenChange,
}: CreatePortfolioDialogProps) {
  const router = useRouter();

  const handleCreateEmptyPortfolio = () => {
    onOpenChange(false);
    router.push(`/portfolio`);
  };

  const handleImportFromSpreadsheet = () => {
    console.log("Import from spreadsheet");
    onOpenChange(false);
  };

  const handleUseTemplates = () => {
    console.log("Use templates");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-16 gap-0 bg-muted">
        <DialogHeader className="px-6 p-4 gap-0">
          <DialogTitle className="text-2xl font-semibold text-center text-foreground">
            Create a new Portfolio?
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
            >
              <div className="flex items-center gap-4">
                <div className="bg-card py-2 rounded-lg w-20">
                  <Image
                    alt="spreadsheet"
                    width={100}
                    height={100}
                    src="/images/projects/Spreadsheet.svg"
                  />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Import from Spreadsheet
                </span>
              </div>
            </button>

            {/* Use Templates */}
            <button
              onClick={handleUseTemplates}
              className="w-full flex justify-start p-4 rounded-md bg-muted hover:bg-muted/80 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="bg-card p-2 rounded-lg w-20">
                  <Image
                    alt="template"
                    width={100}
                    height={100}
                    src="/images/projects/Template.svg"
                  />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Use templates
                </span>
              </div>
            </button>
          </div>

          {/* Right Column - Create Empty Portfolio */}
          <div>
            <button
              onClick={handleCreateEmptyPortfolio}
              className="w-full h-full min-h-xs p-8 rounded-md bg-card shadow-md border border-border transition-all group cursor-pointer hover:bg-muted/50"
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
                <span className="text-sm font-medium text-foreground">
                  Create empty portfolio
                </span>
              </div>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}