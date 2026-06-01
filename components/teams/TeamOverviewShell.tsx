// TeamOverviewShell.tsx
'use client'

import TeamOverview from './TeamOverview'

interface TeamOverviewShellProps {
  team?: any; // Match the type from your store
}

const TeamOverviewShell = ({ team }: TeamOverviewShellProps) => {
  console.log("TeamOverviewShell received team:", team)
  return (
    <div 
      data-testid="team-overview-shell"
      className="h-full overflow-hidden"
    >
      <TeamOverview team={team} />
    </div>
  )
}

export default TeamOverviewShell
