import { useMemo } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useProjectsStore } from '@/stores/projects-store';

export interface CombinedCustomField {
  id: string;
  name: string;
  type: 'select-one' | 'select-many';
  description?: string;
  options: string[];
  source: 'workspace' | 'project';
  required?: boolean;
}

export function useCustomFields(projectId: string): CombinedCustomField[] {
  const { currentWorkspace } = useWorkspaceStore();
  const { projects } = useProjectsStore();

  return useMemo(() => {
    // Get workspace-level fields (inherited by all projects)
    const workspaceFields: CombinedCustomField[] = 
      (currentWorkspace?.customFields || []).map(field => ({
        id: field.id,
        name: field.name,
        type: field.type as 'select-one' | 'select-many',
        description: field.description,
        options: field.options || [],
        source: 'workspace' as const,
        required: field.required,
      }));

    // Get project-specific fields
    const project = projects.find(p => p.id === projectId);
    const projectFields: CombinedCustomField[] = 
      (project?.customFields || []).map(field => ({
        id: field.id,
        name: field.name,
        type: field.type as 'select-one' | 'select-many',
        description: field.description,
        options: (field.options || []).map(opt => typeof opt === 'string' ? opt : opt.value),
        source: 'project' as const,
        required: field.required,
      }));

    // Combine both (workspace fields first, then project fields)
    return [...workspaceFields, ...projectFields];
  }, [currentWorkspace, projectId, projects]);
}
