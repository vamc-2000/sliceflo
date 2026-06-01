'use client'

import { useParams } from 'next/navigation'
import { CreatePortfolio } from '@/components/portfolios/CreatePortfolio'
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function CreatePortfolioPage() {
    const params = useParams()
    const teamId = params?.teamId as string

    return (
        <div className="flex flex-col overflow-hidden h-full">
            <div className="w-full  border-b">
                <Breadcrumbs />
            </div>
            <div className="h-full overflow-auto">
                <CreatePortfolio teamId={teamId} />
            </div>
        </div>
    )
}
