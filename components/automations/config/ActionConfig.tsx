// // components/automation/config/ActionConfig.tsx
// import React from "react";
// import { type Node } from "@xyflow/react";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import VariablePicker from "../VariablePicker";

// interface ActionNodeData {
//   actionId?: string;
//     actionType?: string
//   selectedField?: string;
//   [key: string]: unknown;
// }

// interface ActionConfigProps {
//   activeNode: Node;
//   configValue: string | undefined;
//   setConfigValue: (val: any) => void;
//   setNodes: any;
//   nodes: Node[];
//   getOptionsForField: (field: string) => { value: string; label: string }[];
// }

// const NO_CONFIG_ACTIONS = [
//   "UNASSIGN_TASK", "CLONE_TASK", "CLOSE_SUBTASKS",
//   "NOTIFY_WATCHERS", "NOTIFY_ASSIGNEE", "NOTIFY_REPORTER",
//   "ASSIGN_TO_PROJECT_LEAD", "ASSIGN_TO_REPORTER",
//   "START_TIMER", "STOP_TIMER", "IF_ELSE"
// ];

// export function ActionConfig({
//   activeNode, configValue, setConfigValue, setNodes, nodes, getOptionsForField
// }: ActionConfigProps) {
//   const data = activeNode.data as ActionNodeData;
// const actionId = (data.actionId ?? data.actionType ?? "") as string;
//   const triggerId = nodes.find(n => n.type === "trigger")?.data?.triggerId as string ?? "TASK_CREATED";

//   // No config needed
//   if (NO_CONFIG_ACTIONS.includes(actionId)) return (
//     <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-gray-500 font-medium">
//       ✅ No additional configuration needed for this action.
//     </div>
//   );

//   // CHANGE_STATUS
//   if (actionId === "CHANGE_STATUS") return (
//     <div className="space-y-2">
//       <label className="text-sm font-semibold text-gray-700 pl-1">Change status to</label>
//       <Select value={configValue ?? ""} onValueChange={setConfigValue}>
//         <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
//           <SelectValue placeholder="Select status..." />
//         </SelectTrigger>
//         <SelectContent>
//           {getOptionsForField("status").map(opt => (
//             <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
//           ))}
//         </SelectContent>
//       </Select>
//     </div>
//   );

//   // SET_PRIORITY
//   if (actionId === "SET_PRIORITY") return (
//     <div className="space-y-2">
//       <label className="text-sm font-semibold text-gray-700 pl-1">Set priority to</label>
//       <Select value={configValue ?? ""} onValueChange={setConfigValue}>
//         <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
//           <SelectValue placeholder="Select priority..." />
//         </SelectTrigger>
//         <SelectContent>
//           {getOptionsForField("priority").map(opt => (
//             <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
//           ))}
//         </SelectContent>
//       </Select>
//     </div>
//   );

//   // UPDATE_FIELD
//   if (actionId === "UPDATE_FIELD") return (
//     <div className="space-y-5">
//       <div className="space-y-2">
//         <label className="text-sm font-semibold text-gray-700 pl-1">Select field</label>
//         <Select
//           value={data.selectedField ?? ""}
//           onValueChange={(val) => {
//             setNodes((nds: Node[]) => nds.map(n =>
//               n.id === activeNode?.id ? { ...n, data: { ...n.data, selectedField: val, value: "" } } : n
//             ));
//             setConfigValue("");
//           }}
//         >
//           <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
//             <SelectValue placeholder="Select field..." />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="status">Status</SelectItem>
//             <SelectItem value="priority">Priority</SelectItem>
//             <SelectItem value="assignee">Assignee</SelectItem>
//             <SelectItem value="dueDate">Due Date</SelectItem>
//             <SelectItem value="startDate">Start Date</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>
//       {data.selectedField && (
//         <div className="space-y-2">
//           <div className="flex items-center justify-between px-1">
//             <label className="text-sm font-semibold text-gray-700">Update to value</label>
//             <VariablePicker triggerId={triggerId} onSelect={(v) => setConfigValue((prev: string) => (prev ?? "") + v)} />
//           </div>
//           {["status", "priority"].includes(data.selectedField) ? (
//             <Select value={configValue ?? ""} onValueChange={setConfigValue}>
//               <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
//                 <SelectValue placeholder={`Select ${data.selectedField}...`} />
//               </SelectTrigger>
//               <SelectContent>
//                 {getOptionsForField(data.selectedField).map(opt => (
//                   <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           ) : (
//             <Input
//               className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
//               placeholder="Enter value..."
//               value={configValue ?? ""}
//               onChange={(e) => setConfigValue(e.target.value)}
//             />
//           )}
//         </div>
//       )}
//     </div>
//   );

//   // ASSIGN_TASK
//   if (actionId === "ASSIGN_TASK") return (
//     <div className="space-y-2">
//       <label className="text-sm font-semibold text-gray-700 pl-1">Assign to</label>
//       <Input
//         className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
//         placeholder="Enter assignee name or email..."
//         value={configValue ?? ""}
//         onChange={(e) => setConfigValue(e.target.value)}
//       />
//     </div>
//   );

//   // ASSIGN_BY_COMPONENT
//   if (actionId === "ASSIGN_BY_COMPONENT") return (
//     <div className="space-y-2">
//       <label className="text-sm font-semibold text-gray-700 pl-1">Component name</label>
//       <Input
//         className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
//         placeholder="Enter component name..."
//         value={configValue ?? ""}
//         onChange={(e) => setConfigValue(e.target.value)}
//       />
//     </div>
//   );

//   // SET_DUE_DATE / SET_START_DATE
//   if (actionId === "SET_DUE_DATE" || actionId === "SET_START_DATE") return (
//     <div className="space-y-2">
//       <label className="text-sm font-semibold text-gray-700 pl-1">
//         {actionId === "SET_DUE_DATE" ? "Set due date to" : "Set start date to"}
//       </label>
//       <Input
//         type="date"
//         className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
//         value={configValue ?? ""}
//         onChange={(e) => setConfigValue(e.target.value)}
//       />
//     </div>
//   );

//   // CREATE_TASK / CREATE_SUBTASK
//   if (actionId === "CREATE_TASK" || actionId === "CREATE_SUBTASK") return (
//     <div className="space-y-5">
//       <div className="space-y-2">
//         <div className="flex items-center justify-between px-1">
//           <label className="text-sm font-semibold text-gray-700">
//             {actionId === "CREATE_TASK" ? "Task name" : "Subtask name"}
//           </label>
//           <VariablePicker triggerId={triggerId} onSelect={(v) => setConfigValue((prev: string) => (prev ?? "") + v)} />
//         </div>
//         <Input
//           className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600"
//           placeholder="e.g. Follow up on {Item Name}"
//           value={configValue ?? ""}
//           onChange={(e) => setConfigValue(e.target.value)}
//         />
//       </div>
//     </div>
//   );

//   // LINK_TASK / UNLINK_TASK / MARK_DUPLICATE / BLOCK_TASK
//   if (["LINK_TASK", "UNLINK_TASK", "MARK_DUPLICATE", "BLOCK_TASK"].includes(actionId)) {
//     const labelMap: Record<string, string> = {
//       LINK_TASK: "Link to task ID",
//       UNLINK_TASK: "Unlink task ID",
//       MARK_DUPLICATE: "Duplicate of task ID",
//       BLOCK_TASK: "Blocked by task ID",
//     };
//     return (
//       <div className="space-y-2">
//         <label className="text-sm font-semibold text-gray-700 pl-1">{labelMap[actionId]}</label>
//         <Input
//           className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
//           placeholder="Enter task ID..."
//           value={configValue ?? ""}
//           onChange={(e) => setConfigValue(e.target.value)}
//         />
//       </div>
//     );
//   }

//   // SEND_EMAIL
//   if (actionId === "SEND_EMAIL") return (
//     <div className="space-y-5">
//       <div className="space-y-2">
//         <label className="text-sm font-semibold text-gray-700 pl-1">To</label>
//         <Input className="h-11 rounded-xl border-gray-200 bg-white text-sm" placeholder="email@example.com" value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
//       </div>
//       <div className="space-y-2">
//         <label className="text-sm font-semibold text-gray-700 pl-1">Subject</label>
//         <Input className="h-11 rounded-xl border-gray-200 bg-white text-sm" placeholder="Email subject..." value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
//       </div>
//       <div className="space-y-2">
//         <div className="flex items-center justify-between px-1">
//           <label className="text-sm font-semibold text-gray-700">Message</label>
//           <VariablePicker triggerId={triggerId} onSelect={(v) => setConfigValue((prev: string) => (prev ?? "") + v)} />
//         </div>
//         <textarea className="w-full min-h-[100px] p-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 resize-none shadow-sm" placeholder="Email body..." value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
//       </div>
//     </div>
//   );

//   // SEND_SLACK_MESSAGE / SEND_TEAMS_MESSAGE
//   if (actionId === "SEND_SLACK_MESSAGE" || actionId === "SEND_TEAMS_MESSAGE") return (
//     <div className="space-y-5">
//       <div className="space-y-2">
//         <label className="text-sm font-semibold text-gray-700 pl-1">
//           {actionId === "SEND_SLACK_MESSAGE" ? "Slack channel" : "Teams channel"}
//         </label>
//         <Input className="h-11 rounded-xl border-gray-200 bg-white text-sm" placeholder={actionId === "SEND_SLACK_MESSAGE" ? "#general" : "General"} value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
//       </div>
//       <div className="space-y-2">
//         <div className="flex items-center justify-between px-1">
//           <label className="text-sm font-semibold text-gray-700">Message</label>
//           <VariablePicker triggerId={triggerId} onSelect={(v) => setConfigValue((prev: string) => (prev ?? "") + v)} />
//         </div>
//         <textarea className="w-full min-h-[100px] p-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 resize-none shadow-sm" placeholder="Message..." value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
//       </div>
//     </div>
//   );

//   // CALL_WEBHOOK / CALL_API
//   if (actionId === "CALL_WEBHOOK" || actionId === "CALL_API") return (
//     <div className="space-y-5">
//       <div className="space-y-2">
//         <label className="text-sm font-semibold text-gray-700 pl-1">URL</label>
//         <Input className="h-11 rounded-xl border-gray-200 bg-white text-sm" placeholder="https://..." value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
//       </div>
//       <div className="space-y-2">
//         <label className="text-sm font-semibold text-gray-700 pl-1">Method</label>
//         <Select value="POST" onValueChange={() => {}}>
//           <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="GET">GET</SelectItem>
//             <SelectItem value="POST">POST</SelectItem>
//             <SelectItem value="PUT">PUT</SelectItem>
//             <SelectItem value="PATCH">PATCH</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>
//     </div>
//   );

//   // ADD_WORKLOG
//   if (actionId === "ADD_WORKLOG") return (
//     <div className="space-y-5">
//       <div className="space-y-2">
//         <label className="text-sm font-semibold text-gray-700 pl-1">Time spent</label>
//         <Input className="h-11 rounded-xl border-gray-200 bg-white text-sm" placeholder="e.g. 2h 30m" value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
//       </div>
//       <div className="space-y-2">
//         <label className="text-sm font-semibold text-gray-700 pl-1">Description</label>
//         <Input className="h-11 rounded-xl border-gray-200 bg-white text-sm" placeholder="Work description..." value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
//       </div>
//     </div>
//   );

//   // UPDATE_TIME_ESTIMATE
//   if (actionId === "UPDATE_TIME_ESTIMATE") return (
//     <div className="space-y-2">
//       <label className="text-sm font-semibold text-gray-700 pl-1">Time estimate</label>
//       <Input className="h-11 rounded-xl border-gray-200 bg-white text-sm" placeholder="e.g. 4h" value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
//     </div>
//   );

//   // ATTACH_FILE / REMOVE_ATTACHMENT
//   if (actionId === "ATTACH_FILE" || actionId === "REMOVE_ATTACHMENT") return (
//     <div className="space-y-2">
//       <label className="text-sm font-semibold text-gray-700 pl-1">
//         {actionId === "ATTACH_FILE" ? "File URL or name" : "Attachment name to remove"}
//       </label>
//       <Input className="h-11 rounded-xl border-gray-200 bg-white text-sm" placeholder={actionId === "ATTACH_FILE" ? "https://... or filename" : "Attachment name..."} value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
//     </div>
//   );

//   // TRIGGER_CI_BUILD / TRIGGER_DEPLOYMENT
//   if (actionId === "TRIGGER_CI_BUILD" || actionId === "TRIGGER_DEPLOYMENT") return (
//     <div className="space-y-2">
//       <label className="text-sm font-semibold text-gray-700 pl-1">
//         {actionId === "TRIGGER_CI_BUILD" ? "Branch name" : "Environment"}
//       </label>
//       <Input className="h-11 rounded-xl border-gray-200 bg-white text-sm" placeholder={actionId === "TRIGGER_CI_BUILD" ? "main" : "production"} value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
//     </div>
//   );

//   // CREATE_GITHUB_ISSUE
//   if (actionId === "CREATE_GITHUB_ISSUE") return (
//     <div className="space-y-5">
//       <div className="space-y-2">
//         <div className="flex items-center justify-between px-1">
//           <label className="text-sm font-semibold text-gray-700">Issue title</label>
//           <VariablePicker triggerId={triggerId} onSelect={(v) => setConfigValue((prev: string) => (prev ?? "") + v)} />
//         </div>
//         <Input className="h-11 rounded-xl border-gray-200 bg-white text-sm" placeholder="e.g. Bug: {Item Name}" value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
//       </div>
//       <div className="space-y-2">
//         <label className="text-sm font-semibold text-gray-700 pl-1">Repository</label>
//         <Input className="h-11 rounded-xl border-gray-200 bg-white text-sm" placeholder="owner/repo" value={configValue ?? ""} onChange={(e) => setConfigValue(e.target.value)} />
//       </div>
//     </div>
//   );

//   // Default fallback
//   return (
//     <div className="space-y-2">
//       <div className="flex items-center justify-between px-1">
//         <label className="text-sm font-semibold text-gray-700">Value</label>
//         <VariablePicker triggerId={triggerId} onSelect={(v) => setConfigValue((prev: string) => (prev ?? "") + v)} />
//       </div>
//       <Input
//         className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
//         placeholder="Enter value..."
//         value={configValue ?? ""}
//         onChange={(e) => setConfigValue(e.target.value)}
//       />
//     </div>
//   );
// }