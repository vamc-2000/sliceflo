// components/automation/config/TriggerConfig.tsx
import React from "react";
import { type Node } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NO_CONFIG_TRIGGERS = [
  "TASK_CREATED", "TASK_DELETED", "TASK_RESTORED", "TASK_MOVED_PROJECT",
  "TASK_CLONED", "STATUS_CHANGED", "TASK_RESOLVED", "TASK_REOPENED",
  "ASSIGNEE_CHANGED", "TASK_UNASSIGNED", "REPORTER_CHANGED",
  "PRIORITY_CHANGED", "START_DATE_CHANGED", "DUE_DATE_CHANGED",
  "ATTACHMENT_ADDED", "ATTACHMENT_REMOVED", "SUBTASK_CREATED",
  "SUBTASK_COMPLETED", "DEPENDENCY_RESOLVED", "TASK_BLOCKED",
  "PARENT_TASK_UPDATED", "WATCHER_ADDED", "WATCHER_REMOVED"
];

interface TriggerConfigProps {
  activeNode: Node;
  configValue: string | undefined;
  setConfigValue: (val: string) => void;
  setNodes: any;
  allTaskFields: { value: string; label: string }[];
  project: any;
}

export function TriggerConfig({
  activeNode, configValue, setConfigValue, setNodes, allTaskFields, project
}: TriggerConfigProps) {
  const triggerId = activeNode?.data?.triggerId as string;

  if (NO_CONFIG_TRIGGERS.includes(triggerId)) return null;

  const statusOptions = project?.taskStatusConfig ?? [];
  const priorityOptions = project?.taskPriorityConfig ?? [];

  // TASK_UPDATED
  if (triggerId === "TASK_UPDATED") return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 pl-1">When this field changes</label>
      <Select value={configValue ?? ""} onValueChange={setConfigValue}>
        <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
          <SelectValue placeholder="Select field..." />
        </SelectTrigger>
        <SelectContent>
          {allTaskFields.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  // STATUS_CHANGED_TO
  if (triggerId === "STATUS_CHANGED_TO") return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 pl-1">When status changes to</label>
      <Select value={configValue ?? ""} onValueChange={setConfigValue}>
        <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
          <SelectValue placeholder="Select status..." />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((s: any) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  // STATUS_CHANGED_FROM
  if (triggerId === "STATUS_CHANGED_FROM") return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 pl-1">When status changes from</label>
      <Select value={configValue ?? ""} onValueChange={setConfigValue}>
        <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
          <SelectValue placeholder="Select status..." />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((s: any) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  // PRIORITY_ESCALATED
  if (triggerId === "PRIORITY_ESCALATED") return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 pl-1">Escalated to priority</label>
      <Select value={configValue ?? ""} onValueChange={setConfigValue}>
        <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
          <SelectValue placeholder="Select priority..." />
        </SelectTrigger>
        <SelectContent>
          {priorityOptions.map((p: any) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  // TASK_ASSIGNED
  if (triggerId === "TASK_ASSIGNED") return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 pl-1">Assigned to</label>
      <Input
        className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
        placeholder="Enter assignee name..."
        value={configValue ?? ""}
        onChange={(e) => setConfigValue(e.target.value)}
      />
    </div>
  );

  // LABEL / TAG / COMPONENT
  if (["LABEL_ADDED", "LABEL_REMOVED", "TAG_ADDED", "TAG_REMOVED", "COMPONENT_ADDED", "COMPONENT_REMOVED"].includes(triggerId)) {
    const labelMap: Record<string, string> = {
      LABEL_ADDED: "Label added", LABEL_REMOVED: "Label removed",
      TAG_ADDED: "Tag added", TAG_REMOVED: "Tag removed",
      COMPONENT_ADDED: "Component added", COMPONENT_REMOVED: "Component removed",
    };
    return (
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 pl-1">{labelMap[triggerId]}</label>
        <Input
          className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
          placeholder={`Enter ${labelMap[triggerId].toLowerCase()}...`}
          value={configValue ?? ""}
          onChange={(e) => setConfigValue(e.target.value)}
        />
      </div>
    );
  }

  // CUSTOM_FIELD_UPDATED
  if (triggerId === "CUSTOM_FIELD_UPDATED") return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 pl-1">Which custom field</label>
        <Select
          value={activeNode?.data?.selectedField as string ?? ""}
          onValueChange={(val) => {
            setNodes((nds: Node[]) => nds.map(n =>
              n.id === activeNode?.id ? { ...n, data: { ...n.data, selectedField: val, value: "" } } : n
            ));
            setConfigValue("");
          }}
        >
          <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
            <SelectValue placeholder="Select custom field..." />
          </SelectTrigger>
          <SelectContent>
            {allTaskFields.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 pl-1">Updated to value</label>
        <Input className="h-11 rounded-xl border-gray-200 bg-white text-sm" placeholder="Enter value..." value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
      </div>
    </div>
  );

  // CUSTOM_FIELD_EMPTY
  if (triggerId === "CUSTOM_FIELD_EMPTY") return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 pl-1">Which custom field is empty</label>
      <Select
        value={activeNode?.data?.selectedField as string ?? ""}
        onValueChange={(val) => setNodes((nds: Node[]) => nds.map(n =>
          n.id === activeNode?.id ? { ...n, data: { ...n.data, selectedField: val } } : n
        ))}
      >
        <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
          <SelectValue placeholder="Select custom field..." />
        </SelectTrigger>
        <SelectContent>
          {allTaskFields.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  // CUSTOM_FIELD_VALUE_CHANGED
  if (triggerId === "CUSTOM_FIELD_VALUE_CHANGED") return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 pl-1">Which custom field</label>
        <Select
          value={activeNode?.data?.selectedField as string ?? ""}
          onValueChange={(val) => setNodes((nds: Node[]) => nds.map(n =>
            n.id === activeNode?.id ? { ...n, data: { ...n.data, selectedField: val } } : n
          ))}
        >
          <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
            <SelectValue placeholder="Select custom field..." />
          </SelectTrigger>
          <SelectContent>
            {allTaskFields.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 pl-1">From value</label>
        <Input className="h-11 rounded-xl border-gray-200 bg-white text-sm" placeholder="Any value..." value={activeNode?.data?.fromValue as string ?? ""}
          onChange={(e) => setNodes((nds: Node[]) => nds.map(n =>
            n.id === activeNode?.id ? { ...n, data: { ...n.data, fromValue: e.target.value } } : n
          ))}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 pl-1">To value</label>
        <Input className="h-11 rounded-xl border-gray-200 bg-white text-sm" placeholder="Enter new value..." value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
      </div>
    </div>
  );

  return null;
}