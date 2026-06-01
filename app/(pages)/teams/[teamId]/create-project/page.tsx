'use client'

import { useParams } from 'next/navigation'
import { CreateProject } from '@/components/projects/CreateProject'
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function CreateProjectPage() {
    const params = useParams()
    const teamId = params?.teamId as string

    return (
        <div className="flex flex-col overflow-hidden h-full">
            <div className="w-full  border-b">
                <Breadcrumbs />
            </div>
            <div className="h-full overflow-auto">
                <CreateProject teamId={teamId} />
            </div>
        </div>
    )
}
