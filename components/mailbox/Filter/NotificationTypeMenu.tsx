"use client";

import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  selected: Record<string, boolean>;
  onToggle: (key: string, value: boolean) => void;
}

export default function NotificationTypeMenu({ selected, onToggle }: Props) {
  return (
    <div className="relative w-68">
      {/* Menu container with border radius */}
      <div className="bg-background rounded-lg overflow-hidden ">
        <div className="flex flex-col gap-0 p-2">
          {Object.entries(selected).map(([key, value]) => (
            <button
              key={key}
              onClick={() => onToggle(key, !value)}
              className="flex items-center justify-between px-3 py-2 hover:bg-muted text-sm text-foreground rounded-md"
            >
              {/* Checkbox + Label */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={value}
                  onCheckedChange={() => onToggle(key, !value)}
                  className="border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary border-primary"
                />
                <span className="text-xs font-medium text-foreground">{formatLabel(key)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatLabel(key: string) {
  const labels: Record<string, string> = {
    Apps: "Apps and integrations",
    assignments: "Assignments",
    comments: "Comments and replies",
    customer: "Customer requests",
    document: "Document changes",
    mentions: "Mentions",
    pulse: "Pulse summaries",
    reactions: "Reactions",
    reminders: "Reminders and deadlines",
    reviews: "Reviews",
    status: "Status changes",
    subscriptions: "Subscriptions",
    system: "System notifications",
    triage: "Triage",
    updates: "Updates",
  };
  return labels[key] ?? key;
}
