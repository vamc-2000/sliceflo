import Image from 'next/image'
import { Plus, Triangle } from 'lucide-react'
import { useRouter } from "next/navigation";

interface EmptyProjectsStateProps {
  teamId?: string
  onAddExistingProject?: () => void
  onCreateNewProject?: () => void
}

const EmptyProjectsState = ({ teamId, onAddExistingProject, onCreateNewProject }: EmptyProjectsStateProps) => {
  const router = useRouter();

  return (
    <div
      data-testid="empty-projects-state"
      className="flex items-center gap-25"
    >
      <Image
        src="/images/teams/projects.svg"
        alt="Projects illustration"
        width={120}
        height={120}
        className="object-contain"
      />
      <button
        data-testid="teamoverview-create-project-btn"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={() => {
          if (onCreateNewProject) {
            onCreateNewProject();
          } else {
            router.push(`/teams/${teamId}/create-project`);
          }
        }}
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
          <Plus size={18} />
        </span>
        <span className='text-xs'>Create new Project</span>
      </button>
      <button
        data-testid="teamoverview-add-existing-project-btn"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={onAddExistingProject}
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
          <Triangle size={17} />
        </span>
        <span className='text-xs'>Add existing Project</span>
      </button>
    </div>
  )
};

export default EmptyProjectsState;
