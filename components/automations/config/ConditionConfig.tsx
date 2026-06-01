// // components/automation/config/ConditionConfig.tsx
// import React from "react";
// import { type Node } from "@xyflow/react";
// import { Input } from "@/components/ui/input";
// import {
//   Select, SelectContent, SelectItem,
//   SelectTrigger, SelectValue
// } from "@/components/ui/select";
// import { useAutomationStore } from "@/stores/automation-store";
// import VariablePicker from "../VariablePicker";

// interface ConditionNodeData {
//   conditionCategory?: "field" | "special";
//   specialConditionType?: string;
//   conditionField?: string;
//   conditionOperator?: string;
//   conditionValue?: string;
//   conditionFromValue?: string;
//   conditionToValue?: string;
//   needsValue?: boolean;
//   needsFromTo?: boolean;
//   needsField?: boolean;
//   [key: string]: unknown;
// }

// interface ConditionConfigProps {
//   activeNode: Node;
//   configValue: string | undefined;
//   setConfigValue: (val: string) => void;
//   setNodes: any;
//   nodes: Node[];
//   allTaskFields: { value: string; label: string }[];
//   project: any;
// }

// const DATE_OPERATORS = ["before", "after", "date_equals"];
// const NUMBER_OPERATORS = ["greater_than", "less_than", "age_greater_than", "age_less_than"];
// const USER_OPERATORS = ["assignee_equals", "reporter_equals"];
// const NO_VALUE_OPERATORS = ["empty", "not_empty", "user_is_watcher"];
// const NO_VALUE_SPECIAL = ["ALL_SUBTASKS_DONE", "TASK_BLOCKED", "TASK_HAS_DEPENDENCY"];
// const STATUS_SPECIAL = ["PARENT_STATUS_EQUALS", "SUBTASK_STATUS_EQUALS"];

// export function ConditionConfig({
//   activeNode, configValue, setConfigValue,
//   setNodes, nodes, allTaskFields, project
// }: ConditionConfigProps) {
//   const conditionOperators = useAutomationStore(s => s.conditionOperators);
//   const triggerId = nodes.find(n => n.type === "trigger")?.data?.triggerId as string || "TASK_CREATED";
//   const data = activeNode.data as ConditionNodeData;

//   const updateNode = (patch: Record<string, unknown>) => {
//     setNodes((nds: Node[]) => nds.map(n =>
//       n.id === activeNode.id ? { ...n, data: { ...n.data, ...patch } } : n
//     ));
//   };

//   const operator = data.conditionOperator ?? "";
//   const category = data.conditionCategory ?? "field";
//   const specialType = data.specialConditionType ?? "";

//   const isDateOp = DATE_OPERATORS.includes(operator);
//   const isNumberOp = NUMBER_OPERATORS.includes(operator);
//   const isUserOp = USER_OPERATORS.includes(operator);
//   const isNoValueOp = NO_VALUE_OPERATORS.includes(operator);
//   const isFromTo = operator === "changed_from_to";

//   return (
//     <div className="space-y-5">

//       {/* ── STEP 1: Condition Category ── */}
//       <div className="space-y-2">
//         <label className="text-sm font-semibold text-gray-700 pl-1">Condition Type</label>
//         <Select
//           value={category}
//           onValueChange={(val) => updateNode({
//             conditionCategory: val,
//             conditionField: "",
//             conditionOperator: "",
//             conditionValue: "",
//             conditionFromValue: "",
//             conditionToValue: "",
//             specialConditionType: "",
//             needsValue: false,
//             needsFromTo: false,
//           })}
//         >
//           <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
//             <SelectValue placeholder="Select condition type..." />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="field">Field Condition</SelectItem>
//             <SelectItem value="special">Special Condition</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {/* ════════════════════════════════
//           FIELD CONDITION
//       ════════════════════════════════ */}
//       {category === "field" && (
//         <>
//           {/* Field Select */}
//           <div className="space-y-2">
//             <label className="text-sm font-semibold text-gray-700 pl-1">Field</label>
//             <Select
//               value={data.conditionField ?? ""}
//               onValueChange={(val) => {
//                 updateNode({
//                   conditionField: val,
//                   conditionOperator: "",
//                   conditionValue: "",
//                   conditionFromValue: "",
//                   conditionToValue: "",
//                 });
//                 setConfigValue("");
//               }}
//             >
//               <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
//                 <SelectValue placeholder="Select field..." />
//               </SelectTrigger>
//               <SelectContent>
//                 {allTaskFields.map(f => (
//                   <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Operator Select */}
//           {data.conditionField && (
//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-gray-700 pl-1">Condition</label>
//               <Select
//                 value={operator}
//                 onValueChange={(val) => {
//                   const op = (conditionOperators as any[]).find(o => o.id === val);
//                   updateNode({
//                     conditionOperator: val,
//                     needsValue: op?.needsValue,
//                     needsFromTo: op?.needsFromTo,
//                     needsField: op?.needsField,
//                     conditionValue: "",
//                     conditionFromValue: "",
//                     conditionToValue: "",
//                   });
//                   setConfigValue("");
//                 }}
//               >
//                 <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
//                   <SelectValue placeholder="Select condition..." />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {(conditionOperators as any[]).map(op => (
//                     <SelectItem key={op.id} value={op.id}>{op.label}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           )}

//           {/* ── CHANGED FROM / TO ── */}
//           {operator && isFromTo && (
//             <>
//               <div className="space-y-2">
//                 <label className="text-sm font-semibold text-gray-700 pl-1">From value</label>
//                 <Input
//                   className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
//                   placeholder="Any value..."
//                   value={data.conditionFromValue ?? ""}
//                   onChange={(e) => updateNode({ conditionFromValue: e.target.value })}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <label className="text-sm font-semibold text-gray-700 pl-1">To value</label>
//                 <Input
//                   className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
//                   placeholder="Enter new value..."
//                   value={data.conditionToValue ?? ""}
//                   onChange={(e) => updateNode({ conditionToValue: e.target.value })}
//                 />
//               </div>
//             </>
//           )}

//           {/* ── NO VALUE ── */}
//           {operator && isNoValueOp && (
//             <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-gray-500 font-medium">
//               ✅ No value needed for this condition.
//             </div>
//           )}

//           {/* ── DATE INPUT ── */}
//           {operator && data.needsValue && isDateOp && (
//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-gray-700 pl-1">Date</label>
//               <Input
//                 type="date"
//                 className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
//                 value={data.conditionValue ?? ""}
//                 onChange={(e) => updateNode({ conditionValue: e.target.value })}
//               />
//             </div>
//           )}

//           {/* ── NUMBER INPUT ── */}
//           {operator && data.needsValue && isNumberOp && (
//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-gray-700 pl-1">
//                 {operator.includes("age") ? "Days" : "Value"}
//               </label>
//               <Input
//                 type="number"
//                 className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
//                 placeholder="Enter number..."
//                 value={data.conditionValue ?? ""}
//                 onChange={(e) => updateNode({ conditionValue: e.target.value })}
//               />
//             </div>
//           )}

//           {/* ── USER INPUT ── */}
//           {operator && data.needsValue && isUserOp && (
//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-gray-700 pl-1">
//                 {operator === "assignee_equals" ? "Assignee" : "Reporter"}
//               </label>
//               <Input
//                 className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
//                 placeholder="Enter name or email..."
//                 value={data.conditionValue ?? ""}
//                 onChange={(e) => updateNode({ conditionValue: e.target.value })}
//               />
//             </div>
//           )}

//           {/* ── STATUS / PRIORITY DROPDOWN ── */}
//           {operator && data.needsValue && !isDateOp && !isNumberOp && !isUserOp && !isFromTo &&
//             ["status", "priority"].includes(data.conditionField ?? "") && (
//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-gray-700 pl-1">Value</label>
//               <Select
//                 value={data.conditionValue ?? ""}
//                 onValueChange={(val) => updateNode({ conditionValue: val })}
//               >
//                 <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
//                   <SelectValue placeholder={`Select ${data.conditionField}...`} />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {(data.conditionField === "status"
//                     ? project?.taskStatusConfig ?? []
//                     : project?.taskPriorityConfig ?? []
//                   ).map((opt: any) => (
//                     <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           )}

//           {/* ── GENERIC TEXT INPUT ── */}
//           {operator && data.needsValue && !isDateOp && !isNumberOp && !isUserOp && !isFromTo &&
//             !["status", "priority"].includes(data.conditionField ?? "") && (
//             <div className="space-y-2">
//               <div className="flex items-center justify-between px-1">
//                 <label className="text-sm font-semibold text-gray-700">Value</label>
//                 <VariablePicker
//                   triggerId={triggerId}
//                   onSelect={(v) => updateNode({ conditionValue: (data.conditionValue ?? "") + v })}
//                 />
//               </div>
//               <Input
//                 className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
//                 placeholder="Enter value..."
//                 value={data.conditionValue ?? ""}
//                 onChange={(e) => updateNode({ conditionValue: e.target.value })}
//               />
//             </div>
//           )}
//         </>
//       )}

//       {/* ════════════════════════════════
//           SPECIAL CONDITION
//       ════════════════════════════════ */}
//       {category === "special" && (
//         <>
//           {/* Special Condition Type Select */}
//           <div className="space-y-2">
//             <label className="text-sm font-semibold text-gray-700 pl-1">Special Condition</label>
//             <Select
//               value={specialType}
//               onValueChange={(val) => {
//                 updateNode({
//                   specialConditionType: val,
//                   conditionValue: "",
//                   conditionField: "",
//                   needsValue: !NO_VALUE_SPECIAL.includes(val),
//                 });
//                 setConfigValue("");
//               }}
//             >
//               <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
//                 <SelectValue placeholder="Select special condition..." />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="ALL_SUBTASKS_DONE">All subtasks done</SelectItem>
//                 <SelectItem value="TASK_BLOCKED">Task is blocked</SelectItem>
//                 <SelectItem value="TASK_HAS_DEPENDENCY">Task has dependency</SelectItem>
//                 <SelectItem value="PARENT_STATUS_EQUALS">Parent status equals</SelectItem>
//                 <SelectItem value="SUBTASK_STATUS_EQUALS">Subtask status equals</SelectItem>
//                 <SelectItem value="LABEL_EXISTS">Label exists</SelectItem>
//                 <SelectItem value="TAG_EXISTS">Tag exists</SelectItem>
//                 <SelectItem value="CUSTOM_FIELD_EQUALS">Custom field equals</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           {/* No value needed */}
//           {NO_VALUE_SPECIAL.includes(specialType) && (
//             <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-gray-500 font-medium">
//               ✅ No additional configuration needed.
//             </div>
//           )}

//           {/* PARENT_STATUS_EQUALS / SUBTASK_STATUS_EQUALS */}
//           {STATUS_SPECIAL.includes(specialType) && (
//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-gray-700 pl-1">Status equals</label>
//               <Select
//                 value={data.conditionValue ?? ""}
//                 onValueChange={(val) => updateNode({ conditionValue: val })}
//               >
//                 <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
//                   <SelectValue placeholder="Select status..." />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {(project?.taskStatusConfig ?? []).map((s: any) => (
//                     <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           )}

//           {/* LABEL_EXISTS / TAG_EXISTS */}
//           {["LABEL_EXISTS", "TAG_EXISTS"].includes(specialType) && (
//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-gray-700 pl-1">
//                 {specialType === "LABEL_EXISTS" ? "Label name" : "Tag name"}
//               </label>
//               <Input
//                 className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
//                 placeholder="Enter name..."
//                 value={data.conditionValue ?? ""}
//                 onChange={(e) => updateNode({ conditionValue: e.target.value })}
//               />
//             </div>
//           )}

//           {/* CUSTOM_FIELD_EQUALS */}
//           {specialType === "CUSTOM_FIELD_EQUALS" && (
//             <>
//               <div className="space-y-2">
//                 <label className="text-sm font-semibold text-gray-700 pl-1">Custom field</label>
//                 <Select
//                   value={data.conditionField ?? ""}
//                   onValueChange={(val) => updateNode({ conditionField: val, conditionValue: "" })}
//                 >
//                   <SelectTrigger className="w-full h-11 px-3 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm hover:border-gray-300">
//                     <SelectValue placeholder="Select custom field..." />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {allTaskFields.map(f => (
//                       <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-2">
//                 <label className="text-sm font-semibold text-gray-700 pl-1">Equals value</label>
//                 <Input
//                   className="h-11 rounded-xl border-gray-200 bg-white text-sm font-medium text-gray-600 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 shadow-sm hover:border-gray-300"
//                   placeholder="Enter value..."
//                   value={data.conditionValue ?? ""}
//                   onChange={(e) => updateNode({ conditionValue: e.target.value })}
//                 />
//               </div>
//             </>
//           )}
//         </>
//       )}
//     </div>
//   );
// }