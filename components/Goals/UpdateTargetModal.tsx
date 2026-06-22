
"use client";

import { useState, useEffect } from "react";
import { GoalTarget } from "@/types/goal.types";
import { useGoalsStore } from "@/stores/goals-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Loader } from "../Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspaceStore } from "@/stores/workspace-store";


interface UpdateTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: GoalTarget | null;
}

export function UpdateTargetModal({ isOpen, onClose, target }: UpdateTargetModalProps) {
  const { addTargetNote, fetchTargetsForGoal, targetsByGoal } = useGoalsStore();
  const { workspaceMembers } = useWorkspaceStore();
  const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || "";

  const [currentValue, setCurrentValue] = useState(0);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTargetUserId = (item: any): string => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && item !== null) {
      return item.userId || item._id || item.id || "";
    }
    return "";
  };

  const getProfilePictureUrl = (profilePicture?: string | null) => {
    if (!profilePicture) return undefined;
    if (profilePicture.startsWith("http")) return profilePicture;
    return `${s3BaseUrl}/${profilePicture}`;
  };

  const getUserInitials = (name?: string | null) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 1).toUpperCase();
  };

  const getAssigneeInfo = () => {
    if (!target) return null;
    const assignees = target.assignedTo
      ? (Array.isArray(target.assignedTo) ? target.assignedTo : [target.assignedTo])
      : [];

    // Find the first valid assignee member
    for (const item of assignees) {
      const userId = getTargetUserId(item);
      const member = workspaceMembers.find(
        (m) => m.userId === userId || m._id === userId || m.id === userId
      );
      if (member) {
        const name = member.name || member.user?.name || member.email || "Unknown User";
        return {
          name,
          initials: getUserInitials(name),
          image: getProfilePictureUrl(member.profilePicture || member.user?.avatar),
        };
      }
    }

    // Secondary fallback to createdBy
    if (target.createdBy) {
      const member = workspaceMembers.find(
        (m) => m.userId === target.createdBy || m._id === target.createdBy || m.id === target.createdBy
      );
      if (member) {
        const name = member.name || member.user?.name || member.email || "Unknown User";
        return {
          name,
          initials: getUserInitials(name),
          image: getProfilePictureUrl(member.profilePicture || member.user?.avatar),
        };
      }
    }

    return null;
  };

  const assigneeInfo = getAssigneeInfo();


  // Derive start/end from target value
  const getStartValue = () => {
    if (!target) return 0;
    if (target.type === "number" || target.type === "currency") {
      const val = target.value as any;
      if (val && typeof val === "object") {
        return Number(val.start ?? 0);
      }
      return 0;
    }
    return 0;
  };

  const getEndValue = () => {
    if (!target) return 100;
    if (target.type === "number" || target.type === "currency") {
      const val = target.value as any;
      if (val && typeof val === "object") {
        return Number(val.end ?? 100);
      }
      return Number(val ?? 100);
    } else if (target.type === "boolean") {
      return 1;
    } else if (target.type === "task") {
      return target.linkedTaskIds?.length ?? 1;
    }
    return 100;
  };


  const startValue = getStartValue();
  const endValue = getEndValue();
  const range = endValue - startValue;

  const rawPercent = range > 0 ? ((currentValue - startValue) / range) * 100 : 0;
  const percentage = Math.min(100, Math.max(0, Math.round(rawPercent)));

  useEffect(() => {
    if (target) {
      let initial = startValue;
      if (target.notes && target.notes.length > 0) {
        const last = target.notes[target.notes.length - 1];
        if (last.number !== undefined) {
          initial = last.number;
        }
      }
      setCurrentValue(initial);
      setNote("");
    }
  }, [target]);

  if (!target) return null;

  const handleIncrease = () => {
    setCurrentValue((prev) => Math.min(endValue, prev + 1));
  };

  const handleDecrease = () => {
    setCurrentValue((prev) => Math.max(startValue, prev - 1));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setCurrentValue(Math.min(endValue, Math.max(startValue, val)));
  };

  const handleSaveUpdate = async () => {
    if (!target.goalId) return;

    setIsSubmitting(true);
    try {
      const isDone = currentValue >= endValue;

      await addTargetNote(target.goalId, target.id, {
        note: note.trim() || "Progress update",
        number: currentValue,
        done: isDone,
        currencyValue: target.type === "currency" ? currentValue : 0,
      });
      await fetchTargetsForGoal(target.goalId);

      toast("success", { title: "Success", description: "Progress updated successfully" });
      onClose();
    } catch (error) {
      console.error("Failed to add target note:", error);
      toast("error", { title: "Error", description: "Failed to save update. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-card text-card-foreground border-border" data-testid="update-target-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-border">
              {assigneeInfo?.image && (
                <AvatarImage src={assigneeInfo.image} alt={assigneeInfo.name} />
              )}
              <AvatarFallback className="text-xs bg-muted text-muted-foreground font-bold">
                {assigneeInfo ? assigneeInfo.initials : (target.label || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground" data-testid="target-title-display">{target.label}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {target.type === "boolean" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant={currentValue === 0 ? "default" : "outline"}
                  className={
                    currentValue === 0
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  }
                  onClick={() => setCurrentValue(0)}
                  data-testid="boolean-in-progress-btn"
                >
                  In progress
                </Button>

                <Button
                  type="button"
                  variant={currentValue === 1 ? "default" : "outline"}
                  className={
                    currentValue === 1
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  }
                  onClick={() => setCurrentValue(1)}
                  data-testid="boolean-finished-btn"
                >
                  Finished
                </Button>
              </div>
            </div>
          ) : (
            // Number / Currency layout
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground" data-testid="target-percent-display">{percentage}%</div>
                  <p className="text-sm text-muted-foreground mt-1" data-testid="target-values-summary">
                    Current: <span className="font-semibold text-foreground">{currentValue}</span>
                    {" / "}Target: <span className="font-semibold text-foreground">{endValue} {target.type === "currency" ? (target.unit || "INR") : ""}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Start: {startValue}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border" data-testid="target-progress-track">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                      data-testid="target-progress-fill"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">Target: {endValue}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDecrease}
                  disabled={currentValue <= startValue}
                  className="gap-2 border-border text-foreground hover:bg-muted"
                  data-testid="target-decrease-btn"
                >
                  <Minus className="w-4 h-4" />
                  Decrease
                </Button>
                <Button
                  size="lg"
                  onClick={handleIncrease}
                  disabled={currentValue >= endValue}
                  className="gap-2 bg-primary text-primary-foreground hover:opacity-90"
                  data-testid="target-increase-btn"
                >
                  <Plus className="w-4 h-4" />
                  Increase
                </Button>
              </div>

              <div>
                <Input
                  type="number"
                  value={currentValue}
                  onChange={handleNumberChange}
                  min={startValue}
                  max={endValue}
                  placeholder="#"
                  className="text-center text-lg font-semibold bg-background border-border text-foreground"
                  data-testid="target-value-input"
                />
              </div>
            </div>
          )}

          {/* NOTES - COMMON FOR ALL TYPES */}
          <div>
            <Textarea
              placeholder="Add a note about this update..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={250}
              className="min-h-[100px] resize-none bg-background border-border text-foreground placeholder:text-muted-foreground"
              data-testid="target-note-textarea"
            />
            <div className="text-right text-sm text-muted-foreground mt-1">
              {note.length}/250
            </div>
          </div>

          {/* SAVE BUTTON */}
          <Button
            className="w-full bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2"
            size="lg"
            onClick={handleSaveUpdate}
            disabled={isSubmitting}
            data-testid="target-save-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Save update"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
