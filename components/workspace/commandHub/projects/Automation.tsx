"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Check,
  Clock,
  ChevronLeft,
  X,
  MoreHorizontal,
  Pencil,
  Copy,
  FileDown,
  Trash2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useProjectsStore, getProfilePictureUrl } from "@/stores/projects-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useAutomationStore } from "@/stores/automation-store";
import { SYSTEM_FIELDS } from "@/stores/tasks-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AutomationProps {
  projectId: string;
}

interface AutomationSettings {
  assignCreator: {
    enabled: boolean;
    assigneeId: string;
  };
  autoFillFields: {
    enabled: boolean;
    triggerTask: boolean;
    triggerSubtask: boolean;
    fields: Record<string, { enabled: boolean; value: string }>;
  };
  autoCloseInactive: {
    enabled: boolean;
    duration: string;
    isCustom: boolean;
    customValue: string;
  };
  setDueDateToday: {
    enabled: boolean;
  };
  markParentDone: {
    enabled: boolean;
  };
}

const fallbackMembers = [
  { userId: "fallback-1", name: "James Dev", email: "james@example.com", avatar: null },
  { userId: "fallback-2", name: "Sarah Connor", email: "sarah@example.com", avatar: null },
  { userId: "fallback-3", name: "John Doe", email: "john@example.com", avatar: null },
];

const getAvatarColors = (name: string) => {
  const colors = [
    { bg: "bg-red-100 dark:bg-red-950/40", text: "text-red-700 dark:text-red-300" },
    { bg: "bg-blue-100 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300" },
    { bg: "bg-green-100 dark:bg-green-950/40", text: "text-green-700 dark:text-green-300" },
    { bg: "bg-yellow-100 dark:bg-yellow-950/40", text: "text-yellow-700 dark:text-yellow-300" },
    { bg: "bg-purple-100 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300" },
    { bg: "bg-pink-100 dark:bg-pink-950/40", text: "text-pink-700 dark:text-pink-300" },
    { bg: "bg-indigo-100 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-300" },
    { bg: "bg-teal-100 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300" },
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const durationOptions = ["1 month", "3 months", "6 months", "9 months", "12 months"];

const Automation: React.FC<AutomationProps> = ({ projectId }) => {
  const { getMembersByProject, projects, getTaskCustomFields, getTaskTypesByProject } = useProjectsStore();
  const currentProject = projects.find((p) => p.id === projectId);
  const { workspaceMembers, currentWorkspace, fetchWorkspaceMembers } = useWorkspaceStore();
  const {
    automations,
    fetchAutomations,
    createAutomation,
    updateAutomation,
    deleteAutomation,
  } = useAutomationStore();

  const syncTimeoutRef = React.useRef<Record<string, NodeJS.Timeout>>({});

  const availableFields = React.useMemo(() => {
    const defaults = SYSTEM_FIELDS
      .filter((field) => field.id !== "id" && field.id !== "task")
      .map((field) => ({
        id: field.id,
        label: field.name,
      }));
    const customFields = getTaskCustomFields(projectId) || [];
    const customs = customFields.map((cf) => ({
      id: cf.id,
      label: cf.name,
    }));
    return [...defaults, ...customs];
  }, [projectId, getTaskCustomFields]);

  const [settings, setSettings] = useState<AutomationSettings>({
    assignCreator: { enabled: true, assigneeId: "" },
    autoFillFields: {
      enabled: true,
      triggerTask: false,
      triggerSubtask: false,
      fields: {},
    },
    autoCloseInactive: { enabled: false, duration: "1 month", isCustom: false, customValue: "3" },
    setDueDateToday: { enabled: false },
    markParentDone: { enabled: false },
  });

  const [activeDropdown, setActiveDropdown] = useState<"assignee" | "fields" | "duration" | null>(null);
  const [activeSubDropdown, setActiveSubDropdown] = useState<string | null>(null);
  const [showCustomRangeInput, setShowCustomRangeInput] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | "active" | "inactive">("all");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  useEffect(() => {
    if (activeDropdown !== "assignee") {
      setMemberSearchQuery("");
    }
  }, [activeDropdown]);

  const members = React.useMemo(() => {
    const projectMembers = getMembersByProject(projectId);
    const list = [...projectMembers];
    const enriched = list.map((pm) => {
      const wm = workspaceMembers.find((m) => m.userId === pm.userId);
      const rawAvatar = pm.avatar || wm?.profilePicture || null;
      let displayName = pm.name || wm?.name || "Member";
      if (/^[0-9a-fA-F]{24}$/.test(displayName)) {
        displayName = "Member";
      }
      return {
        userId: pm.userId,
        name: displayName,
        email: pm.email || wm?.email || "",
        avatar: rawAvatar ? getProfilePictureUrl(rawAvatar) : null,
      };
    });

    if (enriched.length > 0) return enriched;

    if (workspaceMembers.length > 0) {
      return workspaceMembers.map((m) => {
        let displayName = m.name || "Member";
        if (/^[0-9a-fA-F]{24}$/.test(displayName)) {
          displayName = "Member";
        }
        return {
          userId: m.userId,
          name: displayName,
          email: m.email || "",
          avatar: m.profilePicture ? getProfilePictureUrl(m.profilePicture) : null,
        };
      });
    }

    return fallbackMembers.map((m) => ({
      ...m,
      avatar: m.avatar ? getProfilePictureUrl(m.avatar) : null,
    }));
  }, [projectId, getMembersByProject, workspaceMembers]);

  // Sync settings to backend API
  const syncSettingsToApi = (key: keyof AutomationSettings, updatedSettings: AutomationSettings) => {
    if (syncTimeoutRef.current[key]) {
      clearTimeout(syncTimeoutRef.current[key]);
    }

    syncTimeoutRef.current[key] = setTimeout(async () => {
      const projectAutomations = automations.filter((a) => a.projectId === projectId);

      if (key === "assignCreator") {
        const existing = projectAutomations.find(
          (a) => a.name === "Assign creator as assignee when task is assigned"
        );
        const config = updatedSettings.assignCreator;

        const payload = {
          name: "Assign creator as assignee when task is assigned",
          description: "When someone assigns a task, automatically reassign it to the task's creator (reporter).",
          trigger: "TASK_ASSIGNED",
          isActive: config.enabled,
          conditions: [],
          actions: [
            {
              type: "ASSIGN_TASK",
              value: config.assigneeId || (members[0]?.userId || ""),
            },
          ],
        };

        try {
          if (existing?.id) {
            await updateAutomation(projectId, existing.id, payload);
          } else {
            await createAutomation(projectId, payload);
          }
        } catch (err) {
          console.error("Failed to sync assignCreator automation", err);
        }
      }

      if (key === "autoFillFields") {
        const config = updatedSettings.autoFillFields;

        // Build the actions array from the enabled fields
        const actions: any[] = [];
        Object.entries(config.fields).forEach(([fieldId, fieldConfig]) => {
          if (fieldConfig.enabled) {
            let actionType = "UPDATE_FIELD";
            let actionValue: any = fieldConfig.value;

            if (fieldId === "status") actionType = "CHANGE_STATUS";
            else if (fieldId === "priority") actionType = "SET_PRIORITY";
            else if (fieldId === "assignee") {
              if (fieldConfig.value === "ASSIGN_TO_REPORTER") {
                actionType = "ASSIGN_TO_REPORTER";
                actionValue = undefined;
              } else if (fieldConfig.value === "ASSIGN_TO_PROJECT_LEAD") {
                actionType = "ASSIGN_TO_PROJECT_LEAD";
                actionValue = undefined;
              } else {
                actionType = "ASSIGN_TASK";
              }
            }
            else if (fieldId === "dueDate" || fieldId === "date") actionType = "SET_DUE_DATE";
            else if (fieldId === "startDate") actionType = "SET_START_DATE";

            const actionObj: any = { type: actionType };
            if (actionValue !== undefined) {
              actionObj.value = actionValue;
            }
            actions.push(actionObj);
          }
        });

        // 1. Sync Task Creation trigger automation
        const existingTask = projectAutomations.find(
          (a) => a.name === "Fill fields on task creation"
        );
        const taskPayload = {
          name: "Fill fields on task creation",
          description: "Pre-fill selected fields like priority, status, due date, or assignee when a task is created.",
          trigger: "TASK_CREATED",
          isActive: config.enabled && config.triggerTask,
          conditions: [],
          actions: actions,
        };

        // 2. Sync Subtask Creation trigger automation
        const existingSubtask = projectAutomations.find(
          (a) => a.name === "Fill fields on subtask creation"
        );
        const subtaskPayload = {
          name: "Fill fields on subtask creation",
          description: "Pre-fill selected fields like priority, status, due date, or assignee when a sub task is created.",
          trigger: "SUBTASK_CREATED",
          isActive: config.enabled && config.triggerSubtask,
          conditions: [],
          actions: actions,
        };

        try {
          if (actions.length === 0) {
            if (existingTask?.id) {
              await deleteAutomation(projectId, existingTask.id);
            }
            if (existingSubtask?.id) {
              await deleteAutomation(projectId, existingSubtask.id);
            }
          } else {
            const isTaskActive = config.enabled && config.triggerTask;
            const isSubtaskActive = config.enabled && config.triggerSubtask;

            // Task trigger
            if (existingTask?.id) {
              await updateAutomation(projectId, existingTask.id, {
                ...taskPayload,
                isActive: isTaskActive,
              });
            } else if (isTaskActive) {
              await createAutomation(projectId, {
                ...taskPayload,
                isActive: true,
              });
            } else if (existingTask?.id) {
              // If it's disabled but exists, make sure to update its active state to false
              await updateAutomation(projectId, existingTask.id, {
                ...taskPayload,
                isActive: false,
              });
            }

            // Subtask trigger
            if (existingSubtask?.id) {
              await updateAutomation(projectId, existingSubtask.id, {
                ...subtaskPayload,
                isActive: isSubtaskActive,
              });
            } else if (isSubtaskActive) {
              await createAutomation(projectId, {
                ...subtaskPayload,
                isActive: true,
              });
            } else if (existingSubtask?.id) {
              // If it's disabled but exists, make sure to update its active state to false
              await updateAutomation(projectId, existingSubtask.id, {
                ...subtaskPayload,
                isActive: false,
              });
            }
          }
        } catch (err) {
          console.error("Failed to sync autoFillFields automation", err);
        }
      }

      if (key === "autoCloseInactive") {
        const existing = projectAutomations.find(
          (a) => a.name === "Auto-close tasks that are inactive"
        );
        const config = updatedSettings.autoCloseInactive;

        const payload = {
          name: "Auto-close tasks that are inactive",
          description: `Duration: ${config.duration}`,
          trigger: "TASK_UPDATED",
          isActive: config.enabled,
          conditions: [],
          actions: [
            {
              type: "CHANGE_STATUS",
              value: "Done",
              condition: {
                field: "status",
                operator: "EQUALS",
                conditionType: "FIELD_VALUE",
                value: "Done",
                from: "",
                to: "",
              },
              then: [],
              else: [],
            },
          ],
        };

        try {
          if (existing?.id) {
            await updateAutomation(projectId, existing.id, payload);
          } else {
            await createAutomation(projectId, payload);
          }
        } catch (err) {
          console.error("Failed to sync autoCloseInactive automation", err);
        }
      }

      if (key === "setDueDateToday") {
        const existing = projectAutomations.find(
          (a) => a.name === "Set Due date is today, when status is Done for task/sub task"
        );
        const config = updatedSettings.setDueDateToday;

        const payload = {
          name: "Set Due date is today, when status is Done for task/sub task",
          description: "Automatically updates the due date to today when a task status is marked as Done.",
          trigger: "STATUS_CHANGED",
          isActive: config.enabled,
          conditions: [],
          actions: [
            {
              type: "IF_ELSE",
              condition: {
                field: "status",
                operator: "EQUALS",
                conditionType: "FIELD_VALUE",
                value: "Done",
                from: "",
                to: "",
              },
              then: [
                {
                  type: "SET_DUE_DATE",
                  value: "today",
                  condition: {
                    field: "dueDate",
                    operator: "EQUALS",
                    conditionType: "FIELD_VALUE",
                    value: "today",
                    from: "",
                    to: "",
                  },
                  then: [],
                  else: [],
                },
              ],
              else: [],
            },
          ],
        };

        try {
          if (existing?.id) {
            await updateAutomation(projectId, existing.id, payload);
          } else {
            await createAutomation(projectId, payload);
          }
        } catch (err) {
          console.error("Failed to sync setDueDateToday automation", err);
        }
      }

      if (key === "markParentDone") {
        const existing = projectAutomations.find(
          (a) => a.name === "Mark parent task as done when all subtasks are done"
        );
        const config = updatedSettings.markParentDone;
        const statuses = currentProject?.taskStatusConfig || [];
        const doneStatus = statuses.find(
          (s) => s.value.toLowerCase() === "done" || s.label.toLowerCase() === "done"
        )?.value || "done";

        const payload = {
          name: "Mark parent task as done when all subtasks are done",
          description: "When a subtask is completed, check whether every other subtask under the same parent is also done. If so, automatically mark the parent task as done.",
          trigger: "SUBTASK_COMPLETED",
          isActive: config.enabled,
          conditions: [
            { conditionType: "ALL_SUBTASKS_DONE" } as any
          ],
          actions: [
            { type: "CHANGE_STATUS", value: doneStatus }
          ]
        };

        try {
          if (existing?.id) {
            await updateAutomation(projectId, existing.id, payload);
          } else {
            await createAutomation(projectId, payload);
          }
        } catch (err) {
          console.error("Failed to sync markParentDone automation", err);
        }
      }
    }, 500);
  };

  // Fetch workspace members on mount/change
  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkspaceMembers(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchWorkspaceMembers]);

  // Load settings from database automations
  useEffect(() => {
    if (projectId) {
      fetchAutomations(projectId);
    }
  }, [projectId, fetchAutomations]);

  useEffect(() => {
    const projectAutomations = automations.filter((a) => a.projectId === projectId);
    const hasDatabaseAutomations = projectAutomations.length > 0;

    if (hasDatabaseAutomations) {
      const assignCreatorAuto = projectAutomations.find(
        (a) => a.name === "Assign creator as assignee when task is assigned"
      );
      const taskAutoFill = projectAutomations.find(
        (a) => a.name === "Fill fields on task creation"
      );
      const subtaskAutoFill = projectAutomations.find(
        (a) => a.name === "Fill fields on subtask creation"
      );
      const autoClose = projectAutomations.find(
        (a) => a.name === "Auto-close tasks that are inactive"
      );
      const setDueDate = projectAutomations.find(
        (a) => a.name === "Set Due date is today, when status is Done for task/sub task"
      );
      const markParent = projectAutomations.find(
        (a) => a.name === "Mark parent task as done when all subtasks are done"
      );

      const newSettings: AutomationSettings = {
        assignCreator: {
          enabled: assignCreatorAuto ? assignCreatorAuto.isActive : false,
          assigneeId: assignCreatorAuto?.actions?.[0]?.value || (members[0]?.userId || ""),
        },
        autoFillFields: {
          enabled: (taskAutoFill?.isActive || subtaskAutoFill?.isActive) ?? false,
          triggerTask: taskAutoFill ? taskAutoFill.isActive : false,
          triggerSubtask: subtaskAutoFill ? subtaskAutoFill.isActive : false,
          fields: {},
        },
        autoCloseInactive: {
          enabled: autoClose ? autoClose.isActive : false,
          duration: "1 month",
          isCustom: false,
          customValue: "3",
        },
        setDueDateToday: {
          enabled: setDueDate ? setDueDate.isActive : false,
        },
        markParentDone: {
          enabled: markParent ? markParent.isActive : false,
        },
      };

      const fields: Record<string, { enabled: boolean; value: string }> = {};
      availableFields.forEach((field) => {
        fields[field.id] = {
          enabled: false,
          value: "Select",
        };
      });

      const fillFromActions = (actionsList: any[]) => {
        actionsList.forEach((action) => {
          let fieldId = action.condition?.field;
          let val = action.value || action.condition?.value || "Select";
          if (!fieldId) {
            if (action.type === "CHANGE_STATUS") fieldId = "status";
            else if (action.type === "SET_PRIORITY") fieldId = "priority";
            else if (action.type === "ASSIGN_TASK") {
              fieldId = "assignee";
            } else if (action.type === "ASSIGN_TO_REPORTER") {
              fieldId = "assignee";
              val = "ASSIGN_TO_REPORTER";
            } else if (action.type === "ASSIGN_TO_PROJECT_LEAD") {
              fieldId = "assignee";
              val = "ASSIGN_TO_PROJECT_LEAD";
            } else if (action.type === "SET_DUE_DATE") fieldId = "dueDate";
            else if (action.type === "SET_START_DATE") fieldId = "startDate";
          }
          if (fieldId && fields[fieldId]) {
            fields[fieldId] = {
              enabled: true,
              value: val,
            };
          }
        });
      };

      if (taskAutoFill?.actions) fillFromActions(taskAutoFill.actions);
      if (subtaskAutoFill?.actions) fillFromActions(subtaskAutoFill.actions);

      newSettings.autoFillFields.fields = fields;

      if (autoClose) {
        let duration = autoClose.description || "1 month";
        if (duration.startsWith("Duration: ")) {
          duration = duration.replace("Duration: ", "");
        }
        newSettings.autoCloseInactive.duration = duration;
        if (!durationOptions.includes(duration)) {
          newSettings.autoCloseInactive.isCustom = true;
          newSettings.autoCloseInactive.customValue = duration
            .replace(" months", "")
            .replace(" month", "");
          setShowCustomRangeInput(true);
        } else {
          setShowCustomRangeInput(false);
        }
      }

      setSettings(newSettings);
    } else {
      // Fallback/Migration path: check localStorage
      const saved = localStorage.getItem(`automations_settings_${projectId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.autoFillFields && !parsed.autoFillFields.fields) {
            parsed.autoFillFields.fields = {};
          }
          const fields = parsed.autoFillFields.fields;
          availableFields.forEach((field) => {
            if (!fields[field.id]) {
              fields[field.id] = { enabled: false, value: "Select" };
            }
          });
          setSettings(parsed);
          if (parsed.autoCloseInactive?.isCustom) {
            setShowCustomRangeInput(true);
          }

          setTimeout(() => {
            syncSettingsToApi("assignCreator", parsed);
            syncSettingsToApi("autoFillFields", parsed);
            syncSettingsToApi("autoCloseInactive", parsed);
            syncSettingsToApi("setDueDateToday", parsed);
            syncSettingsToApi("markParentDone", parsed);
          }, 100);
        } catch (e) {
          console.error("Error loading automations settings", e);
        }
      } else {
        const initialFields: Record<string, { enabled: boolean; value: string }> = {};
        availableFields.forEach((field) => {
          initialFields[field.id] = {
            enabled: field.id === "priority",
            value: "Select",
          };
        });
        const defaults: AutomationSettings = {
          assignCreator: { enabled: true, assigneeId: members[0]?.userId || "" },
          autoFillFields: {
            enabled: true,
            triggerTask: false,
            triggerSubtask: false,
            fields: initialFields,
          },
          autoCloseInactive: { enabled: false, duration: "1 month", isCustom: false, customValue: "3" },
          setDueDateToday: { enabled: false },
          markParentDone: { enabled: false },
        };
        setSettings(defaults);
        setShowCustomRangeInput(false);

        setTimeout(() => {
          syncSettingsToApi("assignCreator", defaults);
          syncSettingsToApi("autoFillFields", defaults);
          syncSettingsToApi("autoCloseInactive", defaults);
          syncSettingsToApi("setDueDateToday", defaults);
          syncSettingsToApi("markParentDone", defaults);
        }, 100);
      }
    }
  }, [projectId, automations, availableFields, members]);

  // Save settings to localStorage and trigger API sync
  const saveSettings = (newSettings: AutomationSettings, key: keyof AutomationSettings) => {
    setSettings(newSettings);
    localStorage.setItem(`automations_settings_${projectId}`, JSON.stringify(newSettings));
    syncSettingsToApi(key, newSettings);
  };

  const toggleAutomation = (key: keyof AutomationSettings) => {
    const updated = {
      ...settings,
      [key]: {
        ...settings[key],
        enabled: !settings[key].enabled,
      },
    };
    if (key === "autoFillFields" && updated.autoFillFields.enabled) {
      if (!updated.autoFillFields.triggerTask && !updated.autoFillFields.triggerSubtask) {
        updated.autoFillFields.triggerTask = true;
      }
    }
    saveSettings(updated, key);
  };

  const handleSelectAssignee = (userId: string) => {
    const updated = {
      ...settings,
      assignCreator: {
        ...settings.assignCreator,
        assigneeId: userId,
      },
    };
    saveSettings(updated, "assignCreator");
    setActiveDropdown(null);
  };

  const handleToggleTrigger = (type: "triggerTask" | "triggerSubtask") => {
    const updated = {
      ...settings,
      autoFillFields: {
        ...settings.autoFillFields,
        [type]: !settings.autoFillFields[type],
      },
    };
    saveSettings(updated, "autoFillFields");
  };

  const handleToggleFieldEnabled = (fieldId: string) => {
    const fieldSettings = settings.autoFillFields.fields[fieldId] || { enabled: false, value: "Select" };
    const nextEnabled = !fieldSettings.enabled;
    let nextValue = fieldSettings.value;
    if (nextEnabled && nextValue === "Select") {
      const options = getFieldOptions(fieldId);
      if (options.length > 0) {
        nextValue = options[0].value;
      }
    }
    const updated = {
      ...settings,
      autoFillFields: {
        ...settings.autoFillFields,
        fields: {
          ...settings.autoFillFields.fields,
          [fieldId]: {
            enabled: nextEnabled,
            value: nextValue,
          },
        },
      },
    };
    saveSettings(updated, "autoFillFields");
  };

  const handleSelectFieldValue = (fieldId: string, value: string) => {
    const fieldSettings = settings.autoFillFields.fields[fieldId] || { enabled: false, value: "Select" };
    const updated = {
      ...settings,
      autoFillFields: {
        ...settings.autoFillFields,
        fields: {
          ...settings.autoFillFields.fields,
          [fieldId]: {
            ...fieldSettings,
            value: value,
          },
        },
      },
    };
    saveSettings(updated, "autoFillFields");
    setActiveSubDropdown(null);
  };

  const handleSelectDuration = (duration: string) => {
    const updated = {
      ...settings,
      autoCloseInactive: {
        ...settings.autoCloseInactive,
        duration,
        isCustom: false,
      },
    };
    setShowCustomRangeInput(false);
    saveSettings(updated, "autoCloseInactive");
    setActiveDropdown(null);
  };

  const handleCustomRangeToggle = () => {
    const nextState = !showCustomRangeInput;
    setShowCustomRangeInput(nextState);
    if (nextState) {
      const updated = {
        ...settings,
        autoCloseInactive: {
          ...settings.autoCloseInactive,
          isCustom: true,
          duration: `${settings.autoCloseInactive.customValue} months`,
        },
      };
      saveSettings(updated, "autoCloseInactive");
    }
  };

  const handleCustomMonthsChange = (val: string) => {
    const updated = {
      ...settings,
      autoCloseInactive: {
        ...settings.autoCloseInactive,
        customValue: val,
        duration: `${val || "0"} months`,
      },
    };
    saveSettings(updated, "autoCloseInactive");
  };

  const getFieldOptions = (fieldId: string) => {
    switch (fieldId) {
      case "priority": {
        const priorities = currentProject?.taskPriorityConfig || [];
        if (priorities.length > 0) {
          return priorities.map((p) => ({ label: p.label, value: p.value }));
        }
        return [
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
        ];
      }
      case "status": {
        const statuses = currentProject?.taskStatusConfig || [];
        if (statuses.length > 0) {
          return statuses.map((s) => ({ label: s.label, value: s.value }));
        }
        return [
          { label: "Backlog", value: "backlog" },
          { label: "To Do", value: "todo" },
          { label: "In Progress", value: "in_progress" },
          { label: "Done", value: "done" },
        ];
      }
      case "assignee":
        return [
          { label: "Reporter (Creator)", value: "ASSIGN_TO_REPORTER" },
          { label: "Project Lead", value: "ASSIGN_TO_PROJECT_LEAD" },
          ...members.map((m) => ({ label: m.name, value: m.userId })),
        ];
      case "date":
      case "startDate":
      case "endDate":
        return [
          { label: "Today", value: "today" },
          { label: "Tomorrow", value: "tomorrow" },
          { label: "Next Week", value: "next_week" },
        ];
      case "taskType": {
        const types = getTaskTypesByProject(projectId) || [];
        if (types.length > 0) {
          return types.map((t) => ({ label: t.label, value: t.value }));
        }
        return [
          { label: "Task", value: "task" },
          { label: "Milestone", value: "milestone" },
          { label: "Approval", value: "approval" },
          { label: "Meeting", value: "meeting" },
        ];
      }
      case "cycle": {
        const cycles = currentProject?.cycles || [];
        if (cycles.length > 0) {
          return cycles.map((c) => ({ label: c.name || `Cycle ${c.cycleNumber}`, value: c.id }));
        }
        return [
          { label: "Cycle 1", value: "cycle-1" },
          { label: "Cycle 2", value: "cycle-2" },
        ];
      }
      default: {
        const customFields = getTaskCustomFields(projectId) || [];
        const field = customFields.find((cf) => cf.id === fieldId);
        if (field) {
          if (field.type === "date") {
            return [
              { label: "Today", value: "today" },
              { label: "Tomorrow", value: "tomorrow" },
              { label: "Next Week", value: "next_week" },
            ];
          }
          if (Array.isArray(field.options)) {
            return field.options.map((opt) => {
              const label = typeof opt === "string" ? opt : opt.value;
              return { label, value: label };
            });
          }
        }
        return [];
      }
    }
  };

  const getFieldLabel = (fieldId: string, value: string) => {
    if (value === "Select") return "Select";
    const options = getFieldOptions(fieldId);
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  const selectedAssignee = members.find((m) => m.userId === settings.assignCreator.assigneeId) || members[0];

  const historyEntries = [
    {
      id: "h-1",
      status: "success",
      date: "Jul 30,2025",
      time: "11:21 AM",
      description: "When an item is created set Due date to",
    },
    {
      id: "h-2",
      status: "success",
      date: "Jul 30,2025",
      time: "11:21 AM",
      description: "When an item is created set Due date to",
    },
    {
      id: "h-3",
      status: "success",
      date: "Jul 30,2025",
      time: "11:21 AM",
      description: "When an item is created set Due date to",
    },
    {
      id: "h-4",
      status: "failure",
      date: "Jul 30,2025",
      time: "11:21 AM",
      description: "When an item is created set Due date to",
    },
    {
      id: "h-5",
      status: "failure",
      date: "Jul 30,2025",
      time: "11:21 AM",
      description: "When an item is created set Due date to",
    },
  ];

  const filteredHistory = React.useMemo(() => {
    if (historyFilter === "all") return historyEntries;
    if (historyFilter === "active") return historyEntries.filter((run) => run.status === "success");
    if (historyFilter === "inactive") return historyEntries.filter((run) => run.status === "failure");
    return historyEntries;
  }, [historyFilter, historyEntries]);

  if (isHistoryOpen) {
    return (
      <div className="w-full space-y-4 select-none relative pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-semibold text-foreground">
              Run history
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Subtext
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-9 h-9 rounded-xl bg-secondary hover:bg-accent hover:text-accent-foreground flex items-center justify-center text-muted-foreground transition-colors cursor-pointer border border-transparent focus:outline-none"
                  title="Filter runs"
                >
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 bg-popover border border-border rounded-xl shadow-lg p-1 space-y-0.5 text-popover-foreground">
                <DropdownMenuItem
                  onClick={() => setHistoryFilter("all")}
                  className={cn(
                    "w-full text-left px-3.5 py-2 hover:bg-accent hover:text-accent-foreground text-[13px] transition-colors cursor-pointer rounded-lg font-medium",
                    historyFilter === "all" ? "border-l-[3px] border-l-primary font-bold bg-accent text-primary dark:text-foreground" : "text-muted-foreground"
                  )}
                >
                  All
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setHistoryFilter("active")}
                  className={cn(
                    "w-full text-left px-3.5 py-2 hover:bg-accent hover:text-accent-foreground text-[13px] transition-colors cursor-pointer rounded-lg font-medium",
                    historyFilter === "active" ? "border-l-[3px] border-l-primary font-bold bg-accent text-primary dark:text-foreground" : "text-muted-foreground"
                  )}
                >
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setHistoryFilter("inactive")}
                  className={cn(
                    "w-full text-left px-3.5 py-2 hover:bg-accent hover:text-accent-foreground text-[13px] transition-colors cursor-pointer rounded-lg font-medium",
                    historyFilter === "inactive" ? "border-l-[3px] border-l-primary font-bold bg-accent text-primary dark:text-foreground" : "text-muted-foreground"
                  )}
                >
                  Inactive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Back button */}
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="px-4 h-9 rounded-lg bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100/80 border border-orange-200 dark:border-orange-900/30 flex items-center gap-2 text-orange-600 dark:text-orange-400 text-[12px] font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 8 8 12 12 16" />
                <line x1="16" y1="12" x2="8" y2="12" />
              </svg>
              Go back to Automations
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-2">
          {filteredHistory.map((run, idx) => (
            <div
              key={`${run.id}-${idx}`}
              className={`group flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:shadow-sm transition-all duration-200 border-l-[6px] ${run.status === "success"
                  ? "border-l-[#22C55E]"
                  : "border-l-[#EF4444]"
                }`}
            >
              <div className="flex items-center gap-4">
                {/* Status Badge Image */}
                {run.status === "success" ? (
                  <img src="/images/Right.svg" className="w-8 h-8 shrink-0" alt="success" />
                ) : (
                  <img src="/images/Wrong.svg" className="w-8 h-8 shrink-0" alt="failure" />
                )}

                {/* Date & Time */}
                <span className="text-[12px] text-muted-foreground font-medium whitespace-nowrap">
                  {run.date} <span className="text-muted-foreground/30 mx-1.5">|</span> {run.time}
                </span>

                {/* Description */}
                <span className="text-[12px] text-foreground font-normal leading-none flex items-center gap-1">
                  When an item is created set <strong className="font-bold">Due date</strong> to
                </span>
              </div>

              {/* Action menu icon */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-muted-foreground focus:outline-none cursor-pointer">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover border border-border text-popover-foreground rounded-xl shadow-lg p-1.5 space-y-0.5">
                  <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground text-[13px] rounded-lg cursor-pointer transition-colors font-medium">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground text-[13px] rounded-lg cursor-pointer transition-colors font-medium">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground text-[13px] rounded-lg cursor-pointer transition-colors font-medium">
                    <FileDown className="w-4 h-4 text-muted-foreground" />
                    Save as template
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 hover:bg-accent hover:text-accent-foreground text-[13px] rounded-lg cursor-pointer transition-colors font-medium">
                    <History className="w-4 h-4 text-muted-foreground" />
                    Run history
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-[13px] text-red-500 dark:text-red-400 rounded-lg cursor-pointer transition-colors font-semibold">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 select-none relative pb-10 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">
            Automations
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Subtext
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Create automation Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-3.5 h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 text-[12px] font-semibold transition-colors shadow-sm cursor-pointer focus:outline-none">
                <span>Create automation</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-popover border border-border text-popover-foreground rounded-xl shadow-lg p-1.5 space-y-0.5">
              <DropdownMenuItem className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-[13px] rounded-lg cursor-pointer transition-colors font-medium">
                Create from scratch
              </DropdownMenuItem>
              <DropdownMenuItem className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-[13px] rounded-lg cursor-pointer transition-colors font-medium">
                Create from templates
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100/80 border border-orange-200 dark:border-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 transition-colors shadow-sm cursor-pointer focus:outline-none"
            title="View history logs"
          >
            <History className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Global Transparent Dropdown Closer */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => {
            setActiveDropdown(null);
            setActiveSubDropdown(null);
          }}
        />
      )}

      {/* Automation Cards List */}
      <div className="space-y-4 py-4">
        {/* Card 1: Assign Creator */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1 pr-6">
              <h3 className="text-[15px] font-semibold text-foreground">
                Assign creator as assignee when task is assigned
              </h3>
              <p className="text-[13px] text-muted-foreground font-normal leading-relaxed">
                When someone assigns a task, automatically reassign it to the task's creator (reporter).
              </p>
            </div>
            <Switch
              checked={settings.assignCreator.enabled}
              onCheckedChange={() => toggleAutomation("assignCreator")}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {settings.assignCreator.enabled && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-3.5 p-3 bg-secondary rounded-lg flex items-center justify-between border border-border transition-all"
            >
              <span className="text-[12px] text-muted-foreground font-medium">
                Select default assignee.
              </span>
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === "assignee" ? null : "assignee")}
                  className="px-2.5 py-1.5 bg-background border border-input rounded-lg text-[12px] text-foreground flex items-center gap-2 shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors min-w-[130px] justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Avatar className="w-4.5 h-4.5 shrink-0">
                      <AvatarImage src={selectedAssignee?.avatar || undefined} />
                      <AvatarFallback className={cn("text-[9px] font-bold", getAvatarColors(selectedAssignee?.name || "U").bg, getAvatarColors(selectedAssignee?.name || "U").text)}>
                        {selectedAssignee?.name ? selectedAssignee.name[0].toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate max-w-[80px]">
                      {selectedAssignee?.name}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                </button>

                {activeDropdown === "assignee" && (
                  <div className="absolute right-0 mt-1.5 w-56 bg-popover border border-border rounded-xl shadow-xl z-50 p-2.5 space-y-2 text-popover-foreground">
                    <div className="text-[12px] font-semibold px-1">
                      Members
                    </div>
                    <div className="relative flex items-center">
                      <svg className="w-3 h-3 text-muted-foreground absolute left-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search current members"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full pl-6.5 pr-2 h-6.5 border border-input rounded-md text-[10px] bg-transparent focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin scrollbar-thumb-muted/30">
                      {members.filter((member) =>
                        member.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        member.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
                      ).length === 0 ? (
                        <div className="text-center py-4 text-[11px] text-muted-foreground font-semibold">
                          No members added yet
                        </div>
                      ) : (
                        members
                          .filter((member) =>
                            member.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                            member.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
                          )
                          .map((member) => (
                            <button
                               key={member.userId}
                               onClick={() => handleSelectAssignee(member.userId)}
                               className="w-full text-left px-2 py-1 hover:bg-accent hover:text-accent-foreground rounded-lg flex items-center gap-2 text-[11px] transition-colors cursor-pointer"
                            >
                              <Avatar className="w-5 h-5 shrink-0">
                                <AvatarImage src={member.avatar || undefined} />
                                <AvatarFallback className={cn("text-[9px] font-bold", getAvatarColors(member.name || "U").bg, getAvatarColors(member.name || "U").text)}>
                                  {member.name ? member.name[0].toUpperCase() : "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate leading-tight">
                                  {member.name}
                                </p>
                                <p className="text-[9px] text-muted-foreground truncate leading-none">
                                  {member.email}
                                </p>
                              </div>
                              {settings.assignCreator.assigneeId === member.userId && (
                                <Check className="w-3 h-3 text-primary dark:text-foreground shrink-0" />
                              )}
                            </button>
                          ))
                      )}
                    </div>
                    <div className="border-t border-border pt-2">
                      <button className="w-full py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer">
                        <span>+ Add</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Auto Fill Fields */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1 pr-6">
              <h3 className="text-[15px] font-semibold text-foreground">
                Automatically fill fields on task/sub task creation
              </h3>
              <p className="text-[13px] text-muted-foreground font-normal leading-relaxed">
                Pre-fill selected fields like priority, status, due date, or assignee when a task or subtask is created.
              </p>
            </div>
            <Switch
              checked={settings.autoFillFields.enabled}
              onCheckedChange={() => toggleAutomation("autoFillFields")}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {settings.autoFillFields.enabled && (
            <div className="mt-4 p-4 bg-secondary rounded-lg border border-border space-y-4 transition-all">
              <div className="space-y-2.5">
                <span className="text-[13px] font-semibold text-foreground block">
                  This automation triggers when:
                </span>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={settings.autoFillFields.triggerTask}
                      onCheckedChange={() => handleToggleTrigger("triggerTask")}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary data-[state=checked]:bg-primary cursor-pointer"
                    />
                    <span className="text-[13px] text-muted-foreground font-normal">
                      A new task is created
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={settings.autoFillFields.triggerSubtask}
                      onCheckedChange={() => handleToggleTrigger("triggerSubtask")}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary data-[state=checked]:bg-primary cursor-pointer"
                    />
                    <span className="text-[13px] text-muted-foreground font-normal">
                      A new sub task is created
                    </span>
                  </label>
                </div>
              </div>

              <div className="border-t border-border my-2" />

              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground font-medium">
                  Select fields to auto-fill:
                </span>
                <div className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === "fields" ? null : "fields")}
                    className="px-2.5 py-1.5 bg-background border border-input rounded-lg text-[12px] text-foreground flex items-center gap-2 shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors min-w-[130px] justify-between cursor-pointer font-medium"
                  >
                    <span>
                      {Object.values(settings.autoFillFields.fields).filter((f) => f.enabled).length === 0
                        ? "Select fields"
                        : `${Object.values(settings.autoFillFields.fields).filter((f) => f.enabled).length} selected`}
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                  </button>

                  {activeDropdown === "fields" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 mt-1.5 w-56 bg-popover border border-border rounded-xl shadow-lg z-50 p-2.5 text-popover-foreground"
                    >
                      <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-muted/35">
                        {availableFields.map((field) => {
                          const fieldSetting = settings.autoFillFields.fields[field.id] || { enabled: false, value: "Select" };
                          return (
                            <div key={field.id} className="space-y-1">
                              <div className="flex items-center justify-between py-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={fieldSetting.enabled}
                                    onCheckedChange={() => handleToggleFieldEnabled(field.id)}
                                    className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary data-[state=checked]:bg-primary cursor-pointer"
                                  />
                                  <span className="text-[11px] font-semibold text-foreground">
                                    {field.label}
                                  </span>
                                </label>

                                <button
                                  onClick={() => setActiveSubDropdown(activeSubDropdown === field.id ? null : field.id)}
                                  className="px-1.5 py-0.5 bg-secondary border border-border rounded text-[10px] text-foreground flex items-center justify-between gap-0.5 min-w-[70px] max-w-[90px] cursor-pointer"
                                  disabled={!fieldSetting.enabled}
                                >
                                  <span className="truncate max-w-[45px]">
                                    {getFieldLabel(field.id, fieldSetting.value)}
                                  </span>
                                  <ChevronDown className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                                </button>
                              </div>

                              {activeSubDropdown === field.id && fieldSetting.enabled && (
                                <div className="ml-5 p-1 bg-secondary border border-border rounded-lg space-y-0.5 mt-1 max-h-28 overflow-y-auto">
                                  {getFieldOptions(field.id).map((opt, index) => (
                                    <button
                                      key={`${opt.value}-${index}`}
                                      onClick={() => handleSelectFieldValue(field.id, opt.value)}
                                      className="w-full text-left px-1.5 py-0.5 hover:bg-accent hover:text-accent-foreground rounded text-[10px] font-semibold text-foreground flex items-center justify-between cursor-pointer"
                                    >
                                      <span>{opt.label}</span>
                                      {fieldSetting.value === opt.value && (
                                        <Check className="w-3 h-3 text-primary dark:text-foreground shrink-0" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Auto Close Inactive */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1 pr-6">
              <h3 className="text-[15px] font-semibold text-foreground">
                Auto-close tasks that are inactive
              </h3>
              <p className="text-[13px] text-muted-foreground font-normal leading-relaxed">
                Automatically close tasks or work items that remain inactive for a specified period of time.
              </p>
            </div>
            <Switch
              checked={settings.autoCloseInactive.enabled}
              onCheckedChange={() => toggleAutomation("autoCloseInactive")}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div
            className={`mt-4 p-4 bg-secondary rounded-lg flex items-center justify-between border border-border transition-all ${!settings.autoCloseInactive.enabled ? "opacity-70 pointer-events-none" : ""
              }`}
          >
            <span className="text-[13px] text-muted-foreground font-medium">
              Auto-close tasks that are inactive for
            </span>
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === "duration" ? null : "duration")}
                className="px-3.5 py-2 bg-background border border-input rounded-lg text-[13px] text-foreground flex items-center gap-2.5 shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors min-w-[130px] justify-between cursor-pointer font-medium"
              >
                <span>{settings.autoCloseInactive.duration}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>

              {activeDropdown === "duration" && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-1.5 w-44 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden py-1 space-y-0.5 text-popover-foreground"
                >
                  {durationOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSelectDuration(option)}
                      className="w-full text-left px-3.5 py-2 hover:bg-accent hover:text-accent-foreground flex items-center justify-between text-[13px] transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-foreground">
                        {option}
                      </span>
                      {settings.autoCloseInactive.duration === option && !showCustomRangeInput && (
                        <Check className="w-4 h-4 text-primary dark:text-foreground shrink-0" />
                      )}
                    </button>
                  ))}

                  <div className="border-t border-border my-1" />

                  <div>
                    <button
                      onClick={handleCustomRangeToggle}
                      className="w-full text-left px-3.5 py-2 hover:bg-accent hover:text-accent-foreground flex items-center justify-between text-[13px] transition-colors cursor-pointer font-semibold text-foreground"
                    >
                      <span>Custom range</span>
                      {showCustomRangeInput ? (
                        <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>

                    {showCustomRangeInput && (
                      <div className="px-3.5 pb-2 pt-1.5 space-y-1">
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min="1"
                            value={settings.autoCloseInactive.customValue}
                            onChange={(e) => handleCustomMonthsChange(e.target.value)}
                            className="w-full h-8 pl-2.5 pr-14 border border-input rounded-lg text-[12px] bg-secondary focus:outline-none focus:border-primary text-foreground"
                            placeholder="Number"
                          />
                          <span className="absolute right-2.5 text-[11px] text-muted-foreground font-semibold pointer-events-none">
                            months
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Set Due Date Today when status is Done */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1 pr-6">
              <h3 className="text-[15px] font-semibold text-foreground">
                Set Due date is today, when status is Done for task/sub task
              </h3>
              <p className="text-[13px] text-muted-foreground font-normal leading-relaxed">
                Automatically updates the due date to today when a task status is marked as Done.
              </p>
            </div>
            <Switch
              checked={settings.setDueDateToday.enabled}
              onCheckedChange={() => toggleAutomation("setDueDateToday")}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        {/* Card 5: Mark parent task as done when all subtasks are done */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1 pr-6">
              <h3 className="text-[15px] font-semibold text-foreground">
                Mark parent task as done when all subtasks are done
              </h3>
              <p className="text-[13px] text-muted-foreground font-normal leading-relaxed">
                When a subtask is completed, check whether every other subtask under the same parent is also done. If so, automatically mark the parent task as done.
              </p>
            </div>
            <Switch
              checked={settings.markParentDone?.enabled || false}
              onCheckedChange={() => toggleAutomation("markParentDone")}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default Automation;
