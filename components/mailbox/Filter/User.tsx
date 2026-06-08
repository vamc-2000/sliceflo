"use client";

import { FC } from "react";
import { X } from "lucide-react";

interface UserProps {
  onSelect: (value: string) => void;
  selectedFilters?: string[];   // ✅ add this
}

const User: FC<UserProps> = ({ onSelect, selectedFilters = [] }) => {
  const options = ["Mentioned", "Assigned by me"];

  return (
    <div data-testid="user-filter-menu-container" className="w-50 p-2 flex flex-col rounded-lg text-xs">
      {options.map((option) => {
        const isActive = selectedFilters.includes(`user:${option}`);
        const slug = option.toLowerCase().replace(/\s+/g, "-");
        return (
          <button
            key={option}
            data-testid={`user-filter-option-${slug}`}
            className={`w-full text-left px-3 py-2 rounded-none hover:bg-muted font-medium border-l-2 transition-colors flex items-center justify-between ${
              isActive
                ? "border-l-primary text-primary bg-background"   // ✅ active
                : "border-l-transparent text-foreground"           // ✅ inactive
            }`}
            onClick={() => onSelect(option)}
          >
            {option}
            {isActive && (
              <span
                data-testid={`user-filter-clear-${slug}`}
                className="w-5 h-5 rounded-full bg-muted hover:bg-red-100 hover:text-red-600 flex items-center justify-center shrink-0 ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(option); // ✅ clicking X deselects (selectUser toggles)
                }}
              >
                <X className="w-3 h-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default User;
