
"use client";

import { Card } from "@/components/ui/card";
import { STANDUPS, STANDUP_TEXT } from "./dashboard-data";

export function StandupsPanel() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-tight">Standups</h2>
      {STANDUPS.map((s) => (
        <Card key={s.id} className="flex flex-col gap-2 rounded-xl border p-4 shadow-none hover:shadow-sm transition-shadow">
          <p className="text-sm font-semibold">{s.title}</p>
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{STANDUP_TEXT}</p>
          <button className="self-end text-[11px] font-medium text-blue-500 hover:underline">Details</button>
        </Card>
      ))}
    </div>
  );
}
