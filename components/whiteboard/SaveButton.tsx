"use client";

import { Button } from "@/components/ui/button";
import { Save, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveButtonProps {
  onSave: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
}

export function SaveButton({ onSave, isSaving, saveSuccess }: SaveButtonProps) {
  return (
    <div className="absolute bottom-8 right-8 z-20">
      <Button
        onClick={onSave}
        disabled={isSaving}
        className={cn(
          "bg-[#001F3F] hover:bg-[#001F3F]/90 text-white shadow-xl hover:shadow-2xl transition-all duration-200 px-6 h-11 font-medium",
          saveSuccess && "bg-green-600 hover:bg-green-600"
        )}
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            Saving...
          </>
        ) : saveSuccess ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Saved!
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save
          </>
        )}
      </Button>
    </div>
  );
}
