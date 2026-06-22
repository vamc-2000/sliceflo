// components/projects/views/list-view/common/TaskDetailCustomFieldDropdown.tsx

"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatLocalDateTime,
  convertSelectedDateToUTC,
  convertUTCToCalendarDate,
  formatLocalDate,
} from "@/utils/timezone-utils";
import { CalendarPicker } from "@/components/CalendarPicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Check,
  Clock,
  Plus,
  X,
  Share2,
  MapPin,
  Search,
  Calendar as CalendarIcon,
  CheckCircle2,
  SquareCheck,
  Type,
  AlignLeft,
  ListChecks,
  CalendarCheck,
  Hash,
  Globe,
  Mail,
  Phone as PhoneIcon,
  Users,
  Sigma,
  DollarSign,
} from "lucide-react";
import { LabelOption, Task, Subtask } from "@/types/task.types";
import { useProjectsStore, TaskCustomField } from "@/stores/projects-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useTeamStore } from "@/stores/teams-store";
import { MemberAvatar } from "@/components/projects/MemberAvatar";

const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || "";

const getProfilePictureUrl = (profilePicture?: string | null) => {
  if (!profilePicture) return undefined;
  if (profilePicture.startsWith("http")) return profilePicture;
  return `${s3BaseUrl}/${profilePicture}`;
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "??";

type FieldOption = { value: string; color?: string };

function normalizeOptions(options: (string | FieldOption)[]): FieldOption[] {
  return options.map((opt) =>
    typeof opt === "string" ? { value: opt, color: undefined } : opt,
  );
}

interface TaskDetailCustomFieldDropdownProps {
  field: TaskCustomField;
  value?: string | string[] | number;
  onUpdate: (value: string | string[]) => void;
  task?: Task | Subtask;
}

export function TaskDetailCustomFieldDropdown({
  field,
  value,
  onUpdate,
  task,
}: TaskDetailCustomFieldDropdownProps) {
  // Handle NUMBER type - Direct Input
  if (field.type === "number") {
    const currentValue = (value as string) || "";
    const [localValue, setLocalValue] = useState(currentValue);

    useEffect(() => {
      setLocalValue(currentValue);
    }, [currentValue]);

    const handleBlur = () => {
      if (localValue !== currentValue) {
        const numValue = parseFloat(localValue);
        if (localValue === "" || !isNaN(numValue)) {
          onUpdate(localValue);
        } else {
          setLocalValue(currentValue);
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.currentTarget as HTMLInputElement).blur();
      }
    };

    return (
      <div className="relative w-full">
        <Input
          data-testid={`custom-field-number-input-${field.id}`}
          type="number"
          step="any"
          placeholder=" "
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-8 w-full text-xs rounded-xs peer"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-placeholder-shown:opacity-100 peer-focus:opacity-0 transition-opacity">
          <Hash className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Handle TEXT type - Direct Input
  if (field.type === "text") {
    const currentValue = (value as string) || "";
    const [localValue, setLocalValue] = useState(currentValue);

    useEffect(() => {
      setLocalValue(currentValue);
    }, [currentValue]);

    const handleBlur = () => {
      if (localValue !== currentValue) {
        onUpdate(localValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.currentTarget as HTMLInputElement).blur();
      }
    };

    return (
      <div className="relative w-full">
        <Input
          data-testid={`custom-field-text-input-${field.id}`}
          placeholder=" "
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-8 w-full text-xs rounded-xs peer"
          maxLength={30}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-placeholder-shown:opacity-100 peer-focus:opacity-0 transition-opacity">
          <Type className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Handle TEXTAREA type - Direct Input
  if (field.type === "textarea") {
    const currentValue = (value as string) || "";
    const [localValue, setLocalValue] = useState(currentValue);

    useEffect(() => {
      setLocalValue(currentValue);
    }, [currentValue]);

    const handleBlur = () => {
      if (localValue !== currentValue) {
        onUpdate(localValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.currentTarget as HTMLInputElement).blur();
      }
    };

    return (
      <div className="relative w-full">
        <Input
          data-testid={`custom-field-textarea-input-${field.id}`}
          placeholder=" "
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-8 w-full text-xs rounded-xs peer"
          maxLength={250}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-placeholder-shown:opacity-100 peer-focus:opacity-0 transition-opacity">
          <AlignLeft className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Handle WEBSITE type - Direct Input
  if (field.type === "website") {
    const currentValue = (value as string) || "";
    const [localValue, setLocalValue] = useState(currentValue);
    const [error, setError] = useState("");

    useEffect(() => {
      setLocalValue(currentValue);
    }, [currentValue]);

    const isValidUrl = (url: string): boolean => {
      if (!url) return true;
      const pattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w-./?%&=]*)?$/i;
      return pattern.test(url);
    };

    const handleBlur = () => {
      if (localValue === currentValue) {
        setError("");
        return;
      }
      if (localValue === "" || isValidUrl(localValue)) {
        onUpdate(localValue);
        setError("");
      } else {
        setError("Invalid URL");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.currentTarget as HTMLInputElement).blur();
      }
    };

    return (
      <div className="relative w-full">
        <Input
          data-testid={`custom-field-website-input-${field.id}`}
          placeholder=" "
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            if (error) setError("");
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-8 w-full text-xs rounded-xs peer",
            error && "border-red-500",
          )}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-placeholder-shown:opacity-100 peer-focus:opacity-0 transition-opacity">
          <Globe className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Handle PEOPLE type - Dropdown with direct button style
  if (field.type === "people") {
    const currentValue = (value as string) || "";
    const { workspaceMembers } = useWorkspaceStore();
    const { projects } = useProjectsStore();
    const { teams } = useTeamStore();

    const project = projects.find((p) => p.id === field.projectId);
    const projectMemberIds = (project?.members || []).map((m: any) => m.userId);

    const buildMemberDetails = (userIds: string[]) =>
      userIds
        .map((userId) => {
          const wm = workspaceMembers.find((m) => m.userId === userId);
          if (!wm) return null;
          return {
            ...wm,
            fullProfilePictureUrl: getProfilePictureUrl(wm.profilePicture),
            initials: getInitials(wm.name),
          };
        })
        .filter(Boolean);

    let availableMembers: ReturnType<typeof buildMemberDetails> = [];

    if (field.showMembers) {
      availableMembers = buildMemberDetails(projectMemberIds);
    } else if (field.showGuests) {
      availableMembers = [];
    } else if (field.includeFromTeam && field.selectedTeams?.[0]) {
      const teamId = field.selectedTeams[0];
      const team = teams.find((t) => t.id === teamId);
      const teamMemberIds = (team?.teamMembers || []).map((m: any) => m.id);
      availableMembers = buildMemberDetails(
        projectMemberIds.filter((id) => teamMemberIds.includes(id)),
      );
    } else {
      availableMembers = buildMemberDetails(projectMemberIds);
    }

    const selectedMember = availableMembers.find(
      (m) => m?.userId === currentValue,
    );

    const handleToggleMember = (userId: string) => {
      onUpdate(userId === currentValue ? "" : userId);
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            data-testid={`custom-field-people-trigger-${field.id}`}
            variant="outline"
            size="sm"
            className={cn(
              "h-8 px-3 text-xs w-full flex items-center justify-center rounded-xs cursor-pointer hover:bg-accent border-input bg-background text-foreground",
              !currentValue && "text-muted-foreground",
            )}
          >
            {selectedMember ? (
              <div className="flex items-center gap-2">
                <MemberAvatar
                  size="sm"
                  name={selectedMember.name}
                  src={selectedMember.profilePicture}
                />
              </div>
            ) : (
              <Users className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          data-testid={`custom-field-people-content-${field.id}`}
          className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-primary bg-background"
        >
          {field.showGuests && (
            <div
              data-testid="custom-field-people-no-guests"
              className="text-center py-4 text-xs text-muted-foreground bg-muted rounded-xs"
            >
              No guests available
            </div>
          )}

          {!field.showGuests && availableMembers.length === 0 && (
            <div
              data-testid="custom-field-people-no-members"
              className="text-center py-4 text-xs text-muted-foreground bg-muted rounded-xs"
            >
              No members found
            </div>
          )}

          {!field.showGuests &&
            availableMembers.map((member) => {
              const isSelected = member?.userId === currentValue;
              return (
                <DropdownMenuItem
                  data-testid={`custom-field-people-option-${member?.userId}`}
                  key={member?.userId}
                  onSelect={() =>
                    member?.userId && handleToggleMember(member.userId)
                  }
                  className="p-0 focus:bg-transparent"
                >
                  <div className="w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 text-foreground bg-muted">
                    <MemberAvatar
                      size="sm"
                      name={member?.name}
                      src={member?.profilePicture}
                    />
                    <span className="truncate">{member?.name}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-testid={`custom-field-people-clear-${field.id}`}
            onSelect={() => onUpdate("")}
            className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs cursor-pointer"
          >
            Clear
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Handle EMAIL type - Direct Input
  if (field.type === "email") {
    const currentValue = (value as string) || "";
    const [localValue, setLocalValue] = useState(currentValue);
    const [error, setError] = useState("");

    useEffect(() => {
      setLocalValue(currentValue);
    }, [currentValue]);

    const isValidEmail = (email: string): boolean => {
      if (!email) return true;
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return pattern.test(email);
    };

    const handleBlur = () => {
      if (localValue === currentValue) {
        setError("");
        return;
      }
      if (localValue === "" || isValidEmail(localValue)) {
        onUpdate(localValue);
        setError("");
      } else {
        setError("Invalid email");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.currentTarget as HTMLInputElement).blur();
      }
    };

    return (
      <div className="relative w-full">
        <Input
          data-testid={`custom-field-email-input-${field.id}`}
          type="email"
          placeholder=" "
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            if (error) setError("");
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-8 w-full text-xs rounded-xs peer",
            error && "border-red-500",
          )}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-placeholder-shown:opacity-100 peer-focus:opacity-0 transition-opacity">
          <Mail className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Handle PHONE type - Direct Input
  if (field.type === "phone") {
    const currentValue = (value as string) || "";
    const [localValue, setLocalValue] = useState(currentValue);
    const [error, setError] = useState("");

    useEffect(() => {
      setLocalValue(currentValue);
    }, [currentValue]);

    const formatPhoneInput = (input: string): string => {
      return input.replace(/[^\d\+\-\s\(\)]/g, "");
    };

    const isValidPhone = (phone: string): boolean => {
      if (!phone) return true;
      const digitsOnly = phone.replace(/\D/g, "");
      return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    };

    const handleBlur = () => {
      if (localValue === currentValue) {
        setError("");
        return;
      }
      if (localValue === "" || isValidPhone(localValue)) {
        onUpdate(localValue);
        setError("");
      } else {
        setError("Invalid phone");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.currentTarget as HTMLInputElement).blur();
      }
    };

    return (
      <div className="relative w-full">
        <Input
          data-testid={`custom-field-phone-input-${field.id}`}
          type="tel"
          placeholder=" "
          value={localValue}
          onChange={(e) => {
            const formatted = formatPhoneInput(e.target.value);
            setLocalValue(formatted);
            if (error) setError("");
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-8 w-full text-xs rounded-xs peer",
            error && "border-red-500",
          )}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-placeholder-shown:opacity-100 peer-focus:opacity-0 transition-opacity">
          <PhoneIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Handle CHECKBOX type
  if (field.type === "checkbox") {
    const isChecked = (value as string) === "true";

    return (
      <div className="w-full flex items-center justify-center h-8">
        <Checkbox
          data-testid={`custom-field-checkbox-${field.id}`}
          checked={isChecked}
          onCheckedChange={(checked) => {
            onUpdate(checked ? "true" : "false");
          }}
          className="h-5 w-5"
        />
      </div>
    );
  }

  // Handle DATE type - Calendar Picker with direct button style
  if (field.type === "date") {
    const dateValue = (value as string) || "";
    const [showTimeBadge, setShowTimeBadge] = useState(() => !!dateValue);
    const [customTime, setCustomTime] = useState(() => {
      if (dateValue) {
        const date = new Date(dateValue);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
      }
      return "13:30";
    });

    const formatDateTime = (dateStr: string) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return formatLocalDate(dateStr);
    };

    return (
      <div className="w-full">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              data-testid={`custom-field-date-trigger-${field.id}`}
              variant="outline"
              size="sm"
              className={cn(
                "h-8 px-3 font-normal text-xs w-full flex items-center justify-center rounded-xs cursor-pointer border-input bg-background",
                !dateValue && "text-muted-foreground",
              )}
            >
              {dateValue ? (
                <span className="text-xs text-foreground text-center w-full truncate">
                  {formatDateTime(dateValue)}
                </span>
              ) : (
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            data-testid={`custom-field-date-content-${field.id}`}
            className="w-auto p-2 border-0 border-b-[5px] border-primary bg-background"
            align="start"
          >
            <CalendarPicker
              selectedDate={
                dateValue ? convertUTCToCalendarDate(dateValue) : undefined
              }
              onDateSelect={(date) => {
                if (date) {
                  const [hours, minutes] = customTime.split(":");
                  date.setHours(parseInt(hours), parseInt(minutes));
                  onUpdate(convertSelectedDateToUTC(date));
                  if (!showTimeBadge) {
                    setShowTimeBadge(true);
                  }
                }
              }}
            />
            <div className="px-3 py-2 border-t bg-card flex items-center justify-between">
              <div className="relative">
                <input
                  data-testid={`custom-field-date-time-picker-${field.id}`}
                  type="time"
                  value={customTime}
                  onChange={(e) => {
                    setCustomTime(e.target.value);
                    if (dateValue) {
                      const [hours, minutes] = e.target.value.split(":");
                      const date =
                        convertUTCToCalendarDate(dateValue) || new Date();
                      date.setHours(parseInt(hours), parseInt(minutes));
                      onUpdate(convertSelectedDateToUTC(date));
                    }
                    setShowTimeBadge(true);
                  }}
                  className="absolute opacity-0 w-8 h-8 cursor-pointer"
                  id="time-picker-clock"
                />
                <label
                  htmlFor="time-picker-clock"
                  className="p-1 hover:bg-muted rounded cursor-pointer block"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </label>
              </div>
              <button
                data-testid={`custom-field-date-clear-${field.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate("");
                  setCustomTime("13:30");
                  setShowTimeBadge(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Handle BUDGET type - Direct Input
  if (field.type === "budget") {
    const budgetValue = (value as number) || 0;
    const currentValue = budgetValue === 0 ? "" : budgetValue.toString();
    const [localValue, setLocalValue] = useState(currentValue);

    useEffect(() => {
      setLocalValue(currentValue);
    }, [currentValue]);

    const handleBlur = () => {
      if (localValue !== currentValue) {
        const numValue = parseFloat(localValue);
        if (localValue === "" || !isNaN(numValue)) {
          onUpdate(localValue === "" ? "0" : localValue);
        } else {
          setLocalValue(currentValue);
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.currentTarget as HTMLInputElement).blur();
      }
    };

    return (
      <div className="relative w-full">
        <Input
          data-testid={`custom-field-budget-input-${field.id}`}
          type="number"
          placeholder=" "
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-8 w-full text-xs rounded-xs peer"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-placeholder-shown:opacity-100 peer-focus:opacity-0 transition-opacity">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Handle RATING type
  if (field.type === "rating") {
    const ratingValue = (value as number) || 0;
    const emojiType = field.emojiType || "smile";
    const maxRating = field.maxRating || 3;

    const emojiMap: Record<string, string> = {
      smile: "😊",
      star: "⭐",
      heart: "❤️",
      thumbs: "👍",
      fire: "🔥",
    };

    const emoji = emojiMap[emojiType] || "😊";

    return (
      <div className="w-full px-1 py-1 overflow-hidden h-8 flex items-center justify-center">
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden max-w-full",
            maxRating > 5 ? "gap-0.5" : "gap-1",
          )}
        >
          {Array.from({ length: maxRating }).map((_, index) => (
            <button
              data-testid={`custom-field-rating-star-${field.id}-${index + 1}`}
              key={index}
              onClick={() => {
                const newRating = index + 1;
                onUpdate(String(newRating === ratingValue ? 0 : newRating));
              }}
              className={cn(
                "hover:scale-110 transition-transform shrink-0",
                maxRating > 7
                  ? "text-xs"
                  : maxRating > 5
                    ? "text-sm"
                    : "text-base",
              )}
              style={{
                filter: index < ratingValue ? "none" : "grayscale(100%)",
                opacity: index < ratingValue ? 1 : 0.3,
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Handle VOTING type
  if (field.type === "voting") {
    const votingValue = (value as string) === "true" || false;
    const emojiType = field.emojiType || "thumbsup";

    const emojiMap: Record<string, { active: string; inactive: string }> = {
      thumbsup: { active: "👍", inactive: "👍" },
      thumbsdown: { active: "👎", inactive: "👎" },
      heart: { active: "❤️", inactive: "🤍" },
      check: { active: "✓", inactive: "✗" },
      cross: { active: "✗", inactive: "✓" },
    };

    const emoji = emojiMap[emojiType] || emojiMap.thumbsup;

    return (
      <div className="w-full px-2 py-1 flex items-center justify-center h-8">
        <button
          data-testid={`custom-field-voting-button-${field.id}`}
          onClick={() => onUpdate(votingValue ? "false" : "true")}
          className="text-2xl hover:scale-110 transition-transform"
          style={{
            opacity: votingValue ? 1 : 0.3,
          }}
        >
          {votingValue ? emoji.active : emoji.inactive}
        </button>
      </div>
    );
  }

  // Handle IP ADDRESS type - Direct Input
  if (field.type === "ip-address") {
    const ipValue = (value as string) || "";
    const [localValue, setLocalValue] = useState(ipValue);
    const [error, setError] = useState("");

    useEffect(() => {
      setLocalValue(ipValue);
    }, [ipValue]);

    const isValidIPAddress = (ip: string): boolean => {
      if (!ip) return true;
      const ipv4Regex =
        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const ipv6Regex =
        /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:)$/;
      return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    };

    const handleBlur = () => {
      if (localValue === ipValue) {
        setError("");
        return;
      }
      if (isValidIPAddress(localValue)) {
        onUpdate(localValue);
        setError("");
      } else {
        setError("Invalid IP");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.currentTarget as HTMLInputElement).blur();
      }
    };

    return (
      <div className="relative w-full">
        <Input
          data-testid={`custom-field-ip-input-${field.id}`}
          placeholder=" "
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            if (error) setError("");
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-8 w-full text-xs rounded-xs peer",
            error && "border-red-500",
          )}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-placeholder-shown:opacity-100 peer-focus:opacity-0 transition-opacity">
          <Globe className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Handle T-SHIRT SIZE type
  if (field.type === "tshirt-size") {
    const selectedValue = value as string;
    const options = (field.options as any[]) || [];
    const selectedOption = options.find(
      (opt) => (opt.value ?? opt.name) === selectedValue,
    );

    return (
      <Select
        value={selectedValue || ""}
        onValueChange={(newValue) => onUpdate(newValue)}
      >
        <SelectTrigger
          data-testid={`custom-field-tshirt-trigger-${field.id}`}
          className="h-8 w-full border border-input bg-background rounded-xs focus:ring-0"
        >
          <SelectValue placeholder="Select size">
            {selectedOption && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedOption.color }}
                />
                <span className="text-xs">
                  {selectedOption.value ?? selectedOption.name}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent data-testid={`custom-field-tshirt-content-${field.id}`}>
          {options.map((option, idx) => {
            const label = option.value ?? option.name;
            return (
              <SelectItem
                data-testid={`custom-field-tshirt-option-${label}`}
                key={label ?? idx}
                value={label}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  <span>{label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  // Handle FORMULA type
  if (field.type === "formula") {
    const expression = field.expression;

    if (!expression || !task) {
      return (
        <div className="w-full h-8 bg-muted/30 rounded-xs flex items-center justify-center text-xs text-muted-foreground">
          —
        </div>
      );
    }

    const field1Value =
      typeof task.customFieldValues?.[expression.field1] === "number"
        ? (task.customFieldValues[expression.field1] as number)
        : parseFloat(task.customFieldValues?.[expression.field1] as string) ||
          0;

    const field2Value =
      typeof task.customFieldValues?.[expression.field2] === "number"
        ? (task.customFieldValues[expression.field2] as number)
        : parseFloat(task.customFieldValues?.[expression.field2] as string) ||
          0;

    let result = 0;
    switch (expression.operator) {
      case "+":
        result = field1Value + field2Value;
        break;
      case "-":
        result = field1Value - field2Value;
        break;
      case "*":
        result = field1Value * field2Value;
        break;
      case "/":
        result = field2Value !== 0 ? field1Value / field2Value : 0;
        break;
    }

    const formattedResult = Number.isInteger(result)
      ? result.toString()
      : result.toFixed(2);

    return (
      <div className="w-full h-8 bg-muted/30 rounded-xs flex items-center justify-center text-xs font-medium text-foreground">
        {formattedResult}
      </div>
    );
  }

  // Handle FIELD DIFFERENCE type
  if (field.type === "field-difference") {
    const difference = field.difference;
    const relatedTo = field.relatedTo;
    const outputFormat = field.outputFormat;

    if (!difference || !task || !relatedTo) {
      return (
        <div className="w-full h-8 bg-muted/30 rounded-xs flex items-center justify-center text-xs text-muted-foreground">
          —
        </div>
      );
    }

    if (relatedTo === "date") {
      const getDateValue = (fieldId: string): Date | null => {
        const builtInFields: Record<string, any> = {
          createdAt: (task as any).createdAt,
          completedOn: (task as any).completedOn,
          startDate: (task as any).startDate,
          endDate: (task as any).endDate,
        };

        if (builtInFields[fieldId]) {
          return new Date(builtInFields[fieldId]);
        }

        const customValue = task.customFieldValues?.[fieldId];
        return customValue ? new Date(customValue as string) : null;
      };

      const date1 = getDateValue(difference.field1);
      const date2 = getDateValue(difference.field2);

      if (!date1 || !date2) {
        return (
          <div className="w-full h-8 bg-muted/30 rounded-xs flex items-center justify-center text-xs text-muted-foreground">
            —
          </div>
        );
      }

      const diffMs = Math.abs(date2.getTime() - date1.getTime());

      let formattedResult: string;

      if (outputFormat === "hours") {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        formattedResult = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      } else {
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        formattedResult = `${days} day${days !== 1 ? "s" : ""}`;
      }

      return (
        <div className="w-full h-8 bg-muted/30 rounded-xs flex items-center justify-center text-xs font-medium text-foreground">
          {formattedResult}
        </div>
      );
    } else if (relatedTo === "number") {
      const field1Value =
        typeof task.customFieldValues?.[difference.field1] === "number"
          ? (task.customFieldValues[difference.field1] as number)
          : parseFloat(task.customFieldValues?.[difference.field1] as string) ||
            0;

      const field2Value =
        typeof task.customFieldValues?.[difference.field2] === "number"
          ? (task.customFieldValues[difference.field2] as number)
          : parseFloat(task.customFieldValues?.[difference.field2] as string) ||
            0;

      const result = Math.abs(field1Value - field2Value);

      const formattedResult = Number.isInteger(result)
        ? result.toString()
        : result.toFixed(2);

      return (
        <div className="w-full h-8 bg-muted/30 rounded-xs flex items-center justify-center text-xs font-medium text-foreground">
          {formattedResult}
        </div>
      );
    }

    return (
      <div className="w-full h-8 bg-muted/30 rounded-xs flex items-center justify-center text-xs text-muted-foreground">
        —
      </div>
    );
  }

  // Handle LABEL type (multi-select with colors)
  if (field.type === "label") {
    const options = normalizeOptions(field.options || []);
    const selectedLabels = (value as string[]) || [];

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            data-testid={`custom-field-label-trigger-${field.id}`}
            variant="outline"
            size="sm"
            className={cn(
              "w-full h-8 flex items-center justify-center rounded-xs transition-opacity hover:opacity-90 overflow-hidden p-0 border border-input bg-background text-foreground",
              selectedLabels.length === 0 && "text-muted-foreground",
            )}
          >
            {selectedLabels.length > 0 ? (
              <div className="flex w-full h-full">
                {selectedLabels.map((labelVal, idx) => {
                  const opt = options.find((o) => o.value === labelVal);
                  return (
                    <div
                      key={idx}
                      className="flex-1 h-full flex items-center justify-center text-white text-[10px] font-medium px-2 border-r border-white/20 last:border-r-0 min-w-0"
                      style={{ backgroundColor: opt?.color ?? "#c4c4c4" }}
                      title={labelVal}
                    >
                      <span className="truncate">{labelVal}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          data-testid={`custom-field-label-content-${field.id}`}
          className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-primary bg-background"
          align="center"
        >
          {options.map((option) => {
            const isSelected = selectedLabels.includes(option.value);
            return (
              <DropdownMenuItem
                data-testid={`custom-field-label-option-${option.value}`}
                key={option.value}
                onSelect={(e) => {
                  e.preventDefault();
                  const newValue = isSelected
                    ? selectedLabels.filter((o) => o !== option.value)
                    : [...selectedLabels, option.value];
                  onUpdate(newValue);
                }}
                className="p-0 focus:bg-transparent"
              >
                <div
                  className="w-full h-9 flex items-center justify-center rounded-xs text-white text-xs font-medium transition-opacity hover:opacity-90 px-3 relative"
                  style={{ backgroundColor: option.color || "#c4c4c4" }}
                >
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 absolute left-2 text-white" />
                  )}
                  <span className="truncate w-full text-center">
                    {option.value}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })}
          {options.length === 0 && (
            <div className="p-2 text-xs text-muted-foreground text-center">
              No labels available
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-testid={`custom-field-label-clear-${field.id}`}
            onSelect={() => onUpdate([])}
            className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
          >
            Clear All
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Handle SELECT-ONE type
  if (field.type === "select-one") {
    const options = normalizeOptions(field.options || []);
    const currentValue = (value as string) || "";
    const selectedOption = options.find((o) => o.value === currentValue);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            data-testid={`custom-field-select-one-trigger-${field.id}`}
            variant="outline"
            size="sm"
            className={cn(
              "w-full h-8 flex items-center justify-center text-xs font-medium transition-opacity hover:opacity-90 overflow-hidden rounded-xs outline-none p-0",
              currentValue
                ? "text-white border-0"
                : "text-muted-foreground bg-background border border-input",
            )}
            style={
              currentValue
                ? { backgroundColor: selectedOption?.color || "#c4c4c4" }
                : {}
            }
          >
            <span className="truncate w-full h-full text-center flex items-center justify-center">
              {currentValue || <CheckCircle2 className="h-4 w-4" />}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          data-testid={`custom-field-select-one-content-${field.id}`}
          className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-primary bg-background"
          align="center"
        >
          {options.map((option) => {
            return (
              <DropdownMenuItem
                data-testid={`custom-field-select-one-option-${option.value}`}
                key={option.value}
                onSelect={() => onUpdate(option.value)}
                className="p-0 focus:bg-transparent"
              >
                <div
                  className="w-full h-9 flex items-center justify-center rounded-xs text-white text-xs font-medium transition-opacity hover:opacity-90 px-3"
                  style={{ backgroundColor: option.color || "#c4c4c4" }}
                >
                  <span className="truncate w-full text-center">
                    {option.value}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })}
          {options.length === 0 && (
            <div className="p-2 text-xs text-muted-foreground text-center">
              No options available
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-testid={`custom-field-select-one-clear-${field.id}`}
            onSelect={() => onUpdate("")}
            className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
          >
            Clear
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Handle SELECT-MANY type
  if (field.type === "select-many") {
    const options = normalizeOptions(field.options as (string | FieldOption)[]);
    const selectedOptions = (value as string[]) || [];

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            data-testid={`custom-field-select-many-trigger-${field.id}`}
            variant="outline"
            size="sm"
            className={cn(
              "w-full h-8 flex items-center justify-center overflow-hidden transition-opacity hover:opacity-90 cursor-pointer p-0 rounded-xs outline-none border border-input bg-background text-foreground",
              selectedOptions.length === 0 && "text-muted-foreground",
            )}
          >
            {selectedOptions.length > 0 ? (
              <div className="flex w-full h-full">
                {selectedOptions.map((optVal, idx) => {
                  const opt = options.find((o) => o.value === optVal);
                  return (
                    <div
                      key={idx}
                      className="flex-1 h-full flex items-center justify-center text-white text-[10px] font-medium px-2 border-r border-white/20 last:border-r-0 min-w-0"
                      style={{ backgroundColor: opt?.color ?? "#c4c4c4" }}
                      title={optVal}
                    >
                      <span className="truncate">{optVal}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <SquareCheck className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          data-testid={`custom-field-select-many-content-${field.id}`}
          className="p-4 w-[200px] space-y-1 border-0 border-b-[5px] border-primary bg-background"
          align="center"
        >
          {options.map((option) => {
            const isSelected = selectedOptions.includes(option.value);
            return (
              <DropdownMenuItem
                data-testid={`custom-field-select-many-option-${option.value}`}
                key={option.value}
                onSelect={(e) => {
                  e.preventDefault();
                  const newValue = isSelected
                    ? selectedOptions.filter((o) => o !== option.value)
                    : [...selectedOptions, option.value];
                  onUpdate(newValue);
                }}
                className="p-0 focus:bg-transparent"
              >
                <div
                  className="w-full h-9 flex items-center justify-center rounded-xs text-white text-xs font-medium transition-opacity hover:opacity-90 px-3 relative"
                  style={{ backgroundColor: option.color || "#c4c4c4" }}
                >
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 absolute left-2 text-white" />
                  )}
                  <span className="truncate w-full text-center">
                    {option.value}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })}
          {options.length === 0 && (
            <div className="p-2 text-xs text-muted-foreground text-center">
              No options available
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-testid={`custom-field-select-many-clear-${field.id}`}
            onSelect={() => onUpdate([])}
            className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
          >
            Clear All
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}
