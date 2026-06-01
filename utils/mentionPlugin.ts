import { Plugin, PluginKey, EditorState, Selection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

export const mentionPluginKey = new PluginKey('mentionPlugin');

export interface MentionPluginState {
  active: boolean;
  query: string;
  range: { from: number; to: number } | null;
}

export function createMentionPlugin() {
  return new Plugin<MentionPluginState>({
    key: mentionPluginKey,
    state: {
      init() {
        return { active: false, query: '', range: null };
      },
      apply(tr, prevValue) {
        const { selection } = tr;
        if (!selection.empty) {
          return { active: false, query: '', range: null };
        }

        const $pos = selection.$from;
        const textBefore = $pos.parent.textContent.slice(0, $pos.parentOffset);
        const match = /@([\w]*)$/.exec(textBefore);

        if (match) {
          const query = match[1];
          const from = $pos.pos - match[0].length;
          const to = $pos.pos;
          return { active: true, query, range: { from, to } };
        }

        return { active: false, query: '', range: null };
      },
    },
    props: {
      handleKeyDown(view, event) {
        const state = mentionPluginKey.getState(view.state);
        if (!state?.active) return false;

        // The React component will handle ArrowUp, ArrowDown, and Enter
        // but we need to intercept them if the mention list is active
        // to prevent the default editor behavior.
        if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(event.key)) {
          // We return true for most, but the actual logic will be in 
          // ProseMirrorEditor's handleKeyDown or within the plugin props 
          // if we decide to handle it here.
          // For now, let's let the React component handle it via ProseMirrorEditor's state.
          return false; 
        }
        return false;
      },
    },
  });
}
