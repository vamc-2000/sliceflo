// components/reports/WidgetModal.tsx
"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import ProductivityWidgets from "./Widgets/ProductivityWidgets";

interface WidgetModalProps {
    open: boolean;
    onClose: () => void;
    reportId: string;
    onSelectWidget: (type: string) => void;
}

export default function WidgetModal({
    open,
    onClose,
    reportId,
    onSelectWidget,
}: WidgetModalProps) {
    const [activeTab, setActiveTab] = useState("productivity");
    const [linePreviewOpen, setLinePreviewOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="w-full max-w-5xl! p-0 overflow-hidden bg-background text-foreground border-border">
                <DialogHeader className="px-6 pt-6 mb-1">  {/* Add mb-0 */}
                    <DialogTitle className="text-foreground">Create New Widget</DialogTitle>
                </DialogHeader>

                <div className="flex h-125">
                    {/* LEFT SIDE MENU */}
                    <div className="w-64 border-r border-border bg-muted/40 p-4 space-y-2">
                        {[
                            { id: "productivity", label: "Productivity" },
                            { id: "analytics", label: "Analytics" },
                            { id: "finance", label: "Finance" },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                                    ${activeTab === item.id
                                        ? "bg-background text-foreground shadow border border-border font-medium"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* RIGHT SIDE CONTENT */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === "productivity" && (
                            <ProductivityWidgets
                                // onSelect={(type) => {
                                //     if (type === "line") {
                                //         setLinePreviewOpen(true);
                                //     }
                                // }}
                                onSelect={(type) => {
                                    onSelectWidget(type);    // "line", "bar", etc.
                                }}
                            />
                        )}

                        {activeTab === "analytics" && (
                            <div>
                                <h2 className="text-lg font-semibold mb-4 text-foreground">Analytics</h2>
                                <p className="text-muted-foreground">Your analytics content here.</p>
                            </div>
                        )}

                        {activeTab === "finance" && (
                            <div>
                                <h2 className="text-lg font-semibold mb-4 text-foreground">Finance</h2>
                                <p className="text-muted-foreground">Your finance content here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>

        </Dialog>
    );
}

/* ---------- Reusable Widget Card ---------- */

function WidgetCard({ title }: { title: string }) {
    return (
        <button className="border border-border rounded-xl p-4 text-left hover:shadow-md hover:border-[#001F3F] dark:hover:border-brand transition-all duration-200 bg-card">
            <div className="font-medium text-[#001F3F] dark:text-foreground">{title}</div>
            <p className="text-sm text-muted-foreground mt-1">
                Click to add this widget
            </p>
        </button>
    );
}
