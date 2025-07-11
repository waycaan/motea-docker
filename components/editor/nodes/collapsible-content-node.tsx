/**
 * Collapsible Content Node for Lexical
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
} from 'lexical';

export type SerializedCollapsibleContentNode = SerializedElementNode;

export function $convertCollapsibleContentElement(): DOMConversionOutput | null {
    const node = $createCollapsibleContentNode();
    return {
        node,
    };
}

export class CollapsibleContentNode extends ElementNode {
    static getType(): string {
        return 'collapsible-content';
    }

    static clone(node: CollapsibleContentNode): CollapsibleContentNode {
        return new CollapsibleContentNode(node.__key);
    }

    createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
        const dom = document.createElement('div');
        dom.classList.add('collapsible-content');
        return dom;
    }

    updateDOM(): boolean {
        return false;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            div: (domNode: HTMLElement) => {
                if (domNode.classList.contains('collapsible-content')) {
                    return {
                        conversion: $convertCollapsibleContentElement,
                        priority: 2,
                    };
                }
                return null;
            },
        };
    }

    static importJSON(): CollapsibleContentNode {
        return $createCollapsibleContentNode();
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('div');
        element.classList.add('collapsible-content');
        return { element };
    }

    exportJSON(): SerializedCollapsibleContentNode {
        return {
            ...super.exportJSON(),
            type: 'collapsible-content',
            version: 1,
        };
    }

    insertNewAfter(): null {
        return null;
    }

    canIndent(): false {
        return false;
    }
}

export function $createCollapsibleContentNode(): CollapsibleContentNode {
    return new CollapsibleContentNode();
}

export function $isCollapsibleContentNode(
    node: LexicalNode | null | undefined,
): node is CollapsibleContentNode {
    return node instanceof CollapsibleContentNode;
}
