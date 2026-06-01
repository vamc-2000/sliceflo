'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LinkEntityType } from './link-entity-adapters'
import { useLinkEntityAdapter } from './link-entity-adapters'
import { useEffect, useMemo, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace-store'

interface Props {
    open: boolean
    onClose: () => void
    type: LinkEntityType
    teamId?: string
    teamProjectIds?: string[]
    onCreateNew?: () => void
}

export default function LinkEntityDialog({ open, onClose, type, teamId, teamProjectIds, onCreateNew }: Props) {
    const { title, entities, fetch, link } = useLinkEntityAdapter(type, teamId, teamProjectIds)
    const { workspaceMembers, fetchWorkspaceMembers, currentWorkspace } = useWorkspaceStore()
    const router = useRouter()

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [query, setQuery] = useState('')
    const [isAssigning, setIsAssigning] = useState(false)

    useEffect(() => {
        if (open) {
            fetch()
            if (currentWorkspace?.id) {
                fetchWorkspaceMembers(currentWorkspace.id)
            }
        }
    }, [open, currentWorkspace?.id, fetch, fetchWorkspaceMembers])

    const workspaceMemberMap = useMemo(() => {
        return new Map(
            workspaceMembers.map((member) => [member.userId, member])
        )
    }, [workspaceMembers])

    const getOwnerAvatar = (entity: any) => {
        const leaderId = entity.leader
        if (!leaderId) return ''
        const member = workspaceMemberMap.get(leaderId)
        console.log('workspaceMembers', workspaceMembers)
        console.log('leaderId', leaderId)
        console.log('matched member', member)
        return member?.avatar || member?.profilePicture || ''
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const filteredEntities = entities.filter(e =>
        e.name.toLowerCase().includes(query.toLowerCase())
    )

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg w-full h-[380px] flex flex-col">
                <DialogHeader className="flex-none">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 w-full flex-1 flex flex-col overflow-hidden">
                    {/* Input */}
                    <div className="relative w-full flex-none">
                        <Input
                            placeholder={`Search for ${type} name`}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="pr-10 placeholder:text-muted-foreground text-foreground w-full border border-border rounded-md h-10 bg-background"
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-muted-foreground" />
                        </span>
                    </div>

                    {/* Table */}
                    <div className="w-full border border-border rounded-md relative flex flex-col overflow-hidden bg-card">
                        {/* Table Header */}
                        <div className="grid grid-cols-[40px_1fr_60px] px-3 py-2 text-sm font-medium items-center relative z-10 text-foreground border-b border-border">
                            <div />
                            <div className="pr-2">
                                {type === 'project' ? 'Projects' : type === 'goal' ? 'Goals' : 'Portfolios'}
                            </div>
                            <div className="grid place-items-center pl-0 pr-4">Owner</div>
                        </div>

                        {/* Table Rows */}
                        <div className="h-[132px] overflow-y-auto relative z-10 text-sm text-muted-foreground">
                            {filteredEntities.length === 0 ? (
                                <div className="h-full flex items-center justify-center italic">
                                    No {type === 'project' ? 'projects' : type === 'goal' ? 'goals' : 'portfolios'} found
                                </div>
                            ) : (
                                filteredEntities.map(entity => (
                                    <div
                                        key={entity.id}
                                        className="grid grid-cols-[40px_1fr_60px] h-11 items-center px-3 border-t first:border-t-0 relative z-10"
                                    >
                                        <div className="flex items-center">
                                            <Checkbox
                                                checked={selectedIds.has(entity.id)}
                                                onCheckedChange={() => toggleSelect(entity.id)}
                                            />
                                        </div>
                                        <div className="pr-2 h-full flex items-center text-sm">
                                            <span className="truncate">{entity.name}</span>
                                        </div>
                                        <div className="grid place-items-center pl-2">
                                            {(() => {
                                                const member = entity.leader ? workspaceMemberMap.get(entity.leader) : null
                                                return (
                                                    <Avatar className="h-6 w-6">
                                                        {member?.profilePicture ? (
                                                            <AvatarImage src={member.profilePicture} />
                                                        ) : null}
                                                        <AvatarFallback>
                                                            {member?.name?.charAt(0)?.toUpperCase() || '—'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between pt-4 mt-auto flex-none">
                    <Button
                        variant="outline"
                        className='border-border text-muted-foreground w-40 hover:bg-primary hover:text-primary-foreground'
                        onClick={() => {
                            if (onCreateNew) {
                                onCreateNew()
                            } else {
                                router.push(`/teams/${teamId}/create-${type}`)
                            }
                        }}
                    >
                        Create new {type}
                    </Button>

                    <Button
                        disabled={selectedIds.size === 0 || isAssigning}
                        onClick={async () => {
                            try {
                                setIsAssigning(true)
                                for (const id of selectedIds) {
                                    await link(id)
                                }
                                toast("success", {
                                    title: "Success",
                                    description: `Successfully assigned ${selectedIds.size} ${type === 'project' ? 'project(s)' : type === 'goal' ? 'goal(s)' : 'portfolio(s)'}.`
                                })
                                onClose()
                            } catch (error) {
                                console.error(error)
                                toast("error", {
                                    title: "Error",
                                    description: `Failed to assign ${type}.`
                                })
                            } finally {
                                setIsAssigning(false)
                            }
                        }}
                        className='bg-primary text-primary-foreground hover:bg-primary/90 w-40'
                    >
                        {isAssigning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {`Assigning ${type}`}
                            </>
                        ) : (
                            `Assign ${type}`
                        )}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    )
}
