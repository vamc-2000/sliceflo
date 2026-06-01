"use client";
import React, { useEffect, useState } from "react";
import { useAutomationStore } from "@/stores/automation-store";
import { useRouter } from "next/navigation";
import { Zap, Plus, Trash2, Edit3, Copy, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";

interface AutomationsListProps {
  projectId: string;
}

// Maps trigger id → readable label
const TRIGGER_LABELS: Record<string, string> = {
  TASK_CREATED: "Task Created",
  TASK_UPDATED: "Task Updated",
  STATUS_CHANGED: "Status Changed",
  PRIORITY_CHANGED: "Priority Changed",
  DUE_DATE_CHANGED: "Due Date Changed",
  ASSIGNEE_CHANGED: "Assignee Changed",
  SUBTASK_CREATED: "Subtask Created",
  WATCHER_ADDED: "Watcher Added",
};

export default function AutomationsList({ projectId }: AutomationsListProps) {
  const router = useRouter();
  const fetchAutomations = useAutomationStore(s => s.fetchAutomations);
  const automations = useAutomationStore(s => s.getAutomationsByProject(projectId));
  const toggleAutomation = useAutomationStore(s => s.toggleAutomation);
  const deleteAutomation = useAutomationStore(s => s.deleteAutomation);
  const duplicateAutomation = useAutomationStore(s => s.duplicateAutomation);
  const isLoading = useAutomationStore(s => s.isLoading);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch on mount
  useEffect(() => {
    fetchAutomations(projectId);
  }, [projectId]);

  const handleToggle = async (automationId: string) => {
    setTogglingId(automationId);
    await toggleAutomation(projectId, automationId);
    setTogglingId(null);
  };

  const handleDelete = async (automationId: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(automationId);
    await deleteAutomation(projectId, automationId);
    setDeletingId(null);
  };

  const handleDuplicate = async (automationId: string) => {
    await duplicateAutomation(projectId, automationId);
  };

  const handleEdit = (automationId: string) => {
    router.push(`/project/${projectId}/automations/${automationId}`);
  };

  const handleCreate = () => {
    router.push(`/project/${projectId}/automations/new`);
  };

  // ── Loading state ──────────────────────────────────
  if (isLoading && automations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-400 font-medium">Loading automations...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Automations</h2>
            <p className="text-xs text-gray-400 font-medium">
              {automations.length} automation{automations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreate}
          className="h-9 px-4 bg-[#001F3F] hover:bg-[#002b5a] text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Automation
        </Button>
      </div>

      {/* Empty State */}
      {automations.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Zap className="w-7 h-7 text-blue-400" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-bold text-gray-700">No automations yet</h3>
            <p className="text-xs text-gray-400 font-medium mt-1">
              Create your first automation to automate repetitive tasks
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="h-9 px-5 bg-[#001F3F] hover:bg-[#002b5a] text-white text-xs font-semibold rounded-lg"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Automation
          </Button>
        </div>
      )}

      {/* Automations List */}
      {automations.length > 0 && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {automations.map(automation => (
              <div
                key={automation.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-4"
              >
                <div className="flex items-center justify-between">
                  {/* Left — Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${automation.isActive ? "bg-green-50" : "bg-gray-100"
                      }`}>
                      <Zap className={`w-4 h-4 ${automation.isActive ? "text-green-500" : "text-gray-400"
                        }`} />
                    </div>

                    {/* Name + trigger */}
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {automation.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {/* Trigger badge */}
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {TRIGGER_LABELS[automation.trigger] ?? automation.trigger}
                        </span>
                        {/* Actions count */}
                        <span className="text-xs text-gray-400 font-medium">
                          {automation.actions?.length ?? 0} action{automation.actions?.length !== 1 ? "s" : ""}
                        </span>
                        {/* Active badge */}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${automation.isActive
                            ? "text-green-600 bg-green-50"
                            : "text-gray-400 bg-gray-100"
                          }`}>
                          {automation.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right — Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {/* Toggle Switch */}
                    <Switch
                      checked={automation.isActive}
                      onCheckedChange={() => handleToggle(automation.id!)}
                      disabled={togglingId === automation.id}
                      className="data-[state=checked]:bg-green-500"
                    />

                    {/* Edit */}
                    <button
                      onClick={() => handleEdit(automation.id!)}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicate(automation.id!)}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(automation.id!, automation.name)}
                      disabled={deletingId === automation.id}
                      className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      {deletingId === automation.id
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </div>

                {/* Description if exists */}
                {automation.description && (
                  <p className="text-xs text-gray-400 font-medium mt-2 pl-12 truncate">
                    {automation.description}
                  </p>
                )}

                {/* Last updated */}
                <p className="text-xs text-gray-300 font-medium mt-1 pl-12">
                  Updated {new Date(automation.updatedAt ?? "").toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
