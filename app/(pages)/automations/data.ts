export const categories = [
    { name: "Explore" },
    { name: "AI - powered" },
    { name: "Basic" },
    { name: "Featured" },
    { name: "Notifications" },
    { name: "Status change" },
    { name: "Recurring" },
    { name: "Due dates" },
    { name: "Sync" },
    { name: "Item creation" },
];

export const integrations = [
    { name: "Outlook", color: "#0078D4", icon: "/images/outlook-icon.png", isHighlighted: true },
    { name: "Slack", color: "#998d99ff", icon: "/images/outlook-icon.png", isHighlighted: true },
    { name: "Jira", color: "#d3c28a98", icon: "/images/outlook-icon.png", isHighlighted: true },
    { name: "Google", color: "#4285F4", icon: "/images/outlook-icon.png", isHighlighted: true },
    { name: "GitHub", color: "#22274767", icon: "/images/outlook-icon.png", isHighlighted: true },
    { name: "Gmail", color: "#EA4335", icon: "/images/outlook-icon.png", isHighlighted: true },
    { name: "Sheets", color: "#1D8B41", icon: "/images/outlook-icon.png", isHighlighted: true },
    { name: "More", color: "#F3F4F6", icon: "/images/outlook-icon.png", isHighlighted: true },
];

export const templateSets: Record<string, any[]> = {
    "Explore": [
        {
            id: "item-created-assign-creator",
            icon: "/images/Circlelogo.svg",
            color: "#F97316",
            text: ["When an ", "item", " is created assign creator as ", "person"]
        },
        {
            id: "ai-summarize-description",
            icon: "AI",
            color: "#8B5CF6",
            text: ["Use ", "AI", " to summarize item description every ", "morning"]
        },
        {
            id: "status-change-notify-owner",
            icon: "B",
            color: "#0EA5E9",
            text: ["When ", "status", " changes notify the item ", "owner"]
        }
    ],
    "Notifications": [
        {
            id: "item-created-notify",
            icon: "S",
            color: "#F97316",
            text: ["When an ", "item", " is created assign creator as ", "person"]
        }
    ],
    "AI - powered": [
        {
            id: "ai-summarize-daily",
            icon: "AI",
            color: "#8B5CF6",
            text: ["Use ", "AI", " to summarize item description every ", "morning"]
        },
        {
            id: "ai-generate-subtasks",
            icon: "AI",
            color: "#8B5CF6",
            text: ["Generate ", "subtasks", " with AI based on item ", "title"]
        }
    ],
    "Basic": [
        {
            id: "status-owner-notify",
            icon: "B",
            color: "#0EA5E9",
            text: ["When ", "status", " changes notify the item ", "owner"]
        }
    ],
    "Sync": [
        {
            id: "sync-google-calendar",
            icon: "G",
            color: "#4285F4",
            text: ["Sync this ", "task", " to your Google ", "Calendar"]
        }
    ],
    "Recurring": [
        {
            id: "recurring-monday-task",
            icon: "R",
            color: "#10B981",
            text: ["Create a ", "new task", " every Monday at ", "9:00 AM"]
        }
    ],
    "Status change": [
        {
            id: "status-archive-done",
            icon: "ST",
            color: "#F59E0B",
            text: ["When ", "status", " changes to Done, archive the ", "item"]
        }
    ]
};
