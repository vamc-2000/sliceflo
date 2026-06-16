import Image from 'next/image'
import { Plus, Triangle } from 'lucide-react'
import { useRouter } from "next/navigation";

interface EmptyPortfolioStateProps {
  teamId?: string
  onAddExistingPortfolio?: () => void
  onCreateNewPortfolio?: () => void
}

const EmptyPortfolioState = ({ teamId, onAddExistingPortfolio, onCreateNewPortfolio }: EmptyPortfolioStateProps) => {
  const router = useRouter();

  return (
    <div
      data-testid="empty-portfolio-state"
      className="flex items-center gap-25"
    >
      <Image
        src="/images/teams/portfolios.svg"
        alt="Portfolios illustration"
        width={120}
        height={120}
        className="object-contain"
      />
      <button
        data-testid="teamoverview-create-portfolio-btn"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-left cursor-pointer"
        onClick={() => {
          if (onCreateNewPortfolio) {
            onCreateNewPortfolio();
          } else {
            router.push(`/teams/${teamId}/create-portfolio`);
          }
        }}
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
          <Plus size={18} />
        </span>
        <span className='text-xs'>Create new Portfolio</span>
      </button>
      <button
        data-testid="teamoverview-add-existing-portfolio-btn"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-left cursor-pointer"
        onClick={onAddExistingPortfolio}
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
          <Triangle size={17} />
        </span>
        <span className='text-xs'>Add existing Portfolio</span>
      </button>
    </div>
  )
};

export default EmptyPortfolioState;
