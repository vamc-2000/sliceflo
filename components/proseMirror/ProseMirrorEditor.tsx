
'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { DOMParser, DOMSerializer, Node as ProseMirrorNode } from 'prosemirror-model';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { splitListItem, liftListItem, sinkListItem } from 'prosemirror-schema-list';
import { customSchema } from '@/utils/editorSchema';
import { createMentionPlugin, mentionPluginKey } from '@/utils/mentionPlugin';
import { insertChecklist } from '@/utils/editorCommands';
import { FootnoteView } from './FootnoteView';
import { EditorToolbar } from './EditorToolbar';
import { createPortal } from 'react-dom';
import { MentionList } from './MentionList';

interface ProseMirrorEditorProps {
    initialContent?: string;

    onBlur?: (content: string) => void;
    placeholder?: string;
    className?: string;
    editable?: boolean;
    mentionableMembers?: { id: string; name: string; avatar?: string }[];
}

export const ProseMirrorEditor: React.FC<ProseMirrorEditorProps> = ({
    initialContent = '',

    onBlur,
    placeholder = 'Enter description...',
    className = '',
    editable = true,
    mentionableMembers = [],
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [mentionState, setMentionState] = useState<{
        active: boolean;
        query: string;
        pos: { top: number; left: number } | null;
        range: { from: number; to: number } | null;
    }>({ active: false, query: '', pos: null, range: null });

    const onBlurRef = useRef(onBlur);

    useEffect(() => {

        onBlurRef.current = onBlur;
    }, [onBlur]);

    useEffect(() => {
        setIsMounted(true);
        return () => {
            setIsMounted(false);
            setIsEditorReady(false);
        };
    }, []);

    const serializeToHTML = (doc: ProseMirrorNode) => {
        try {
            const serializer = DOMSerializer.fromSchema(customSchema);
            const fragment = serializer.serializeFragment(doc.content);
            const div = document.createElement('div');
            div.appendChild(fragment);
            return div.innerHTML;
        } catch (err) {
            console.error('Error serializing document:', err);
            return '';
        }
    };

    useEffect(() => {
        if (!isMounted || !editorRef.current) return;

        if (viewRef.current && initialContent !== undefined) {
            const currentHTML = serializeToHTML(viewRef.current.state.doc);
            if (currentHTML === initialContent) return;
        }

        if (viewRef.current) {
            viewRef.current.destroy();
            viewRef.current = null;
        }

        try {
            if (!customSchema || !customSchema.topNodeType) {
                throw new Error('Invalid schema: missing topNodeType');
            }

            let doc;

            if (initialContent && initialContent.trim()) {
                try {
                    const parser = DOMParser.fromSchema(customSchema);
                    const htmlDoc = new window.DOMParser().parseFromString(
                        initialContent,
                        'text/html'
                    );
                    doc = parser.parse(htmlDoc.body);
                } catch (parseError) {
                    console.error('Error parsing initial content:', parseError);
                    doc = undefined;
                }
            }

            const state = EditorState.create({
                doc,
                schema: customSchema,
                plugins: [
                    history(),
                    keymap({
                        'Mod-z': undo,
                        'Mod-y': redo,
                        'Mod-Shift-z': redo,
                    }),
                    keymap({
                        'Enter': (state, dispatch) => {
                            const { $from } = state.selection;
                            
                            // Check if current node or parent is a task_item
                            let isTaskItem = false;
                            for (let d = $from.depth; d >= 0; d--) {
                                if ($from.node(d).type.name === 'task_item') {
                                    isTaskItem = true;
                                    break;
                                }
                            }

                            if (isTaskItem) {
                                return splitListItem(customSchema.nodes.task_item)(state, dispatch);
                            }
                            return splitListItem(customSchema.nodes.list_item)(state, dispatch);
                        },
                        'Mod-[': (state, dispatch) => {
                            const { $from } = state.selection;
                            const node = $from.node(-1);
                            if (node && node.type.name === 'task_item') {
                                return liftListItem(customSchema.nodes.task_item)(state, dispatch);
                            }
                            return liftListItem(customSchema.nodes.list_item)(state, dispatch);
                        },
                        'Mod-]': (state, dispatch) => {
                            const { $from } = state.selection;
                            const node = $from.node(-1);
                            if (node && node.type.name === 'task_item') {
                                return sinkListItem(customSchema.nodes.task_item)(state, dispatch);
                            }
                            return sinkListItem(customSchema.nodes.list_item)(state, dispatch);
                        },
                        'Tab': (state, dispatch) => {
                            const { $from } = state.selection;
                            const node = $from.node(-1);
                            if (node && node.type.name === 'task_item') {
                                return sinkListItem(customSchema.nodes.task_item)(state, dispatch);
                            }
                            return sinkListItem(customSchema.nodes.list_item)(state, dispatch);
                        },
                        'Shift-Tab': (state, dispatch) => {
                            const { $from } = state.selection;
                            const node = $from.node(-1);
                            if (node && node.type.name === 'task_item') {
                                return liftListItem(customSchema.nodes.task_item)(state, dispatch);
                            }
                            return liftListItem(customSchema.nodes.list_item)(state, dispatch);
                        },
                    }),
                    createMentionPlugin(),
                    keymap(baseKeymap),
                ],
            });

            viewRef.current = new EditorView(editorRef.current, {
                state,
                editable: () => editable,
                handleClick(view, pos, event) {
                    const { state } = view;
                    const mark = state.doc.resolve(pos).marks().find(m => m.type.name === 'link');
                    
                    if (mark && mark.attrs.href) {
                        window.open(mark.attrs.href, mark.attrs.target || '_blank');
                        return true; 
                    }
                    return false;
                },
                handleTextInput(view, from, to, text) {
                    if (text === ' ' && from === to) {
                        const { state, dispatch } = view;
                        const $from = state.doc.resolve(from);
                        const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
                        if ($from.parent.type.name === 'paragraph' && textBefore.trim() === '[]') {
                            const tr = state.tr.delete(from - 2, from);
                            dispatch(tr);
                            insertChecklist(view.state, view.dispatch);
                            return true;
                        }
                    }
                    return false;
                },
                nodeViews: {
                    footnote(node, view, getPos) {
                        return new FootnoteView(node, view, getPos as () => number);
                    },
                },
                handleDOMEvents: {
                    mousedown: (view, event) => {
                        const target = event.target as HTMLElement;
                        if (target.getAttribute('type') === 'checkbox' || target.classList.contains('checkbox-inner') || target.closest('.task-item-checkbox')) {
                            const pos = view.posAtDOM(target, 0);
                            const $pos = view.state.doc.resolve(pos);
                            
                            let taskItemPos = -1;
                            for (let d = $pos.depth; d >= 0; d--) {
                                if ($pos.node(d).type.name === 'task_item') {
                                    taskItemPos = $pos.before(d);
                                    break;
                                }
                            }

                            if (taskItemPos !== -1) {
                                const node = view.state.doc.nodeAt(taskItemPos);
                                if (node && node.type.name === 'task_item') {
                                    view.dispatch(view.state.tr.setNodeMarkup(taskItemPos, undefined, {
                                        ...node.attrs,
                                        checked: !node.attrs.checked
                                    }));
                                    return true;
                                }
                            }
                        }
                        return false;
                    },
                    focus: () => {
                        setIsFocused(true);
                        return false;
                    },
                    blur: (view) => {
                        setIsFocused(false);
                        if (onBlurRef.current) {
                            const html = serializeToHTML(view.state.doc);
                            onBlurRef.current(html);
                        }
                        return false;
                    }
                },
                dispatchTransaction(transaction) {
                    if (!viewRef.current) return;

                    const newState = viewRef.current.state.apply(transaction);
                    viewRef.current.updateState(newState);

                   
                    const mState = mentionPluginKey.getState(newState);
                    if (mState && mState.active && mState.range) {
                        const coords = viewRef.current?.coordsAtPos(mState.range.from);
                        if (coords) {
                            setMentionState({
                                active: true,
                                query: mState.query,
                                pos: {
                                    top: coords.bottom + 4,
                                    left: coords.left,
                                },
                                range: mState.range,
                            });
                        }
                    } else {
                        setMentionState({ active: false, query: '', pos: null, range: null });
                    }
                },
            });

            const handleScroll = () => {
                if (!viewRef.current || !mentionState.active || !mentionState.range) return;
                const coords = viewRef.current.coordsAtPos(mentionState.range.from);
                if (coords) {
                    setMentionState(prev => ({
                        ...prev,
                        pos: { top: coords.bottom + 4, left: coords.left }
                    }));
                }
            };

            const scrollContainer = editorRef.current?.closest('.overflow-y-auto');
            if (scrollContainer) {
                scrollContainer.addEventListener('scroll', handleScroll);
            }

            setIsEditorReady(true);
            return () => {
                if (scrollContainer) {
                    scrollContainer.removeEventListener('scroll', handleScroll);
                }
                if (viewRef.current) {
                    viewRef.current.destroy();
                    viewRef.current = null;
                }
            };
        } catch (err) {
            console.error('Error initializing ProseMirror:', err);
            setError(err instanceof Error ? err.message : 'Failed to initialize editor');
        }
    }, [isMounted, editable, initialContent]); 

    if (error) {
        return (
            <div className={`prose-mirror-wrapper ${className} border border-red-300 rounded`}>
                <div className="p-4 text-red-600 text-sm">
                    Failed to load editor: {error}
                </div>
            </div>
        );
    }

    if (!isMounted) {
        return (
            <div className={`prose-mirror-wrapper border rounded-lg ${className}`}>
                <div className="h-32 bg-gray-50 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="prose-mirror-wrapper bg-background overflow-hidden flex flex-col h-full">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
                {isEditorReady ? (
                    <EditorToolbar view={viewRef.current} />
                ) : (
                    <div className="p-2 h-[44px] flex items-center gap-1">
                        <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                        <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                        <div className="w-px h-6 bg-muted mx-1" />
                        <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                        <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                    </div>
                )}
            </div>

            <div className={`relative ${className}`}>
                <div
                    ref={editorRef}
                    className="prose-mirror-editor p-3 ProseMirror outline-none focus:outline-none focus-visible:outline-none"
                />
                {placeholder && !isFocused && (!viewRef.current || viewRef.current.state.doc.textContent.length === 0) && (
                    <div className="absolute top-3 left-3 text-gray-400 pointer-events-none select-none">
                        {placeholder}
                    </div>
                )}

                {mentionState.active && mentionState.pos && typeof document !== 'undefined' && createPortal(
                    <div
                        style={{
                            position: 'fixed',
                            top: mentionState.pos.top,
                            left: mentionState.pos.left,
                            zIndex: 9999,
                        }}
                    >
                        <MentionList
                            members={mentionableMembers}
                            query={mentionState.query}
                            onSelect={(member) => {
                                if (viewRef.current && mentionState.range) {
                                    const { state, dispatch } = viewRef.current;
                                    const { from, to } = mentionState.range;
                                    const node = customSchema.nodes.mention.create({
                                        id: member.id,
                                        label: member.name,
                                    });
                                    const tr = state.tr.replaceWith(from, to, node).insertText(' ');
                                    dispatch(tr);
                                    viewRef.current.focus();
                                }
                            }}
                            onClose={() => {
                                setMentionState({ active: false, query: '', pos: null, range: null });
                            }}
                        />
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};
