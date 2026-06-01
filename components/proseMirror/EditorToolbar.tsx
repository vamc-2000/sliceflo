
'use client';

import React, { useState } from 'react';
import { EditorView } from 'prosemirror-view';
import { toggleMark } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Table,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Pilcrow,
  ALargeSmall,
  CheckCircle2,
  Highlighter,
  AtSign,
} from 'lucide-react';
import {
  setTextAlign,
  setDirection,
  setTextStyle,
  setLink,
  toggleBulletList,
  toggleOrderedList,
  insertHorizontalRule,
  insertTable,
  insertChecklist,
  insertMentionQuery,
  insertLink,
} from '@/utils/editorCommands';
import { InsertLinkModal } from './InsertLinkModal';

interface EditorToolbarProps {
  view: EditorView | null;
}

const TB = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClick}
        onMouseDown={(e) => e.preventDefault()}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom">
      <p>{label}</p>
    </TooltipContent>
  </Tooltip>
);

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ view }) => {
  const executeCommand = (command: any) => {
    if (!view) return;
    command(view.state, view.dispatch);
    view.focus();
  };

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkData, setLinkData] = useState({ href: '', text: '' });

  const handleOpenLinkModal = () => {
    if (!view) return;
    const { from, to } = view.state.selection;
    const initialText = from !== to ? view.state.doc.textBetween(from, to) : '';

    // Check if the current selection has a link
    let initialHref = '';
    const { $from } = view.state.selection;
    const marks = $from.marks();
    const linkMark = marks.find(m => m.type.name === 'link');
    if (linkMark) {
      initialHref = linkMark.attrs.href;
    }

    setLinkData({ href: initialHref, text: initialText });
    setIsLinkModalOpen(true);
  };

  const handleInsertLink = (href: string, text: string) => {
    executeCommand(insertLink(href, text));
  };

  if (!view) {
    return <div className="flex flex-wrap gap-1 border rounded-md p-2 opacity-50 min-h-[42px]" />;
  }

  const marks = view.state.schema.marks;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center gap-0.5 p-1.5">

        {/* ¶ Paragraph */}
        <TB label="Paragraph">
          <Pilcrow className="h-4 w-4" />
        </TB>

        {/* Bold */}
        <TB label="Bold (Ctrl+B)" onClick={() => executeCommand(toggleMark(marks.strong))}>
          <Bold className="h-4 w-4" />
        </TB>

        {/* Italic */}
        <TB label="Italic (Ctrl+I)" onClick={() => executeCommand(toggleMark(marks.em))}>
          <Italic className="h-4 w-4" />
        </TB>

        {/* Underline */}
        <TB label="Underline (Ctrl+U)" onClick={() => executeCommand(toggleMark(marks.underline))}>
          <Underline className="h-4 w-4" />
        </TB>

        {/* Strikethrough */}
        <TB label="Strikethrough" onClick={() => executeCommand(toggleMark(marks.strike))}>
          <Strikethrough className="h-4 w-4" />
        </TB>

        {/* Text Color */}
        <Tooltip>
          <TooltipTrigger asChild>
            <label
              className="w-8 h-8 flex items-center justify-center border rounded cursor-pointer hover:bg-gray-100 relative"
              onMouseDown={(e) => e.preventDefault()}
            >
              <Highlighter className="h-4 w-4" />
              <input
                type="color"
                className="absolute opacity-0 w-full h-full cursor-pointer"
                onChange={(e) => executeCommand(setTextStyle({ color: e.target.value }))}
              />
            </label>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>Text Color</p></TooltipContent>
        </Tooltip>

        {/* Font Size */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex items-center border rounded h-8 px-1 gap-0.5 hover:bg-gray-100"
              onMouseDown={(e) => e.preventDefault()}
            >
              <ALargeSmall className="h-4 w-4 text-gray-600" />
              <select
                defaultValue="16px"
                className="text-sm bg-transparent outline-none cursor-pointer"
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => executeCommand(setTextStyle({ fontSize: e.target.value }))}
              >
                <option value="12px">12</option>
                <option value="14px">14</option>
                <option value="16px">16</option>
                <option value="18px">18</option>
                <option value="20px">20</option>
                <option value="24px">24</option>
                <option value="28px">28</option>
                <option value="32px">32</option>
              </select>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>Font Size</p></TooltipContent>
        </Tooltip>

        {/* Bullet List */}
        <TB label="Bullet List" onClick={() => executeCommand(toggleBulletList)}>
          <List className="h-4 w-4" />
        </TB>

        {/* Numbered List */}
        <TB label="Numbered List" onClick={() => executeCommand(toggleOrderedList)}>
          <ListOrdered className="h-4 w-4" />
        </TB>

        {/* Table */}
        <TB label="Insert Table" onClick={() => executeCommand(insertTable(3, 3))}>
          <Table className="h-4 w-4" />
        </TB>

        {/* Link */}
        <TB label="Insert Link" onClick={handleOpenLinkModal}>
          <LinkIcon className="h-4 w-4" />
        </TB>

        {/* Align Left */}
        <TB label="Align Left" onClick={() => executeCommand(setTextAlign('left'))}>
          <AlignLeft className="h-4 w-4" />
        </TB>

        {/* Align Center */}
        <TB label="Align Center" onClick={() => executeCommand(setTextAlign('center'))}>
          <AlignCenter className="h-4 w-4" />
        </TB>

        {/* Align Right */}
        <TB label="Align Right" onClick={() => executeCommand(setTextAlign('right'))}>
          <AlignRight className="h-4 w-4" />
        </TB>

        {/* Horizontal Line */}
        <TB label="Horizontal Line" onClick={() => executeCommand(insertHorizontalRule)}>
          <Minus className="h-4 w-4" />
        </TB>

        {/* RTL */}
        {/* <TB label="Right to Left" onClick={() => executeCommand(setDirection('rtl'))}>
          <span className="text-sm font-bold">⇄</span>
        </TB> */}

        {/* LTR */}
        {/* <TB label="Left to Right" onClick={() => executeCommand(setDirection('ltr'))}>
          <span className="text-xs font-bold">LTR</span>
        </TB> */}

        {/* Checklist */}
        <TB label="Checklist" onClick={() => executeCommand(insertChecklist)}>
          <CheckCircle2 className="h-4 w-4" />
        </TB>

        {/* Mention */}
        <TB label="Mention (@)" onClick={() => executeCommand(insertMentionQuery)}>
          <AtSign className="h-4 w-4" />
        </TB>

        <InsertLinkModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          onInsert={handleInsertLink}
          initialHref={linkData.href}
          initialText={linkData.text}
        />

      </div>
    </TooltipProvider>
  );
};