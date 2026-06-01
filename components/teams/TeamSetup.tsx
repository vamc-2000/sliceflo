import { CreateNewTeam } from './CreateNewTeam'
import { useState } from 'react'
import TeamSpaceSidebar from './TeamSpaceSidebar'

const TeamSetup = () => {
  const [showCreateTeam, setShowCreateTeam] = useState(false)

  const handleTeamCreationComplete = () => {
    setShowCreateTeam(false)
  
  }

  const handleBackToMain = () => {
    setShowCreateTeam(false)
  }

  return (
    <>
      {!showCreateTeam ? (
        <TeamSpaceSidebar onCreateTeam={() => setShowCreateTeam(true)} allTeams={[]} deleteTeam={function (id: string): void {
                  throw new Error('Function not implemented.')
              } } renameTeam={function (id: string, newName: string): void {
                  throw new Error('Function not implemented.')
              } } />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <CreateNewTeam 
            initialStep="setup"
            onComplete={handleTeamCreationComplete}
            onBack={handleBackToMain}
          />
        </div>
      )}
    </>
  )
}


export default TeamSetup
