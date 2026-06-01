// components/proseMirror/FootnoteView.tsx

import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { EditorState, Transaction } from 'prosemirror-state';
import { StepMap } from 'prosemirror-transform';
import { keymap } from 'prosemirror-keymap';
import { undo, redo } from 'prosemirror-history';

export class FootnoteView {
    node: ProseMirrorNode;
    outerView: EditorView;
    getPos: () => number;
    dom: HTMLElement;
    innerView: EditorView | null = null;

    constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number) {
        this.node = node;
        this.outerView = view;
        this.getPos = getPos;
        this.dom = document.createElement('footnote');
    }

    selectNode() {
        this.dom.classList.add('ProseMirror-selectednode');
        if (!this.innerView) this.open();
    }

    deselectNode() {
        this.dom.classList.remove('ProseMirror-selectednode');
        if (this.innerView) this.close();
    }

    open() {
        const tooltip = this.dom.appendChild(document.createElement('div'));
        tooltip.className = 'footnote-tooltip';

        this.innerView = new EditorView(tooltip, {
            state: EditorState.create({
                doc: this.node,
                plugins: [
                    keymap({
                        'Mod-z': () => undo(this.outerView.state, this.outerView.dispatch),
                        'Mod-y': () => redo(this.outerView.state, this.outerView.dispatch),
                    }),
                ],
            }),
            dispatchTransaction: this.dispatchInner.bind(this),
            handleDOMEvents: {
                mousedown: () => {
                    if (this.outerView.hasFocus()) this.innerView?.focus();
                },
            },
        });
    }

    close() {
        this.innerView?.destroy();
        this.innerView = null;
        this.dom.textContent = '';
    }

    dispatchInner(tr: Transaction) {
        const { state, transactions } = this.innerView!.state.applyTransaction(tr);
        this.innerView!.updateState(state);

        if (!tr.getMeta('fromOutside')) {
            const outerTr = this.outerView.state.tr;
            const offsetMap = StepMap.offset(this.getPos() + 1);

            for (let i = 0; i < transactions.length; i++) {
                const steps = transactions[i].steps;
                for (let j = 0; j < steps.length; j++) {
                    const mappedStep = steps[j].map(offsetMap); // ✅ Store result first
                    if (mappedStep) { // ✅ Check for null
                        outerTr.step(mappedStep);
                    }
                }
            }

            if (outerTr.docChanged) this.outerView.dispatch(outerTr);
        }
    }
}
