'use client'

import { useParams } from 'next/navigation'
import { GoalCreateForm } from "@/components/Goals/GoalCreateForm";

export default function CreateTeamGoalPage() {
    const params = useParams()
    const teamId = params?.teamId as string

    return <GoalCreateForm teamId={teamId} />
}
