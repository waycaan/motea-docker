/**
 * Collapsible Container Node for Lexical
 * Based on Lexical playground implementation
 */

import {
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    EditorConfig,
    ElementNode,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedElementNode,
    Spread,
} from 'lexical';

import { $createCollapsibleContentNode, CollapsibleContentNode } from './collapsible-content-node';
import { $createCollapsibleTitleNode, CollapsibleTitleNode } from './collapsible-title-node';

export type SerializedCollapsibleContainerNode = Spread<
    {
        open: boolean;
    },
    SerializedElementNode
>;

export function $convertCollapsibleContainerElement(
    domNode: HTMLElement,
): DOMConversionOutput | null {
    const isOpen = domNode.hasAttribute('open');
    const node = $createCollapsibleContainerNode(isOpen);
    return {
        node,
    };
}

export class CollapsibleContainerNode extends ElementNode {
    __open: boolean;

    constructor(open: boolean, key?: NodeKey) {
        super(key);
        this.__open = open;
    }

    static getType(): string {
        return 'collapsible-container';
    }

    static clone(node: CollapsibleContainerNode): CollapsibleContainerNode {
        return new CollapsibleContainerNode(node.__open, node.__key);
    }

    createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
        const dom = document.createElement('details');
        dom.classList.add('collapsible-container');
        dom.open = this.__open;

        // 使用节点key来安全地获取最新的节点实例
        const nodeKey = this.getKey();

        dom.addEventListener('toggle', () => {
            editor.update(() => {
                const node = editor.getEditorState()._nodeMap.get(nodeKey);
                if (node && node instanceof CollapsibleContainerNode) {
                    const currentOpen = node.__open;
                    if (currentOpen !== dom.open) {
                        node.setOpen(dom.open);
                    }
                }
            });
        });
        return dom;
    }

    updateDOM(prevNode: CollapsibleContainerNode, dom: HTMLDetailsElement): boolean {
        if (prevNode.__open !== this.__open) {
            dom.open = this.__open;
        }
        return false;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            details: (domNode: HTMLElement) => {
                return {
                    conversion: $convertCollapsibleContainerElement,
                    priority: 1,
                };
            },
        };
    }

    static importJSON(serializedNode: SerializedCollapsibleContainerNode): CollapsibleContainerNode {
        const { open } = serializedNode;
        return $createCollapsibleContainerNode(open);
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('details');
        element.classList.add('collapsible-container');
        element.setAttribute('open', this.__open.toString());
        return { element };
    }

    exportJSON(): SerializedCollapsibleContainerNode {
        return {
            ...super.exportJSON(),
            open: this.__open,
            type: 'collapsible-container',
            version: 1,
        };
    }

    setOpen(open: boolean): void {
        const writable = this.getWritable();
        writable.__open = open;
    }

    getOpen(): boolean {
        return this.getLatest().__open;
    }

    toggleOpen(): void {
        this.setOpen(!this.getOpen());
    }

    insertNewAfter(): null {
        return null;
    }

    canIndent(): false {
        return false;
    }
}

export function $createCollapsibleContainerNode(isOpen: boolean): CollapsibleContainerNode {
    return new CollapsibleContainerNode(isOpen);
}

export function $isCollapsibleContainerNode(
    node: LexicalNode | null | undefined,
): node is CollapsibleContainerNode {
    return node instanceof CollapsibleContainerNode;
}
