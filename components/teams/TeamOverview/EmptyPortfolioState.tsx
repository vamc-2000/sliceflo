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
      className="flex items-center gap-4"
    >
      <Image
        src="/images/teams/portfolios.svg"
        alt="Portfolios illustration"
        width={120}
        height={120}
        className="object-contain"
      />
      <div className="flex flex-col gap-2">
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
          <span className="flex items-center justify-center w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
            <Plus size={18} />
          </span>
          <span className='text-xs'>Create new Portfolio</span>
        </button>
        <button
          data-testid="teamoverview-add-existing-portfolio-btn"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-left cursor-pointer"
          onClick={onAddExistingPortfolio}
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-full border border-dashed border-muted-foreground/40 bg-muted">
            <Triangle size={17} />
          </span>
          <span className='text-xs'>Add existing Portfolio</span>
        </button>
      </div>
    </div>
  )
};

export default EmptyPortfolioState;
