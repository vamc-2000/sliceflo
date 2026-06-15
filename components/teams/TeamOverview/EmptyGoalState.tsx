import Image from 'next/image'
import { Plus, Triangle } from 'lucide-react'
import { useRouter } from "next/navigation";

interface EmptyGoalsStateProps {
    teamId?: string
    onAddExistingGoal?: () => void
}

const EmptyGoalsState = ({ teamId, onAddExistingGoal }: EmptyGoalsStateProps) => {
    const router = useRouter();

    return (
        <div className="flex items-center gap-4">
            <Image
                src="/images/teams/GoalsLogo.svg"
                alt="Goals illustration"
                width={120}
                height={120}
                className="object-contain"
            />
            <div className="flex flex-row gap-52 items-center">
                <button
                    data-testid="teamoverview-create-goal-btn"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-left cursor-pointer"
                    onClick={() => router.push(`/teams/${teamId}/create-goal`)}
                >
                    <span className="flex items-center justify-center w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
                        <Plus size={18} />
                    </span>
                    <span className='text-xs'>Create new Goal</span>
                </button>
                <button
                    data-testid="teamoverview-add-existing-goal-btn"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-left cursor-pointer"
                    onClick={onAddExistingGoal}
                >
                    <span className="flex items-center justify-center w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
                        <Triangle size={17} />
                    </span>
                    <span className='text-xs'>Add existing Goal</span>
                </button>
            </div>
        </div>
    )
};

export default EmptyGoalsState;
