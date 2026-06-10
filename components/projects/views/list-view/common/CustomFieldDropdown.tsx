// components/list-view/common/CustomFieldDropdown.tsx

"use client";

import { useState } from "react";
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
import { formatLocalDateTime, convertSelectedDateToUTC } from "@/utils/timezone-utils";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { LabelOption, Task, Subtask } from '@/types/task.types';
import { useProjectsStore, TaskCustomField } from "@/stores/projects-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useTeamStore } from "@/stores/teams-store";
import { MemberAvatar } from "@/components/projects/MemberAvatar";

const s3BaseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || "";

const getProfilePictureUrl = (profilePicture?: string | null) => {
  if (!profilePicture) return undefined;
  if (profilePicture.startsWith('http')) return profilePicture;
  return `${s3BaseUrl}/${profilePicture}`;
};

const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase() || "??";

// Normalize options: supports both legacy string[] and new { value, color }[]
type FieldOption = { value: string; color?: string };

function normalizeOptions(options: (string | FieldOption)[]): FieldOption[] {
  return options.map(opt =>
    typeof opt === 'string' ? { value: opt, color: undefined } : opt
  );
}

interface CustomFieldDropdownProps {
  field: TaskCustomField;
  value?: string | string[] | number;
  onUpdate: (value: string | string[]) => void;
  task?: Task | Subtask;
}
export function CustomFieldDropdown({
  field,
  value,
  onUpdate,
  task,
}: CustomFieldDropdownProps) {

  // Handle NUMBER type - Double-click to edit, formatted display
  if (field.type === 'number') {
    const currentValue = (value as string) || '';
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(currentValue);

    const formatNumber = (val: string | number) => {
      if (!val || val === '') return '';
      const numVal = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(numVal)) return '';

      const formatted = numVal.toFixed(field.decimalPlaces || 0);

      switch (field.numberFormat) {
        case 'percentage':
          return `${formatted}%`;
        case 'currency':
          const currencySymbols: Record<string, string> = {
            USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥',
            CNY: '¥', AUD: 'A$', CAD: 'C$'
          };
          const symbol = currencySymbols[field.currency || 'USD'] || '$';
          return `${symbol} ${formatted}`;
        case 'customLabel':
          return field.labelPosition === 'left'
            ? `${field.customLabel} ${formatted}`
            : `${formatted} ${field.customLabel}`;
        case 'none':
          return formatted;
        case 'number':
        default:
          return formatted;
      }
    };

    const handleBlur = () => {
      if (localValue === currentValue) {
        setIsEditing(false);
        return;
      }

      const numValue = parseFloat(localValue);
      if (localValue === '' || !isNaN(numValue)) {
        onUpdate(localValue);
        setIsEditing(false);
      } else {
        // Invalid number, revert
        setLocalValue(currentValue);
        setIsEditing(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBlur();
      }
      if (e.key === 'Escape') {
        setLocalValue(currentValue);
        setIsEditing(false);
      }
    };

    return (
      <div className="w-full">
        {isEditing ? (
          // Edit Mode - Raw number input
          <Input
            data-testid={`custom-field-number-input-${field.id}`}
            type="number"
            step="any"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={field.defaultValue ? String(field.defaultValue) : '0'}
            className="h-8 text-xs text-left"
            autoFocus
          />
        ) : (
          // Display Mode - Formatted number
          <div
            onDoubleClick={() => setIsEditing(true)}
            className="h-8 flex items-center justify-center px-2 hover:bg-muted rounded cursor-pointer"
          >
            <span className={cn("text-xs truncate w-full", currentValue ? 'text-left text-foreground' : 'text-center text-muted-foreground')}>
              {currentValue ? formatNumber(currentValue) : <Hash className="h-4 w-4 text-muted-foreground mx-auto" />}
            </span>
          </div>
        )}
      </div>
    );
  }


  // Handle TEXT type - Double-click to edit
  if (field.type === 'text') {
    const currentValue = (value as string) || '';
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(currentValue);

    const handleBlur = () => {
      if (localValue === currentValue) {
        setIsEditing(false);
        return;
      }
      onUpdate(localValue);
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBlur();
      }
      if (e.key === 'Escape') {
        setLocalValue(currentValue);
        setIsEditing(false);
      }
    };

    return (
      <div className="w-full">
        {isEditing ? (
          // Edit Mode
          <Input
            data-testid={`custom-field-text-input-${field.id}`}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={field.defaultValue ? String(field.defaultValue) : `Enter ${field.name.toLowerCase()}`}
            className="h-8 text-xs text-left"
            maxLength={30}
            autoFocus
          />
        ) : (
          // Display Mode
          <div
            onDoubleClick={() => setIsEditing(true)}
            className="h-8 flex items-center justify-center px-2 hover:bg-muted rounded cursor-pointer"
          >
            <span className={cn("text-xs truncate w-full", currentValue ? 'text-left text-foreground' : 'text-center text-muted-foreground')}>
              {currentValue || <Type className="h-4 w-4 text-muted-foreground mx-auto" />}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Handle TEXTAREA type - Double-click to edit
  if (field.type === 'textarea') {
    const currentValue = (value as string) || '';
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(currentValue);

    const handleBlur = () => {
      if (localValue === currentValue) {
        setIsEditing(false);
        return;
      }
      onUpdate(localValue);
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBlur();
      }
      if (e.key === 'Escape') {
        setLocalValue(currentValue);
        setIsEditing(false);
      }
    };

    return (
      <div className="w-full">
        {isEditing ? (
          // Edit Mode
          <Input
            data-testid={`custom-field-textarea-input-${field.id}`}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={field.defaultValue ? String(field.defaultValue) : `Enter ${field.name.toLowerCase()}`}
            className="h-8 text-xs text-left"
            maxLength={250}
            autoFocus
          />
        ) : (
          // Display Mode
          <div
            onDoubleClick={() => setIsEditing(true)}
            className="h-8 flex items-center justify-center px-2 hover:bg-muted rounded cursor-pointer"
          >
            <span className={cn("text-xs truncate w-full", currentValue ? 'text-left text-foreground' : 'text-center text-muted-foreground')}>
              {currentValue || <AlignLeft className="h-4 w-4 text-muted-foreground mx-auto" />}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Handle WEBSITE type - Click to visit, double-click to edit
  if (field.type === 'website') {
    const currentValue = (value as string) || '';
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(currentValue);
    const [error, setError] = useState('');

    const isValidUrl = (url: string): boolean => {
      if (!url) return true;
      const pattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w-./?%&=]*)?$/i;
      return pattern.test(url);
    };

    const handleBlur = () => {
      if (localValue === currentValue) {
        setIsEditing(false);
        setError('');
        return;
      }

      if (localValue === '' || isValidUrl(localValue)) {
        onUpdate(localValue);
        setIsEditing(false);
        setError('');
      } else {
        setError('Invalid URL');
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBlur();
      }
      if (e.key === 'Escape') {
        setLocalValue(currentValue);
        setIsEditing(false);
        setError('');
      }
    };

    return (
      <div className="w-full">
        {isEditing ? (
          // Edit Mode
          <div className="space-y-1">
            <Input
              data-testid={`custom-field-website-input-${field.id}`}
              value={localValue}
              onChange={(e) => {
                setLocalValue(e.target.value);
                if (error) setError('');
              }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com"
              className={`h-8 text-xs text-left ${error ? 'border-red-500' : ''}`}
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            className="h-8 flex items-center justify-center px-2 hover:bg-muted rounded cursor-pointer"
          >
            {field.hyperlink && currentValue && isValidUrl(currentValue) ? (
              <a
                href={currentValue.startsWith('http') ? currentValue : `https://${currentValue}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline text-xs truncate text-left w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {currentValue}
              </a>
            ) : (
              <span className={cn("text-xs truncate w-full", currentValue ? 'text-left text-foreground' : 'text-center text-muted-foreground')}>
                {currentValue || <Globe className="h-4 w-4 text-muted-foreground mx-auto" />}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Handle PEOPLE type - Click to open member picker
  if (field.type === 'people') {
    const currentValue = (value as string) || '';
    const { workspaceMembers } = useWorkspaceStore();
    const { projects } = useProjectsStore();
    const { teams } = useTeamStore();

    // ── Determine which members to show based on field settings ──
    const project = projects.find(p => p.id === field.projectId);
    const projectMemberIds = (project?.members || []).map((m: any) => m.userId);

    // Cross-ref helper — same as ProjectMembersSection
    const buildMemberDetails = (userIds: string[]) =>
      userIds
        .map(userId => {
          const wm = workspaceMembers.find(m => m.userId === userId);
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
      // ✅ Show all project members
      availableMembers = buildMemberDetails(projectMemberIds);

    } else if (field.showGuests) {
      // ✅ Future: filter guests — for now show empty with message
      availableMembers = [];

    } else if (field.includeFromTeam && field.selectedTeams?.[0]) {
      const teamId = field.selectedTeams[0];
      const team = teams.find(t => t.id === teamId);

      // team.teamMembers is array of { id, name } — from ProjectMembersSection line 143
      const teamMemberIds = (team?.teamMembers || []).map((m: any) => m.id);

      // Cross-reference with workspaceMembers to get full profile details
      availableMembers = buildMemberDetails(
        // Only show team members who are also in the project
        projectMemberIds.filter(id => teamMemberIds.includes(id))
      );

    } else {
      // No setting chosen — show all project members as fallback
      availableMembers = buildMemberDetails(projectMemberIds);
    }

    const selectedMember = availableMembers.find(m => m?.userId === currentValue);

    const handleToggleMember = (userId: string) => {
      // Single select behavior like assignee
      onUpdate(userId === currentValue ? '' : userId);
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button data-testid={`custom-field-people-trigger-${field.id}`} className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted transition-colors overflow-hidden">
            {selectedMember ? (
              <MemberAvatar size="md" name={selectedMember.name} src={selectedMember.profilePicture} />
            ) : (
              <Users className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent data-testid={`custom-field-people-content-${field.id}`} className="p-4 w-[200px] space-y-1">
          {/* ✅ Show guests message */}
          {field.showGuests && (
            <div data-testid="custom-field-people-no-guests" className="text-center py-4 text-xs text-muted-foreground bg-muted rounded-xs">
              No guests available
            </div>
          )}

          {/* ✅ Normal member list */}
          {!field.showGuests && availableMembers.length === 0 && (
            <div data-testid="custom-field-people-no-members" className="text-center py-4 text-xs text-muted-foreground bg-muted rounded-xs">
              No members found
            </div>
          )}

          {!field.showGuests && availableMembers.map((member) => {
            const isSelected = member?.userId === currentValue;
            return (
              <DropdownMenuItem data-testid={`custom-field-people-option-${member?.userId}`}
                key={member?.userId}
                onSelect={() => member?.userId && handleToggleMember(member.userId)}
                className="p-0 focus:bg-transparent"
              >
                <div className={cn(
                  "w-full h-9 flex items-center gap-3 rounded-xs text-xs font-medium hover:bg-muted transition-colors px-3 text-foreground",
                  isSelected ? "bg-muted" : "bg-muted"
                )}>
                  <MemberAvatar size="sm" name={member?.name} src={member?.profilePicture} />
                  <span className="truncate">{member?.name}</span>
                </div>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />
          <DropdownMenuItem data-testid={`custom-field-people-clear-${field.id}`}
            onSelect={() => onUpdate('')}
            className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs cursor-pointer"
          >
            Clear
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }


  // Handle EMAIL type - Click to send email, double-click to edit
  if (field.type === 'email') {
    const currentValue = (value as string) || '';
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(currentValue);
    const [error, setError] = useState('');

    const isValidEmail = (email: string): boolean => {
      if (!email) return true;
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return pattern.test(email);
    };

    const handleBlur = () => {
      if (localValue === currentValue) {
        setIsEditing(false);
        setError('');
        return;
      }

      if (localValue === '' || isValidEmail(localValue)) {
        onUpdate(localValue);
        setIsEditing(false);
        setError('');
      } else {
        setError('Invalid email');
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBlur();
      }
      if (e.key === 'Escape') {
        setLocalValue(currentValue);
        setIsEditing(false);
        setError('');
      }
    };

    return (
      <div className="w-full">
        {isEditing ? (
          // Edit Mode
          <div className="space-y-1">
            <Input
              data-testid={`custom-field-email-input-${field.id}`}
              type="email"
              value={localValue}
              onChange={(e) => {
                setLocalValue(e.target.value);
                if (error) setError('');
              }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="email@example.com"
              className={`h-8 text-xs text-left ${error ? 'border-red-500' : ''}`}
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            className="h-8 flex items-center justify-center px-2 hover:bg-muted rounded cursor-pointer"
          >
            {currentValue && isValidEmail(currentValue) ? (
              <a
                href={`mailto:${currentValue}`}
                className="text-blue-600 hover:text-blue-800 hover:underline text-xs truncate text-left w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {currentValue}
              </a>
            ) : (
              <span className={cn("text-xs truncate w-full", currentValue ? 'text-left text-foreground' : 'text-center text-muted-foreground')}>
                {currentValue || <Mail className="h-4 w-4 text-muted-foreground mx-auto" />}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Handle PHONE type - Only allow numbers and formatting characters
  if (field.type === 'phone') {
    const currentValue = (value as string) || '';
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(currentValue);
    const [error, setError] = useState('');

    const formatPhoneInput = (input: string): string => {
      // Allow only numbers, +, -, spaces, and parentheses
      return input.replace(/[^\d\+\-\s\(\)]/g, '');
    };

    const isValidPhone = (phone: string): boolean => {
      if (!phone) return true;
      // Must have at least 10 digits
      const digitsOnly = phone.replace(/\D/g, '');
      return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    };

    const handleBlur = () => {
      if (localValue === currentValue) {
        setIsEditing(false);
        setError('');
        return;
      }

      if (localValue === '' || isValidPhone(localValue)) {
        onUpdate(localValue);
        setIsEditing(false);
        setError('');
      } else {
        setError('Invalid phone number (10-15 digits required)');
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBlur();
      }
      if (e.key === 'Escape') {
        setLocalValue(currentValue);
        setIsEditing(false);
        setError('');
      }
    };

    return (
      <div className="w-full">
        {isEditing ? (
          // Edit Mode
          <div className="space-y-1">
            <Input
              data-testid={`custom-field-phone-input-${field.id}`}
              type="tel"
              value={localValue}
              onChange={(e) => {
                const formatted = formatPhoneInput(e.target.value);
                setLocalValue(formatted);
                if (error) setError('');
              }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="+91 9876543210"
              className={`h-8 text-xs text-left ${error ? 'border-red-500' : ''}`}
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            className="h-8 flex items-center justify-center px-2 hover:bg-muted rounded cursor-pointer"
          >
            {currentValue && isValidPhone(currentValue) ? (
              <a
                href={`tel:${currentValue.replace(/\D/g, '')}`}
                className="text-blue-600 hover:text-blue-800 hover:underline text-xs truncate text-left w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {currentValue}
              </a>
            ) : (
              <span className={cn("text-xs truncate w-full", currentValue ? 'text-left text-foreground' : 'text-center text-muted-foreground')}>
                {currentValue || <PhoneIcon className="h-4 w-4 text-muted-foreground mx-auto" />}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Handle CHECKBOX type - Store as string "true" or "false"
  if (field.type === 'checkbox') {
    const isChecked = (value as string) === 'true';

    return (
      <div className="w-full flex items-center justify-center">
        <Checkbox
          data-testid={`custom-field-checkbox-${field.id}`}
          checked={isChecked}
          onCheckedChange={(checked) => {
            // Convert boolean to string "true" or "false"
            onUpdate(checked ? 'true' : 'false');
          }}
          className="h-5 w-5"
        />
      </div>
    );
  }

  // Handle DATE type - X button sets default time (13:30)
  if (field.type === 'date') {
    const dateValue = (value as string) || '';
    const [showTimeBadge, setShowTimeBadge] = useState(() => !!dateValue);
    const [customTime, setCustomTime] = useState(() => {
      if (dateValue) {
        const date = new Date(dateValue);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      return '13:30';
    });

    const formatDateTime = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      return formatLocalDateTime(date);
    };

    return (
      <div className="w-full">
        <Popover>
          <PopoverTrigger asChild>
            <Button data-testid={`custom-field-date-trigger-${field.id}`}
              variant="ghost"
              size="sm"
              className={cn("h-8 px-2 w-full font-normal", dateValue ? "justify-start" : "justify-center")}
            >
              {dateValue ? (
                <span className="text-xs text-foreground text-left w-full truncate">{formatDateTime(dateValue)}</span>
              ) : (
                <div className="flex items-center justify-center gap-2 w-full">
                  <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent data-testid={`custom-field-date-content-${field.id}`} className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue ? new Date(dateValue) : undefined}
              onSelect={(date) => {
                if (date) {
                  // Use current time from time picker
                  const [hours, minutes] = customTime.split(':');
                  date.setHours(parseInt(hours), parseInt(minutes));
                  onUpdate(convertSelectedDateToUTC(date));
                  if (!showTimeBadge) {
                    setShowTimeBadge(true);
                  }
                }
              }}
              initialFocus
            />
            {/* Clock Icon and Clear in a row */}
            <div className="px-3 py-2 border-t bg-card flex items-center justify-between">
              {/* Clock icon with direct time input */}
              <div className="relative">
                <input data-testid={`custom-field-date-time-picker-${field.id}`}
                  type="time"
                  value={customTime}
                  onChange={(e) => {
                    setCustomTime(e.target.value);
                    if (dateValue) {
                      const [hours, minutes] = e.target.value.split(':');
                      const date = new Date(dateValue);
                      date.setHours(parseInt(hours), parseInt(minutes));
                      onUpdate(convertSelectedDateToUTC(date));
                    }
                    setShowTimeBadge(true);
                  }}
                  className="absolute opacity-0 w-8 h-8 cursor-pointer"
                  id="time-picker-clock"
                />
                <label htmlFor="time-picker-clock" className="p-1 hover:bg-muted rounded cursor-pointer block">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </label>
              </div>
              <button data-testid={`custom-field-date-clear-${field.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate('');
                  setCustomTime('13:30');
                  setShowTimeBadge(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
            {/* Time badge - Inline editable (no clock icon) */}
            {showTimeBadge && (
              <div className="px-3 pb-3">
                <div className="w-full h-10 bg-orange-500 text-white font-medium rounded-md flex items-center justify-between px-3 relative">
                  {/* Inline time input - hide clock icon */}
                  <input data-testid={`custom-field-date-inline-time-${field.id}`}
                    type="time"
                    value={customTime}
                    onChange={(e) => {
                      setCustomTime(e.target.value);
                      if (dateValue) {
                        const [hours, minutes] = e.target.value.split(':');
                        const date = new Date(dateValue);
                        date.setHours(parseInt(hours), parseInt(minutes));
                        onUpdate(convertSelectedDateToUTC(date));
                      }
                    }}
                    className="bg-transparent border-0 text-white font-medium outline-none flex-1 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                  <button data-testid={`custom-field-date-inline-time-clear-${field.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Set time to default 13:30 and update date
                      setCustomTime('13:30');
                      if (dateValue) {
                        const date = new Date(dateValue);
                        date.setHours(13, 30);
                        onUpdate(convertSelectedDateToUTC(date));
                      }
                      setShowTimeBadge(false);
                    }}
                    className="p-1 hover:bg-orange-600 rounded ml-2"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Handle BUDGET type - Inline editing with double-click
  if (field.type === 'budget') {
    const budgetValue = (value as number) || 0;
    const currency = field.currency || 'USD';
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(budgetValue.toString());

    const formatBudget = (amount: number) => {
      if (amount === 0) return '';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const handleSave = () => {
      const numValue = editValue === '' ? 0 : parseFloat(editValue);
      if (!isNaN(numValue)) {
        onUpdate(String(numValue));
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        setEditValue(budgetValue.toString());
        setIsEditing(false);
      }
    };

    if (isEditing) {
      return (
        <div className="w-full">
          <Input data-testid={`custom-field-budget-input-${field.id}`}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="h-8 text-xs border-0 focus:ring-0 focus:outline-none px-2"
          />
        </div>
      );
    }

    return (
      <div data-testid={`custom-field-budget-display-${field.id}`}
        className="w-full px-2 py-1 cursor-pointer hover:bg-muted min-h-[32px] flex items-center"
        onDoubleClick={() => {
          setIsEditing(true);
          setEditValue(budgetValue.toString());
        }}
      >
        {budgetValue > 0 ? (
          <span className="text-xs text-left w-full truncate">{formatBudget(budgetValue)}</span>
        ) : (
          <div className="w-full flex justify-center">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  // Handle RATING type
  if (field.type === 'rating') {
    const ratingValue = (value as number) || 0;
    const emojiType = field.emojiType || 'smile';
    const maxRating = field.maxRating || 3;

    const emojiMap: Record<string, string> = {
      smile: '😊',
      star: '⭐',
      heart: '❤️',
      thumbs: '👍',
      fire: '🔥',
    };

    const emoji = emojiMap[emojiType] || '😊';

    return (
      <div className="w-full px-1 py-1 overflow-hidden">
        <div className={cn(
          "flex items-center justify-center overflow-hidden max-w-full",
          maxRating > 5 ? "gap-0.5" : "gap-1"
        )}>
          {Array.from({ length: maxRating }).map((_, index) => (
            <button data-testid={`custom-field-rating-star-${field.id}-${index + 1}`}
              key={index}
              onClick={() => {
                const newRating = index + 1;
                onUpdate(String(newRating === ratingValue ? 0 : newRating));
              }}
              className={cn(
                "hover:scale-110 transition-transform shrink-0",
                maxRating > 7 ? "text-xs" : maxRating > 5 ? "text-sm" : "text-base"
              )}
              style={{
                filter: index < ratingValue ? 'none' : 'grayscale(100%)',
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

  // Handle ROLLUP type - Inline editing with double-click
  /* if (field.type === 'rollup') {
    const rollupValue = (value as string) || '';
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(rollupValue);

    const handleSave = () => {
      onUpdate(editValue);
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        setEditValue(rollupValue);
        setIsEditing(false);
      }
    };

    if (isEditing) {
      return (
        <div className="w-full">
          <Input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="h-8 text-xs border-0 focus:ring-0 focus:outline-none px-2 text-left"
          />
        </div>
      );
    }

    return (
      <div
        className="w-full px-2 py-1 cursor-pointer hover:bg-muted min-h-[32px] flex items-center"
        onDoubleClick={() => {
          setIsEditing(true);
          setEditValue(rollupValue);
        }}
      >
        <span className={cn("text-xs truncate w-full", rollupValue ? 'text-left text-foreground' : 'text-center text-muted-foreground')}>
          {rollupValue || <Sigma className="h-4 w-4 text-muted-foreground mx-auto" />}
        </span>
      </div>
    );
  } */

  // Handle VOTING type
  if (field.type === 'voting') {
    const votingValue = (value as string) === 'true' || false;
    const emojiType = field.emojiType || 'thumbsup';

    const emojiMap: Record<string, { active: string; inactive: string }> = {
      thumbsup: { active: '👍', inactive: '👍' },
      thumbsdown: { active: '👎', inactive: '👎' },
      heart: { active: '❤️', inactive: '🤍' },
      check: { active: '✓', inactive: '✗' },
      cross: { active: '✗', inactive: '✓' },
    };

    const emoji = emojiMap[emojiType] || emojiMap.thumbsup;

    return (
      <div className="w-full px-2 py-1 flex items-center justify-center">
        <button data-testid={`custom-field-voting-button-${field.id}`}
          onClick={() => onUpdate(votingValue ? 'false' : 'true')}
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

  // Handle IP ADDRESS type - Inline editing with validation
  if (field.type === 'ip-address') {
    const ipValue = (value as string) || '';
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(ipValue);
    const [error, setError] = useState('');

    // IP Address validation function
    const isValidIPAddress = (ip: string): boolean => {
      if (!ip) return true; // Allow empty

      // IPv4 validation
      const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

      // IPv6 validation (simplified)
      const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:)$/;

      return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    };

    const handleSave = () => {
      if (!isValidIPAddress(editValue)) {
        setError('Invalid IP address format');
        return;
      }
      onUpdate(editValue);
      setError('');
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        setEditValue(ipValue);
        setError('');
        setIsEditing(false);
      }
    };

    if (isEditing) {
      return (
        <div className="w-full">
          <Input
            type="text"
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              setError('');
            }}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder="192.168.1.1"
            className={`h-8 text-xs border-0 focus:ring-0 focus:outline-none px-2 ${error ? 'border-red-500 border' : ''
              }`}
          />
          {error && (
            <div className="text-xs text-red-500 px-2 mt-1">{error}</div>
          )}
        </div>
      );
    }

    return (
      <div
        className="w-full px-2 py-1 cursor-pointer hover:bg-muted min-h-[32px] flex items-center"
        onDoubleClick={() => {
          setIsEditing(true);
          setEditValue(ipValue);
        }}
      >
        {ipValue ? (
          <span className="text-xs">{ipValue}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Enter IP address</span>
        )}
      </div>
    );
  }

  // Handle SOCIAL MEDIA type - Inline editing with double-click
  /* if (field.type === 'social-media') {
    const socialValue = (value as string) || '';
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(socialValue);

    const handleSave = () => {
      onUpdate(editValue);
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        setEditValue(socialValue);
        setIsEditing(false);
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      if (!isEditing && socialValue) {
        // Open social media link in new tab
        let url = socialValue;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        window.open(url, '_blank');
        e.stopPropagation();
      }
    };

    if (isEditing) {
      return (
        <div className="w-full">
          <Input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder="https://twitter.com/username"
            className="h-8 text-xs border-0 focus:ring-0 focus:outline-none px-2"
          />
        </div>
      );
    }

    return (
      <div
        className="w-full px-2 py-1 cursor-pointer hover:bg-muted min-h-[32px] flex items-center group"
        onDoubleClick={() => {
          setIsEditing(true);
          setEditValue(socialValue);
        }}
        onClick={handleClick}
      >
        {socialValue ? (
          <span className="text-xs text-blue-600 hover:underline flex items-center gap-1 text-left w-full truncate">
            {socialValue}
          </span>
        ) : (
          <div className="w-full flex justify-center">
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    );
  } */

  // Handle AUTO NUMBER type - Auto-generated, read-only
  /* if (field.type === 'auto-number') {
    const autoNumValue = (value as number) || 0;
    const prefix = field.prefix || '';

    const displayValue = prefix ? `${prefix}${autoNumValue}` : `${autoNumValue}`;

    return (
      <div className="w-full px-2 py-1 min-h-[32px] flex items-center">
        <span
          className="text-xs text-foreground"
        >
          {displayValue}
        </span>
      </div>
    );
  } */

  // Handle T-SHIRT SIZE type - Dropdown with colored dots
  if (field.type === 'tshirt-size') {
    const selectedValue = value as string;
    const options = (field.options as any[]) || [];

    const selectedOption = options.find(opt => (opt.value ?? opt.name) === selectedValue);

    return (
      <Select
        value={selectedValue || ''}
        onValueChange={(newValue) => onUpdate(newValue)}
      >
        <SelectTrigger data-testid={`custom-field-tshirt-trigger-${field.id}`} className="h-8 w-full border-0 focus:ring-0">
          <SelectValue placeholder="Select size">
            {selectedOption && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedOption.color }}
                />
                <span className="text-xs">{selectedOption.value ?? selectedOption.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent data-testid={`custom-field-tshirt-content-${field.id}`}>
          {options.map((option, idx) => {
            const label = option.value ?? option.name;
            return (
              <SelectItem data-testid={`custom-field-tshirt-option-${label}`} key={label ?? idx} value={label}>
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

  // Handle FORMULA type - Calculate based on expression
  if (field.type === 'formula') {
    const expression = field.expression;

    if (!expression || !task) {
      return (
        <div className="w-full px-2 py-1 text-xs text-muted-foreground">
          {!expression ? 'No formula defined' : 'Loading...'}
        </div>
      );
    }

    // Get values from other fields
    const field1Value = typeof task.customFieldValues?.[expression.field1] === 'number'
      ? task.customFieldValues[expression.field1] as number
      : parseFloat(task.customFieldValues?.[expression.field1] as string) || 0;

    const field2Value = typeof task.customFieldValues?.[expression.field2] === 'number'
      ? task.customFieldValues[expression.field2] as number
      : parseFloat(task.customFieldValues?.[expression.field2] as string) || 0;

    // Calculate result
    let result = 0;
    switch (expression.operator) {
      case '+':
        result = field1Value + field2Value;
        break;
      case '-':
        result = field1Value - field2Value;
        break;
      case '*':
        result = field1Value * field2Value;
        break;
      case '/':
        result = field2Value !== 0 ? field1Value / field2Value : 0;
        break;
    }

    // Format result
    const formattedResult = Number.isInteger(result)
      ? result.toString()
      : result.toFixed(2);

    return (
      <div className="w-full px-2 py-1 min-h-[32px] flex items-center">
        <span className="text-xs font-medium text-foreground">
          {formattedResult}
        </span>
      </div>
    );
  }

  // Handle FIELD DIFFERENCE type - Calculate difference between fields
  if (field.type === 'field-difference') {
    const difference = field.difference;
    const relatedTo = field.relatedTo;
    const outputFormat = field.outputFormat;

    if (!difference || !task || !relatedTo) {
      return (
        <div className="w-full px-2 py-1 text-xs text-muted-foreground">
          {!difference ? 'No fields defined' : 'Loading...'}
        </div>
      );
    }

    if (relatedTo === 'date') {
      // Get date values (built-in or custom fields)
      const getDateValue = (fieldId: string): Date | null => {
        // Check built-in date fields first
        const builtInFields: Record<string, any> = {
          'createdAt': (task as any).createdAt,
          'completedOn': (task as any).completedOn,
          'startDate': (task as any).startDate,
          'endDate': (task as any).endDate,
        };

        if (builtInFields[fieldId]) {
          return new Date(builtInFields[fieldId]);
        }

        // Check custom fields
        const customValue = task.customFieldValues?.[fieldId];
        return customValue ? new Date(customValue as string) : null;
      };

      const date1 = getDateValue(difference.field1);
      const date2 = getDateValue(difference.field2);

      if (!date1 || !date2) {
        return (
          <div className="w-full px-2 py-1 text-xs text-muted-foreground">
            Missing date values
          </div>
        );
      }

      // Calculate difference in milliseconds
      const diffMs = Math.abs(date2.getTime() - date1.getTime());

      let formattedResult: string;

      if (outputFormat === 'hours') {
        // Format as HH:MM:SS
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        formattedResult = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      } else {
        // Format as days
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        formattedResult = `${days} day${days !== 1 ? 's' : ''}`;
      }

      return (
        <div className="w-full px-2 py-1 min-h-[32px] flex items-center">
          <span className="text-xs font-medium text-foreground">
            {formattedResult}
          </span>
        </div>
      );
    } else if (relatedTo === 'number') {
      // Get number values from custom fields
      const field1Value = typeof task.customFieldValues?.[difference.field1] === 'number'
        ? task.customFieldValues[difference.field1] as number
        : parseFloat(task.customFieldValues?.[difference.field1] as string) || 0;

      const field2Value = typeof task.customFieldValues?.[difference.field2] === 'number'
        ? task.customFieldValues[difference.field2] as number
        : parseFloat(task.customFieldValues?.[difference.field2] as string) || 0;

      // Calculate absolute difference
      const result = Math.abs(field1Value - field2Value);

      // Format result
      const formattedResult = Number.isInteger(result)
        ? result.toString()
        : result.toFixed(2);

      return (
        <div className="w-full px-2 py-1 min-h-[32px] flex items-center">
          <span className="text-xs font-medium text-foreground">
            {formattedResult}
          </span>
        </div>
      );
    }

    return (
      <div className="w-full px-2 py-1 text-xs text-muted-foreground">
        Invalid configuration
      </div>
    );
  }


  // Handle LABEL type (multi-select with colors)
  if (field.type === 'label') {
    const options = normalizeOptions(field.options || []);
    const selectedLabels = (value as string[]) || [];

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="w-full h-full">
          <button
            data-testid={`custom-field-label-trigger-${field.id}`}
            className="w-full h-full flex items-center justify-center rounded-none transition-opacity hover:opacity-90 overflow-hidden min-h-[32px] p-0"
          >
            {selectedLabels.length > 0 ? (
              <div className="flex w-full h-full">
                {selectedLabels.map((labelVal, idx) => {
                  const opt = options.find(o => o.value === labelVal);
                  return (
                    <div
                      key={idx}
                      className="flex-1 h-full flex items-center justify-center text-white text-[10px] font-medium px-2 border-r border-white/20 last:border-r-0 min-w-0"
                      style={{ backgroundColor: opt?.color ?? '#c4c4c4' }}
                      title={labelVal}
                    >
                      <span className="truncate">{labelVal}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                <ListChecks className="h-4 w-4" />
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          data-testid={`custom-field-label-content-${field.id}`}
          className="p-4 w-[200px] space-y-1"
          align="center"
        >
          {options.map(option => {
            const isSelected = selectedLabels.includes(option.value);
            return (
              <DropdownMenuItem
                data-testid={`custom-field-label-option-${option.value}`}
                key={option.value}
                onSelect={e => {
                  e.preventDefault(); // Keep menu open for multi-select
                  const newValue = isSelected
                    ? selectedLabels.filter(o => o !== option.value)
                    : [...selectedLabels, option.value];
                  onUpdate(newValue);
                }}
                className="p-0 focus:bg-transparent"
              >
                <div
                  className="w-full h-9 flex items-center justify-center rounded-xs text-white text-xs font-medium transition-opacity hover:opacity-90 px-3 relative"
                  style={{ backgroundColor: option.color || '#c4c4c4' }}
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
            <div className="p-2 text-xs text-muted-foreground text-center">No labels available</div>
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

  if (field.type === 'select-one') {
    const options = normalizeOptions(field.options || []);
    const currentValue = (value as string) || '';

    // Find selected option object to display color
    const selectedOption = options.find(o => o.value === currentValue);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="w-full h-full">
          <button
            data-testid={`custom-field-select-one-trigger-${field.id}`}
            className={cn(
              "w-full h-full flex items-center justify-center text-xs font-medium transition-opacity hover:opacity-90 overflow-hidden border-none bg-transparent outline-none p-0",
              currentValue ? "text-white" : "text-muted-foreground"
            )}
            style={currentValue ? { backgroundColor: selectedOption?.color || '#c4c4c4' } : {}}
          >
            <span className="truncate w-full text-center flex items-center justify-center">
              {currentValue || <CheckCircle2 className="h-4 w-4" />}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          data-testid={`custom-field-select-one-content-${field.id}`}
          className="p-4 w-[200px] space-y-1"
          align="center"
        >
          {options.map(option => {
            const isSelected = currentValue === option.value;
            return (
              <DropdownMenuItem
                data-testid={`custom-field-select-one-option-${option.value}`}
                key={option.value}
                onSelect={() => onUpdate(option.value)}
                className="p-0 focus:bg-transparent"
              >
                <div
                  className="w-full h-9 flex items-center justify-center rounded-xs text-white text-xs font-medium transition-opacity hover:opacity-90 px-3"
                  style={{ backgroundColor: option.color || '#c4c4c4' }}
                >
                  <span className="truncate w-full text-center">
                    {option.value}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })}
          {options.length === 0 && (
            <div className="p-2 text-xs text-muted-foreground text-center">No options available</div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-testid={`custom-field-select-one-clear-${field.id}`}
            onSelect={() => onUpdate('')}
            className="p-0 h-9 text-xs justify-center bg-muted focus:bg-muted rounded-xs"
          >
            Clear
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // ✅ FIX for select-many
  if (field.type === 'select-many') {
    const options = normalizeOptions(field.options as (string | FieldOption)[]);
    const selectedOptions = (value as string[]) || [];


    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="w-full h-full">
          <button
            data-testid={`custom-field-select-many-trigger-${field.id}`}
            className="w-full h-full flex items-center justify-center overflow-hidden transition-opacity hover:opacity-90 cursor-pointer p-0 border-none bg-transparent outline-none"
          >
            {selectedOptions.length > 0 ? (
              <div className="flex w-full h-full">
                {selectedOptions.map((optVal, idx) => {
                  const opt = options.find(o => o.value === optVal);
                  return (
                    <div
                      key={idx}
                      className="flex-1 h-full flex items-center justify-center text-white text-[10px] font-medium px-2 border-r border-white/20 last:border-r-0 min-w-0"
                      style={{ backgroundColor: opt?.color ?? '#c4c4c4' }}
                      title={optVal}
                    >
                      <span className="truncate">{optVal}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                <SquareCheck className="h-4 w-4" />
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          data-testid={`custom-field-select-many-content-${field.id}`}
          className="p-4 w-[200px] space-y-1"
          align="center"
        >
          {options.map(option => {
            const isSelected = selectedOptions.includes(option.value);
            return (
              <DropdownMenuItem
                data-testid={`custom-field-select-many-option-${option.value}`}
                key={option.value}
                onSelect={e => {
                  e.preventDefault(); // Keep menu open for multi-select
                  const newValue = isSelected
                    ? selectedOptions.filter(o => o !== option.value)
                    : [...selectedOptions, option.value];
                  onUpdate(newValue);
                }}
                className="p-0 focus:bg-transparent"
              >
                <div
                  className="w-full h-9 flex items-center justify-center rounded-xs text-white text-xs font-medium transition-opacity hover:opacity-90 px-3 relative"
                  style={{ backgroundColor: option.color || '#c4c4c4' }}
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
            <div className="p-2 text-xs text-muted-foreground text-center">No options available</div>
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

  if (field.type === 'location') {
    const currentValue = (value as string) || '';
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(currentValue);

    const handleBlur = () => {
      if (localValue === currentValue) {
        setIsEditing(false);
        return;
      }
      onUpdate(localValue);
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBlur();
      }
      if (e.key === 'Escape') {
        setLocalValue(currentValue);
        setIsEditing(false);
      }
    };

    return (
      <div className="w-full">
        {isEditing ? (
          <div className="relative">
            <Input
              data-testid={`custom-field-location-input-${field.id}`}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Add a location..."
              className="h-8 text-xs pr-8 text-left"
              autoFocus
            />
            <MapPin className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            className="h-8 flex items-center justify-center px-2 hover:bg-muted rounded cursor-pointer group"
          >
            <span className={cn("text-xs truncate w-full", currentValue ? 'text-left text-foreground' : 'text-center text-muted-foreground')}>
              {currentValue || <MapPin className="h-4 w-4 text-muted-foreground mx-auto" />}
            </span>
            {currentValue && <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </div>
        )}
      </div>
    );
  }

  return null;
}
