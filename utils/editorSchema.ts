// // utils/editorSchema.ts

// import { Schema, NodeSpec, DOMOutputSpec } from 'prosemirror-model';
// import { schema as basicSchema } from 'prosemirror-schema-basic';

// // ✅ Properly typed footnote specification
// const footnoteSpec: NodeSpec = {
//   group: 'inline',
//   content: 'inline*', // Can contain other inline content
//   inline: true,
//   atom: true, // Treated as a single unit

//   // ✅ Correct DOM output with proper typing
//   toDOM(): DOMOutputSpec {
//     return ['footnote', { class: 'footnote-node' }, 0];
//   },

//   // ✅ Parse from DOM
//   parseDOM: [
//     {
//       tag: 'footnote',
//     },
//   ],
// };

// // ✅ Create extended schema
// export const customSchema = new Schema({
//   nodes: basicSchema.spec.nodes.addBefore('image', 'footnote', footnoteSpec),
//   marks: basicSchema.spec.marks,
// });

// // ✅ Log for debugging (remove in production)
// if (typeof window !== 'undefined') {
//   console.log('Custom schema created:', customSchema.spec.nodes);
// }


// utils/editorSchema.ts
import { Schema, NodeSpec, MarkSpec, DOMOutputSpec } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { tableNodes } from 'prosemirror-tables';

// --- NODES ---

const footnoteSpec: NodeSpec = {
  group: 'inline',
  content: 'inline*',
  inline: true,
  atom: true,
  toDOM(): DOMOutputSpec { return ['footnote', { class: 'footnote-node' }, 0]; },
  parseDOM: [{ tag: 'footnote' }],
};

const mentionSpec: NodeSpec = {
  group: 'inline',
  inline: true,
  atom: true,
  attrs: {
    id: {},
    label: {},
  },
  toDOM: (node) => [
    'span',
    {
      class: 'mention inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium text-sm border border-blue-200',
      'data-mention-id': node.attrs.id,
      'data-mention-label': node.attrs.label,
    },
    `@${node.attrs.label}`,
  ],
  parseDOM: [
    {
      tag: 'span[data-mention-id]',
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) return false;
        return {
          id: dom.getAttribute('data-mention-id'),
          label: dom.getAttribute('data-mention-label'),
        };
      },
    },
  ],
};

const taskListSpec: NodeSpec = {
  group: 'block',
  content: 'task_item+',
  toDOM() { return ['ul', { 'data-type': 'taskList', class: 'task-list' }, 0]; },
  parseDOM: [
    { tag: 'ul[data-type="taskList"]', priority: 60 },
    { tag: 'ul.task-list', priority: 60 },
    { 
      tag: 'ul', 
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) return false;
        if (dom.querySelector('li[data-type="taskItem"]') || dom.querySelector('li.task-item')) return {};
        return false;
      },
      priority: 60
    }
  ],
};

const taskItemSpec: NodeSpec = {
  defining: true,
  content: 'block+',
  attrs: { checked: { default: false } },
  toDOM(node) {
    return [
      'li',
      { 
        'data-type': 'taskItem', 
        'data-checked': String(node.attrs.checked),
        class: `task-item ${node.attrs.checked ? 'is-checked' : ''}`
      },
      ['label',
        { class: 'task-item-checkbox' },
        ['input', { type: 'checkbox', ...(node.attrs.checked ? { checked: 'checked' } : {}) }],
        ['span', { class: 'checkbox-inner' }],
      ],
      ['div', { class: 'task-item-content' }, 0],
    ];
  },
  parseDOM: [
    { 
      tag: 'li[data-type="taskItem"]', 
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) return false;
        return { checked: dom.getAttribute('data-checked') === 'true' };
      },
      priority: 60
    },
    { 
      tag: 'li.task-item', 
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) return false;
        return { checked: dom.classList.contains('is-checked') || dom.getAttribute('data-checked') === 'true' };
      },
      priority: 60
    },
    {
      tag: 'li',
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) return false;
        const checkbox = dom.querySelector('input[type="checkbox"]');
        if (checkbox || dom.classList.contains('task-item')) {
           return { checked: (checkbox as HTMLInputElement)?.checked || dom.classList.contains('is-checked') };
        }
        return false;
      },
      priority: 60
    }
  ],
};

const paragraphSpec: NodeSpec = {
  ...basicSchema.spec.nodes.get('paragraph')!,
  attrs: { align: { default: 'left' }, dir: { default: 'ltr' } },
  parseDOM: [{
    tag: 'p',
    getAttrs: (dom) => {
      if (!(dom instanceof HTMLElement)) return { align: 'left', dir: 'ltr' };
      return {
        align: dom.style.textAlign || 'left',
        dir: dom.getAttribute('dir') || 'ltr',
      };
    },
  }],
  toDOM(node) {
    return ['p', { style: `text-align:${node.attrs.align}`, dir: node.attrs.dir }, 0];
  },
};

// --- MARKS ---

const underlineMark: MarkSpec = {
  parseDOM: [{ tag: 'u' }],
  toDOM() { return ['u', 0]; },
};

const strikeMark: MarkSpec = {
  parseDOM: [{ tag: 's' }, { tag: 'strike' }],
  toDOM() { return ['s', 0]; },
};

const linkMark: MarkSpec = {
  attrs: { href: {}, target: { default: '_blank' } },
  inclusive: false,
  parseDOM: [{
    tag: 'a[href]',
    getAttrs(dom) {
      if (!(dom instanceof HTMLElement)) return false;
      return {
        href: dom.getAttribute('href'),
        target: dom.getAttribute('target') || '_blank',
      };
    },
  }],
  toDOM(node) { return ['a', node.attrs, 0]; },
};

const textStyleMark: MarkSpec = {
  attrs: { color: { default: null }, fontSize: { default: null } },
  parseDOM: [{
    tag: 'span',
    getAttrs(dom) {
      if (!(dom instanceof HTMLElement)) return false;
      return {
        color: dom.style.color || null,
        fontSize: dom.style.fontSize || null,
      };
    },
  }],
  toDOM(mark) {
    const style = [
      mark.attrs.color ? `color:${mark.attrs.color}` : '',
      mark.attrs.fontSize ? `font-size:${mark.attrs.fontSize}` : '',
    ].filter(Boolean).join(';');
    return ['span', style ? { style } : {}, 0];
  },
};

// --- BUILD SCHEMA ---

let nodes = basicSchema.spec.nodes;
nodes = nodes.remove('heading');
nodes = nodes.remove('blockquote');
nodes = nodes.remove('code_block');
nodes = nodes.remove('image');
nodes = nodes.remove('hard_break');
nodes = nodes.update('paragraph', paragraphSpec);
nodes = addListNodes(nodes, 'paragraph block*', 'block');
nodes = nodes.addBefore('horizontal_rule', 'footnote', footnoteSpec);
nodes = nodes.append({
  task_list: taskListSpec,
  task_item: taskItemSpec,
  mention: mentionSpec,
  ...tableNodes({ tableGroup: 'block', cellContent: 'block+', cellAttributes: {} }),
});

let marks = basicSchema.spec.marks;
marks = marks.remove('code');
marks = marks
  .addToEnd('underline', underlineMark)
  .addToEnd('strike', strikeMark)
  .addToEnd('link', linkMark)
  .addToEnd('textStyle', textStyleMark);

export const customSchema = new Schema({ nodes, marks });