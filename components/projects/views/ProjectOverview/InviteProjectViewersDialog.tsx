'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { X, Copy, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useProjectsStore } from '@/stores/projects-store';
import { inviteWorkspaceMembers } from '@/lib/api/workspace-api';
import { toast } from "@/components/ui/sonner";

interface InviteProjectViewersDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  existingViewerIds: string[];
  onViewersUpdate?: () => void;
}

export default function InviteProjectViewersDialog({
  open,
  onClose,
  projectId,
  projectName,
  existingViewerIds = [],
  onViewersUpdate,
}: InviteProjectViewersDialogProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<{ email: string }[]>([{ email: '' }]);
  const [isLoading, setIsLoading] = useState(false);

  const { workspaceMembers, fetchWorkspaceMembers, currentWorkspace } = useWorkspaceStore();
  const { addViewersToProject } = useProjectsStore();

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/project/${projectId}`;

  useEffect(() => {
    if (open && currentWorkspace?.id) fetchWorkspaceMembers(currentWorkspace.id);
  }, [open, currentWorkspace?.id]);

  useEffect(() => {
    if (!open) { setSelected([]); setSearch(''); setRows([{ email: '' }]); }
  }, [open]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const allUsers = useMemo(() => {
    return workspaceMembers.map((u: any) => {
      const isAlready = existingViewerIds.includes(u.userId);
      const initials = (u.name || '').trim().split(' ').map((n: string) => n[0]).join('').toUpperCase();
      return {
        id: String(u.userId),
        name: u.name,
        email: u.email,
        username: `@${u.name?.split(' ')[0]?.toLowerCase() ?? ''}`,
        initials,
        avatar: u.profilePicture || null,
        alreadyAdded: isAlready,
      };
    });
  }, [workspaceMembers, existingViewerIds]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allUsers.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [search, allUsers]);

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const canAdd = selected.length > 0 || rows.some(r => r.email && isValidEmail(r.email));

  const copyInviteLink = async () => {
    try { await navigator.clipboard.writeText(inviteLink); toast('success', { title: 'Link copied!' }); }
    catch { toast('error', { title: 'Failed to copy' }); }
  };

  const handleAdd = async () => {
    if (!currentWorkspace?.id) return;
    setIsLoading(true);
    try {
      if (selected.length > 0) {
        await addViewersToProject(projectId, selected);
      }

      const validEmails = rows.filter(r => r.email.trim() && isValidEmail(r.email)).map(r => r.email.toLowerCase());
      if (validEmails.length > 0) {
        await inviteWorkspaceMembers(currentWorkspace.id, validEmails);
        await fetchWorkspaceMembers(currentWorkspace.id);
        await new Promise(resolve => setTimeout(resolve, 500));
        const fresh = useWorkspaceStore.getState().workspaceMembers;
        const invited = fresh.filter(u => validEmails.includes(u.email.toLowerCase()));
        if (invited.length > 0) {
          await addViewersToProject(projectId, invited.map(u => String(u.userId)));
        }
      }

      toast('success', { title: 'Viewers added successfully!' });
      onViewersUpdate?.();
      onClose();
    } catch {
      toast('error', { title: 'Failed to add viewers' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[60vw] w-full p-0 gap-0 bg-card overflow-hidden border-0 border-b-[5px] border-primary rounded-lg">
        <div className="flex h-[450px]">
          {/* Left Panel */}
          <div className="w-1/2 p-6 flex flex-col overflow-y-auto">
            <DialogTitle className="text-sm font-bold text-foreground mb-6">
              {/* Invite viewers to {projectName}: */}
              Invite viewers to your Project :
            </DialogTitle>

            <div className="mb-6">
              <label className="text-xs mb-2 block">Invite with Shareable link</label>
              <div className="flex items-center border border-input rounded-lg px-3 h-9 bg-muted">
                <span className="text-xs text-muted-foreground truncate flex-1">{inviteLink}</span>
                <Button variant="ghost" size="icon" onClick={copyInviteLink} className="h-7 w-7 hover:bg-muted/80 rounded">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 mt-2">
              <span className="text-muted-foreground font-medium text-xs">Invite with email</span>
              {rows.map((row, index) => (
                <div key={index} className="w-full space-y-1">
                  <div className="flex items-center gap-2 w-full">
                    <div className={`flex items-center flex-1 p-1 rounded-md bg-background border ${row.email && !isValidEmail(row.email) ? 'border-red-500' : 'border-input'}`}>
                      <Input
                        placeholder="Enter email address"
                        value={row.email}
                        onChange={(e) => { const u = [...rows]; u[index].email = e.target.value; setRows(u); }}
                        className={`border-0 shadow-none focus-visible:ring-0 flex-1 ${row.email && !isValidEmail(row.email) ? 'text-red-600' : ''}`}
                      />
                      <div className="w-[120px] flex items-center justify-center rounded-md bg-muted h-8 px-3 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">Viewer</span>
                      </div>
                    </div>
                    {rows.length > 1 && (
                      <button onClick={() => setRows(rows.filter((_, i) => i !== index))} className="p-1 hover:bg-muted rounded">
                        <X size={18} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  {row.email && !isValidEmail(row.email) && <p className="text-xs text-red-500 ml-2">Invalid email address</p>}
                </div>
              ))}
              <div className="flex justify-end">
                <span className="text-xs text-primary cursor-pointer hover:underline" onClick={() => setRows([...rows, { email: '' }])}>
                  + Add more
                </span>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button onClick={handleAdd} disabled={!canAdd || isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-8 py-1.5">
                {isLoading ? 'Adding...' : '+ Add to project'}
              </Button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-1/2 flex flex-col border-l border-border overflow-hidden bg-background">
            <div className="px-3 py-4 border-b border-border flex items-center gap-4">
              <h3 className="text-xs font-semibold text-foreground">Workspace Members</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs w-32" />
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4">
                {filtered.map((u) => (
                  <div
                    key={u.id}
                    className={`flex items-center gap-3 py-3 px-2 border-b border-border last:border-0 ${u.alreadyAdded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}`}
                    onClick={() => !u.alreadyAdded && toggle(u.id)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.includes(u.id) || u.alreadyAdded} onCheckedChange={() => !u.alreadyAdded && toggle(u.id)} disabled={u.alreadyAdded} />
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.avatar ?? ''} alt={u.name} />
                      <AvatarFallback className="bg-purple-100 text-purple-600">{u.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.username}</p>
                    </div>
                    {u.alreadyAdded && <span className="text-xs text-muted-foreground">Already viewer</span>}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}