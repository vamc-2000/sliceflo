"use client";

import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Member {
  id: string;
  name: string;
  avatar?: string;
}

interface MentionListProps {
  members: Member[];
  query: string;
  onSelect: (member: Member) => void;
  onClose: () => void;
}

export const MentionList: React.FC<MentionListProps> = ({
  members,
  query,
  onSelect,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (scrollRef.current) {
      const selectedElement = scrollRef.current.children[
        selectedIndex + 1
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev + 1 < filtered.length ? prev + 1 : prev,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [filtered, selectedIndex, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="absolute z-50 w-48 bg-card text-card-foreground border border-border rounded-md shadow-lg overflow-hidden max-h-48 overflow-y-auto"
    >
      <div className="px-3 py-2 text-[10px] font-bold text-primary-text uppercase tracking-wider bg-muted/50 border-b border-border">
        Mentions
      </div>
      {filtered.map((member, idx) => (
        <button
          key={member.id}
          className={`flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors
            ${idx === selectedIndex ? "bg-primary/10" : "hover:bg-muted"}`}
          onClick={() => onSelect(member)}
          onMouseEnter={() => setSelectedIndex(idx)}
        >
          <Avatar className="h-5 w-5">
            {member.avatar ? (
              <AvatarImage src={member.avatar} alt={member.name} />
            ) : (
              <AvatarFallback className="text-[8px] font-semibold bg-muted text-foreground">
                {member.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="text-[12px] font-medium text-foreground truncate">
            {member.name}
          </span>
        </button>
      ))}
    </div>
  );
};
