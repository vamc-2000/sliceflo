// utils/editorCommands.ts
import { TextSelection } from 'prosemirror-state';
import { wrapInList } from 'prosemirror-schema-list';
import { toggleMark } from 'prosemirror-commands';
import { sinkListItem, liftListItem } from 'prosemirror-schema-list';
import { addRowAfter, addColumnAfter, deleteTable } from 'prosemirror-tables';

export const setTextAlign =
  (align: 'left' | 'center' | 'right' | 'justify') =>
    (state: any, dispatch: any) => {
      const { from, to } = state.selection;
      let tr = state.tr;

      state.doc.nodesBetween(from, to, (node: any, pos: number) => {
        if (node.type.name === 'paragraph') {
          tr = tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            align,
          });
        }
      });

      if (tr.docChanged) {
        dispatch(tr);
        return true;
      }
      return false;
    };

export const setDirection =
  (dir: 'ltr' | 'rtl') =>
    (state: any, dispatch: any) => {
      const { from, to } = state.selection;
      let tr = state.tr;

      state.doc.nodesBetween(from, to, (node: any, pos: number) => {
        if (node.type.name === 'paragraph') {
          tr = tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            dir,
          });
        }
      });

      if (tr.docChanged) {
        dispatch(tr);
        return true;
      }
      return false;
    };

export const setTextStyle =
  (attrs: { color?: string | null; fontSize?: string | null }) =>
    (state: any, dispatch: any) => {
      const markType = state.schema.marks.textStyle;
      if (!markType) return false;

      const { empty, $cursor, ranges } = state.selection;
      if (empty && !$cursor) return false;

      if (dispatch) {
        let tr = state.tr;
        if ($cursor) {
          const currentMarks = state.storedMarks || $cursor.marks();
          const existingMark = currentMarks.find((m: any) => m.type === markType);
          
          let newAttrs = existingMark ? { ...existingMark.attrs } : {};
          if (attrs.color !== undefined) newAttrs.color = attrs.color;
          if (attrs.fontSize !== undefined) newAttrs.fontSize = attrs.fontSize;

          if (!newAttrs.color && !newAttrs.fontSize) {
            tr.removeStoredMark(markType);
          } else {
            tr.addStoredMark(markType.create(newAttrs));
          }
        } else {
          for (let i = 0; i < ranges.length; i++) {
            const { $from, $to } = ranges[i];
            
            state.doc.nodesBetween($from.pos, $to.pos, (node: any, pos: number) => {
              if (node.isInline) {
                const existingMark = node.marks.find((m: any) => m.type === markType);
                let newAttrs = existingMark ? { ...existingMark.attrs } : {};
                
                if (attrs.color !== undefined) newAttrs.color = attrs.color;
                if (attrs.fontSize !== undefined) newAttrs.fontSize = attrs.fontSize;
                
                const nodeStart = Math.max(pos, $from.pos);
                const nodeEnd = Math.min(pos + node.nodeSize, $to.pos);
                
                if (nodeStart < nodeEnd) {
                  if (!newAttrs.color && !newAttrs.fontSize) {
                    tr.removeMark(nodeStart, nodeEnd, markType);
                  } else {
                    tr.addMark(nodeStart, nodeEnd, markType.create(newAttrs));
                  }
                }
              }
            });
          }
        }
        dispatch(tr.scrollIntoView());
      }
      return true;
    };

export const setLink =
  (href: string) =>
    (state: any, dispatch: any) => {
      const type = state.schema.marks.link;
      if (!type) return false;
      return toggleMark(type, { href, target: '_blank' })(state, dispatch);
    };

export const insertLink = (href: string, text?: string) => (state: any, dispatch: any) => {
  const { from, to } = state.selection;
  const linkMark = state.schema.marks.link;
  if (!linkMark) return false;

  // Add protocol if missing
  let url = href.trim();
  if (url && !/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !/^tel:/i.test(url)) {
    url = 'https://' + url;
  }

  const selectionText = state.doc.textBetween(from, to);
  const mark = linkMark.create({ href: url, target: '_blank' });

  // If text is provided and it's different from selection, replace it explicitly
  const content = text && text.trim() ? text : (selectionText || href);
  
  const tr = state.tr;
  if (from !== to) {
    tr.delete(from, to);
  }
  
  tr.insertText(content, from);
  tr.addMark(from, from + content.length, mark);
  
  // Set the selection after the link
  tr.setSelection(TextSelection.create(tr.doc, from + content.length));
  // Clear stored marks so following text isn't linked
  tr.removeStoredMark(linkMark);

  dispatch(tr);
  return true;
};



export const toggleBulletList = (state: any, dispatch: any) =>
  wrapInList(state.schema.nodes.bullet_list)(state, dispatch);

export const toggleOrderedList = (state: any, dispatch: any) =>
  wrapInList(state.schema.nodes.ordered_list)(state, dispatch);

export const insertHorizontalRule = (state: any, dispatch: any) => {
  const hr = state.schema.nodes.horizontal_rule;
  if (!hr) return false;
  dispatch(state.tr.replaceSelectionWith(hr.create()));
  return true;
};

export const insertTable =
  (rows = 3, cols = 3) =>
    (state: any, dispatch: any) => {
      const table = state.schema.nodes.table;
      const row = state.schema.nodes.table_row;
      const cell = state.schema.nodes.table_cell;
      if (!table || !row || !cell) return false;

      const rowsNodes = [];
      for (let r = 0; r < rows; r++) {
        const cells = [];
        for (let c = 0; c < cols; c++) {
          cells.push(cell.createAndFill());
        }
        rowsNodes.push(row.create(null, cells));
      }

      dispatch(state.tr.replaceSelectionWith(table.create(null, rowsNodes)));
      return true;
    };

export const insertChecklist = (state: any, dispatch: any) => {
  const { $from, $to } = state.selection;
  const range = $from.blockRange($to);
  if (!range) return false;

  const taskList = state.schema.nodes.task_list;
  const taskItem = state.schema.nodes.task_item;  
  if (!taskList || !taskItem) return false;

  // Check if we're already inside a task list
  const parent = range.parent;
  if (parent.type === taskList || (parent.type === taskItem && parent.content.firstChild?.type === taskList)) {
    // If already in a task list, lift out (toggle off)
    return liftListItem(taskItem)(state, dispatch);
  }

  // Otherwise, wrap in task list
  return wrapInList(taskList)(state, dispatch);
};

export const insertMentionQuery = (state: any, dispatch: any) => {
  dispatch(state.tr.insertText('@'));
  return true;
};

export const indentListItem = (state: any, dispatch: any) => {
  const taskItem = state.schema.nodes.task_item || state.schema.nodes.list_item;
  return taskItem ? sinkListItem(taskItem)(state, dispatch) : false;
};

export const outdentListItem = (state: any, dispatch: any) => {
  const taskItem = state.schema.nodes.task_item || state.schema.nodes.list_item;
  return taskItem ? liftListItem(taskItem)(state, dispatch) : false;
};

export { addRowAfter, addColumnAfter, deleteTable };