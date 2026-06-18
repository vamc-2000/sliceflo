'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Smile, ArrowUp, Paperclip } from 'lucide-react';
import EmojiPicker, { EmojiStyle, EmojiClickData } from 'emoji-picker-react';

import { useProfileStore } from '@/stores/profile-store';
import { useAuthStore } from '@/stores/auth-store';


import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import AttachFileModal from './AttachFileModal';
import { useMentions } from '@/hooks/useMentions';

import { getAvatarColor, getInitials } from '@/utils/avatar-utils';

interface MentionableMember {
  id: string;
  name: string;
  profilePictureUrl?: string;
}

interface NewThreadInputProps {
  onNewThread: (data: {
    text: string;
    mentions: { userId: string; username: string; position: number }[];
    files?: File[];
  }) => Promise<void>;
  mentionableMembers: MentionableMember[];
  initialText?: string;
  'data-testid'?: string;
}

export default function NewThreadInput({
  onNewThread,
  mentionableMembers,
  initialText = '',
  'data-testid': testId,
}: NewThreadInputProps) {
  const { user } = useAuthStore();

  const profilePictureUrl = useProfileStore((state) => state.user?.profilePictureUrl);

  const [newThreadText, setNewThreadText] = useState(initialText);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [showAttachFile, setShowAttachFile] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialText) {
      setNewThreadText(initialText);
      // Focus textarea and position cursor at end
      if (inputRef.current) {
        inputRef.current.focus();
        const len = initialText.length;
        // Small delay to ensure render is completed
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(len, len);
            // trigger auto-resize
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
          }
        }, 50);
      }
    }
  }, [initialText]);

  const {
    showMentionList,
    filteredMembers,
    mentionIndex,
    mentionPosition,
    onChange,
    onKeyDown,
    onSelectMember: onMentionSelect,
  } = useMentions({
    value: newThreadText,
    setValue: setNewThreadText,
    inputRef,
    mirrorRef,
    members: mentionableMembers,
  });

  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(user?.name);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setEmojiOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewThread = async () => {
    if (!newThreadText.trim() && attachedFiles.length === 0) return;

    const text = newThreadText.trim();
    const files = attachedFiles.length > 0 ? [...attachedFiles] : undefined;

    const mentions: { userId: string; username: string; position: number }[] = [];
    mentionableMembers.forEach((member) => {
      const regex = new RegExp(`@${member.name}`, "g");
      let match;
      while ((match = regex.exec(newThreadText)) !== null) {
        mentions.push({
          userId: member.id,
          username: member.name,
          position: match.index,
        });
      }
    });

    setNewThreadText('');
    setAttachedFiles([]);

    // Reset textarea height back to single row
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      await onNewThread({ text, mentions, files });
    } catch (error) {
      console.error('Failed to send thread:', error);
    }
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setNewThreadText((prev) => prev + emojiData.emoji);
  };

  return (
    <Card data-testid={testId} className="rounded-xl bg-muted p-4 shadow-sm">
      {/* <div className="flex items-center gap-2 rounded-lg bg-[#F5F6FA] p-2"> */}
      <div className="relative flex items-center gap-2 rounded-lg bg-background p-2">

        {/* Avatar - aligned to bottom */}
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarImage src={profilePictureUrl} alt="Profile" />
          <AvatarFallback className={`${getAvatarColor(user?.id || '')} text-[10px] font-semibold text-white`}>
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Textarea - auto-grows */}
        <div className="relative flex-1 min-w-0">
          <div
            ref={mirrorRef}
            className="pointer-events-none absolute invisible whitespace-pre-wrap break-words text-sm font-medium"
            style={{
              width: inputRef.current?.clientWidth,
              fontFamily: "inherit",
              lineHeight: "1.25rem",
              padding: "4px 12px",
            }}
          />

          <textarea
            ref={inputRef}
            value={newThreadText}
            rows={1}
            onChange={(e) => {
              onChange(e as any);
              // auto-resize
              const el = e.target as HTMLTextAreaElement;
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
            }}
            data-testid="input-new-thread"
            onKeyDown={(e) => {
              onKeyDown(e as any);
              if (e.key === 'Enter' && !e.shiftKey && !showMentionList) {
                e.preventDefault();
                handleNewThread();
              }
            }}
            placeholder="Create new thread"
            className="block box-border m-0 w-full resize-none overflow-hidden bg-transparent text-sm font-medium text-foreground
              placeholder:text-xs placeholder:font-semibold placeholder:text-muted-foreground
              border-none outline-none focus:outline-none shadow-none py-[4px] px-3 leading-5"
            style={{ minHeight: '1.75rem', maxHeight: '10rem' }}
          />
        </div>
        {showMentionList && filteredMembers.length > 0 && mentionPosition && createPortal(
          <div
            data-mention-dropdown="true"
            className="fixed z-50 w-64 max-h-64 overflow-auto rounded-xl border border-border bg-popover shadow-2xl pointer-events-auto"
            style={{
              left: mentionPosition.left,
              top: mentionPosition.top,
              transform: mentionPosition.isAbove ? "translateY(-100%)" : undefined,
            }}
          >
            {filteredMembers.map((m, idx) => (
              <button
                key={m.id}
                type="button"
                data-testid={`btn-mention-${m.id}`}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted ${idx === mentionIndex ? "bg-muted" : ""
                  }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onMentionSelect(m);
                }}
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={m.profilePictureUrl} alt={m.name} />
                  <AvatarFallback className={`${getAvatarColor(m.id)} text-white text-[10px]`}>
                    {getInitials(m.name)}
                  </AvatarFallback>
                </Avatar>
                <span>{m.name}</span>
              </button>
            ))}
          </div>,
          document.body
        )}

        {/* Attach file */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-testid="btn-attach-file-in-thread"
          onClick={() => setShowAttachFile(true)}
          className={`relative rounded-md transition-colors
            ${attachedFiles.length > 0
              ? 'bg-orange-500/20'
              : 'bg-muted'
            }`}
        >
          <Paperclip
            size={16}
            className={
              attachedFiles.length > 0
                ? 'text-[#FF8D28]'
                : 'text-[#8E8E93]'
            }
          />

          {attachedFiles.length > 0 && (
            // <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center px-1 text-[10px] font-semibold text-[#FF8D28]">
            <span className="absolute bottom-1 left-3/4 -translate-x-1/2 translate-y-1/8 text-[10px] font-semibold text-[#FF8D28]">
              {attachedFiles.length}
            </span>
          )}
        </Button>

        <AttachFileModal
          open={showAttachFile}
          onClose={() => setShowAttachFile(false)}
          onAttach={(files: File[]) => {
            setAttachedFiles(files);
            setShowAttachFile(false);
          }}
        />

        {/* Emoji picker */}
        <div className="relative" ref={emojiPickerRef}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-testid="btn-emoji-picker-in-thread"
            className="rounded-md bg-muted"
            onClick={() => setEmojiOpen((v) => !v)}
          >
            <Smile size={16} className="text-muted-foreground" />
          </Button>

          {emojiOpen && (
            <div className="absolute right-0 top-0 z-50 -translate-y-full translate-x-2 rounded-md bg-popover shadow-lg">
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                width={320}
                height={400}
                emojiStyle={EmojiStyle.NATIVE}
                lazyLoadEmojis
              />
            </div>
          )}
        </div>

        {/* Send */}
        <Button
          type="button"
          size="icon"
          data-testid="btn-send-thread"
          className="rounded-full bg-background group 
             hover:bg-primary transition-colors duration-200"
          onClick={handleNewThread}
        >
          <ArrowUp
            size={18}
            className="text-muted-foreground group-hover:text-primary-foreground transition-colors duration-200"
          />
        </Button>
      </div>
    </Card>
  );
}
