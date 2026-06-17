// components/projects/views/kanban-view/KanbanSettingsDropdown.tsx
'use client';

import { useState } from 'react';
import { Settings, Eye, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useKanbanSettingsStore } from '@/stores/kanban-settings-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useProjectsStore } from '@/stores/projects-store';

interface KanbanSettingsDropdownProps {
  projectId: string;
}

export const KanbanSettingsDropdown = ({ projectId }: KanbanSettingsDropdownProps) => {
  const { getTaskStatusConfigs } = useProjectsStore();
  const taskStatusConfigs = getTaskStatusConfigs(projectId);
  const { getSettings, updateCardSettings, toggleColumnVisibility } = useKanbanSettingsStore();

  const settings = getSettings(projectId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="kanban-settings-trigger">
          <Settings className="h-4 w-4" />
          View Settings
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-0 border-b-[5px] border-b-primary">
        <DropdownMenuLabel>Card Display</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={settings.cardSettings.showAvatar}
          onCheckedChange={(checked) =>
            updateCardSettings(projectId, { showAvatar: checked })
          }
          data-testid="kanban-settings-avatar-checkbox"
        >
          Show Assignee Avatar
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.cardSettings.showDates}
          onCheckedChange={(checked) =>
            updateCardSettings(projectId, { showDates: checked })
          }
          data-testid="kanban-settings-dates-checkbox"
        >
          Show Dates
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.cardSettings.showPriority}
          onCheckedChange={(checked) =>
            updateCardSettings(projectId, { showPriority: checked })
          }
          data-testid="kanban-settings-priority-checkbox"
        >
          Show Priority Badge
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={settings.cardSettings.showSubtasks}
          onCheckedChange={(checked) =>
            updateCardSettings(projectId, { showSubtasks: checked })
          }
          data-testid="kanban-settings-subtasks-checkbox"
        >
          Show Subtask Count
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Column Visibility
        </DropdownMenuLabel>

        {taskStatusConfigs.map((config) => (
          <DropdownMenuCheckboxItem
            key={config._id}
            checked={!settings.hiddenColumns.includes(config.label)}
            onCheckedChange={() => toggleColumnVisibility(projectId, config.label)}
            data-testid={`kanban-settings-column-visibility-${config.label}`}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              {config.label}
            </div>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
