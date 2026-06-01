
"use client";

import { useState, useEffect } from "react";
import { GoalTarget } from "@/types/goal.types";
import { useGoalsStore } from "@/stores/goals-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Loader } from "../Loader";

interface UpdateTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: GoalTarget | null;
}

export function UpdateTargetModal({ isOpen, onClose, target }: UpdateTargetModalProps) {
  const { addTargetNote, fetchTargetsForGoal, targetsByGoal } = useGoalsStore();
  const [currentValue, setCurrentValue] = useState(0);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Percentage of current value within original start→end range
  const rawPercent = range > 0 ? ((currentValue - startValue) / range) * 100 : 0;
  const percentage = Math.min(100, Math.max(0, Math.round(rawPercent)));

  useEffect(() => {
    if (target) {
      // Initialise currentValue to the most-recent note's number, or start value
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

      // POST /goals/targets/{id}/notes
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
      <DialogContent className="max-w-xl bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
              <span className="text-xs text-muted-foreground font-bold">{(target.label || "?").charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-foreground">{target.label}</span>
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
                  <div className="text-4xl font-bold text-foreground">{percentage}%</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: <span className="font-semibold text-foreground">{currentValue}</span>
                    {" / "}Target: <span className="font-semibold text-foreground">{endValue} {target.type === "currency" ? (target.unit || "INR") : ""}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Start: {startValue}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${percentage}%` }}
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
                >
                  <Minus className="w-4 h-4" />
                  Decrease
                </Button>
                <Button
                  size="lg"
                  onClick={handleIncrease}
                  disabled={currentValue >= endValue}
                  className="gap-2 bg-primary text-primary-foreground hover:opacity-90"
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
            />
            <div className="text-right text-sm text-muted-foreground mt-1">
              {note.length}/250
            </div>
          </div>

          {/* SAVE BUTTON */}
          {isSubmitting ? (
            <div className="flex justify-center py-2">
              <Loader message="Saving update..." size="sm" />
            </div>
          ) : (
            <Button
              className="w-full bg-primary text-primary-foreground hover:opacity-90"
              size="lg"
              onClick={handleSaveUpdate}
              disabled={isSubmitting}
            >
              Save update
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
