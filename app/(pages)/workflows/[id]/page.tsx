// "use client";

// import React, { useCallback, useEffect, useState } from "react";
// import { useParams, useRouter, useSearchParams } from "next/navigation";
// import { useAutomationStore } from "@/stores/automation-store";
// import WorkflowBuilder from "@/components/automations/WorkflowBuilder";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Loader2 } from "lucide-react";

// const WorkflowDetailPage = () => {
//     const params = useParams();
//     const router = useRouter();
//     const searchParams = useSearchParams();

//     const automationId = params.id as string;
//     // projectId comes from query string: /workflows/[id]?projectId=xxx
//     const projectId = searchParams.get("projectId") || "";

//     const { automations, fetchAutomations, fetchMetadata, updateWorkflow, getWorkflow, isLoading } =
//         useAutomationStore();

//     const [hydrated, setHydrated] = useState(false);

//     // ── Load metadata + fetch automations for the project ──
//     useEffect(() => {
//         fetchMetadata();
//         if (projectId) {
//             fetchAutomations(projectId).then(() => setHydrated(true));
//         } else {
//             setHydrated(true);
//         }
//     }, [projectId, fetchAutomations, fetchMetadata]);

//     const automation = automations.find((a) => a.id === automationId);
//     const workflowData = getWorkflow(automationId);

//     // ── Auto-save ReactFlow nodes/edges to store ──────────
//     const handleWorkflowChange = useCallback((nodes: any[], edges: any[]) => {
//         updateWorkflow(automationId, { nodes, edges });
//     }, [automationId, updateWorkflow]);

//     // ── Loading state ──────────────────────────────────────
//  if (!hydrated) {
//     return (
//         <div className="flex items-center justify-center h-screen bg-white">
//             <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
//         </div>
//     );
// }

//     // // ── Not found (after hydration) ────────────────────────
//     // if (!automation && !projectId) {
//     //     return (
//     //         <div className="flex items-center justify-center h-screen bg-white">
//     //             <div className="text-center">
//     //                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow not found</h2>
//     //                 <p className="text-gray-500 mb-6">The workflow you&apos;re looking for doesn&apos;t exist.</p>
//     //                 <Button
//     //                     onClick={() => router.push("/workflows")}
//     //                     className="bg-[#001F3F] text-white hover:bg-[#002F5F]"
//     //                 >
//     //                     <ArrowLeft className="w-4 h-4 mr-2" />
//     //                     Back to Workflows
//     //                 </Button>
//     //             </div>
//     //         </div>
//     //     );
//     // }
//     // ✅ FIXED — only show not found for real IDs (not new workflows)
// const isNew = automationId?.startsWith("workflow-");

// if (!isNew && !automation) {
//     return (
//         <div className="flex items-center justify-center h-screen bg-white">
//             <div className="text-center">
//                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow not found</h2>
//                 <p className="text-gray-500 mb-6">This workflow doesn&apos;t exist or was deleted.</p>
//                 <Button
//                     onClick={() => router.back()}
//                     className="bg-[#001F3F] text-white hover:bg-[#002F5F]"
//                 >
//                     <ArrowLeft className="w-4 h-4 mr-2" />
//                     Go Back
//                 </Button>
//             </div>
//         </div>
//     );
// }


//     return (
//         <div className="flex flex-col h-screen bg-white">
//             {/* WorkflowBuilder handles its own header + Save & Publish button */}
//             <div className="flex-1 overflow-hidden min-h-0">
//                 <WorkflowBuilder
//                     automationId={automationId}
//                     projectId={projectId}
//                     initialNodes={workflowData?.nodes}
//                     initialEdges={workflowData?.edges}
//                     onWorkflowChange={handleWorkflowChange}
//                 />
//             </div>
//         </div>
//     );
// };

// export default WorkflowDetailPage;

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAutomationStore } from "@/stores/automation-store";
import WorkflowBuilder from "@/components/automations/WorkflowBuilder";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { buildNodesFromAutomation } from "@/lib/buildNodesFromAutomation";

const WorkflowDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const automationId = params.id as string;
    const projectId = searchParams.get("projectId") || "";
    const isNew = automationId?.startsWith("workflow-");

    const { automations, fetchAutomations, fetchMetadata, updateWorkflow, getWorkflow } =
        useAutomationStore();

    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        fetchMetadata();
        if (projectId) {
            fetchAutomations(projectId).then(() => setHydrated(true));
        } else {
            setHydrated(true);
        }
    }, [projectId]);

    const automation = automations.find((a) => a.id === automationId);
    const workflowData = getWorkflow(automationId);
    const restoredWorkflow = React.useMemo(() => {
        if (workflowData?.nodes?.length) {
            return workflowData; // use locally saved version
        }
        if (automation?.trigger) {
            // rebuild from API actions
            return buildNodesFromAutomation(
                automation.trigger,
                automation.actions ?? []
            );
        }
        return null;
    }, [automation, workflowData]);

    const handleWorkflowChange = useCallback((nodes: any[], edges: any[]) => {
        updateWorkflow(automationId, { nodes, edges });
    }, [automationId, updateWorkflow]);

    // ── 1. Loading ─────────────────────────────────────────
    if (!hydrated) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    // ── 2. Not found (only for existing automations) ───────
    if (!isNew && !automation) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow not found</h2>
                    <p className="text-gray-500 mb-6">This workflow doesn&apos;t exist or was deleted.</p>
                    <Button
                        onClick={() => router.back()}
                        className="bg-[#001F3F] text-white hover:bg-[#002F5F]"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    // ── 3. Builder ─────────────────────────────────────────
    return (
        <div className="flex flex-col h-screen bg-white">
            <div className="flex-1 overflow-hidden min-h-0">
                {/* <WorkflowBuilder
                    automationId={automationId}
                    projectId={projectId}
                    initialNodes={workflowData?.nodes}
                    initialEdges={workflowData?.edges}
                    onWorkflowChange={handleWorkflowChange}
                /> */}
                <WorkflowBuilder
                    automationId={automationId}
                    projectId={projectId}
                    initialNodes={restoredWorkflow?.nodes}
                    initialEdges={restoredWorkflow?.edges}
                    onWorkflowChange={handleWorkflowChange}
                />
            </div>
        </div>
    );
};

export default WorkflowDetailPage;
