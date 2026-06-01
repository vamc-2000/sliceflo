
"use client";

import { useMemo } from "react";
import { List, ChevronRight } from "lucide-react";
import { useProjectsStore } from "@/stores/projects-store";
import { cn } from "@/lib/utils";
import { iconLibrary } from "@/components/ColorIconPicker";

export function PersonalListPanel() {
  const { projects } = useProjectsStore();

  const myProjects = useMemo(() => projects.slice(0, 5), [projects]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <List className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-bold">Personal List</h3>
      </div>
      <div className="flex flex-col gap-1.5">
        {myProjects.map((p) => {
          const avatar = p.icon

          return (
            <div
              key={p.id}
              className="group flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">

                {/*  Project Icon */}
                <div
                  className="h-6 w-6 rounded-md shrink-0 flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor:
                      avatar?.type === "icon"
                        ? (avatar.color ?? p.color ?? "#3B82F6") + "20"
                        : (p.color ? p.color + "20" : "#3B82F620"),
                  }}
                >
                  {avatar?.type === "file" && avatar.presignedUrl ? (
                    <img
                      src={avatar.presignedUrl}
                      alt={p.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : avatar?.type === "icon" ? (
                    (() => {
                      const iconObj = iconLibrary.find((i: any) => i.name === avatar.name)
                      if (iconObj) {
                        const IconComponent = iconObj.icon
                        return <IconComponent size={12} color={avatar.color} />
                      }
                      return (
                        <span className="text-[10px] font-bold" style={{ color: avatar.color ?? p.color ?? "#3B82F6" }}>
                          {p.name?.charAt(0).toUpperCase()}
                        </span>
                      )
                    })()
                  ) : (
                    <span className="text-[10px] font-bold" style={{ color: p.color ?? "#3B82F6" }}>
                      {p.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate group-hover:text-blue-600 transition-colors">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {p.status || "Active"}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )
        })}

        {myProjects.length === 0 && (
          <p className="text-[10px] text-muted-foreground px-2">No projects yet.</p>
        )}
      </div>
    </div>
  );
}
