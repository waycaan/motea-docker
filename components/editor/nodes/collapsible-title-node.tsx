/**
 * Collapsible Title Node for Lexical
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
import { render } from 'react-dom';
import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/outline';

export type SerializedCollapsibleTitleNode = SerializedElementNode;

export function $convertCollapsibleTitleElement(): DOMConversionOutput | null {
    const node = $createCollapsibleTitleNode();
    return {
        node,
    };
}

export class CollapsibleTitleNode extends ElementNode {
    static getType(): string {
        return 'collapsible-title';
    }

    static clone(node: CollapsibleTitleNode): CollapsibleTitleNode {
        return new CollapsibleTitleNode(node.__key);
    }

    createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
        const dom = document.createElement('summary');
        dom.classList.add('collapsible-title');

        // 创建图标容器
        const iconContainer = document.createElement('span');
        iconContainer.classList.add('collapsible-icon');
        iconContainer.style.marginRight = '0.5rem';
        iconContainer.style.display = 'inline-flex';
        iconContainer.style.alignItems = 'center';
        iconContainer.style.transition = 'transform 0.2s ease';

        // 使用React渲染图标
        render(React.createElement(ChevronRightIcon, { className: 'w-4 h-4' }), iconContainer);

        dom.appendChild(iconContainer);

        // 监听父容器的toggle事件来旋转图标
        const updateIcon = () => {
            const details = dom.closest('details');
            if (details) {
                iconContainer.style.transform = details.open ? 'rotate(90deg)' : 'rotate(0deg)';
            }
        };

        // 初始状态
        setTimeout(updateIcon, 0);

        // 监听toggle事件
        dom.addEventListener('click', () => {
            setTimeout(updateIcon, 0);
        });

        return dom;
    }

    updateDOM(): boolean {
        return false;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            summary: () => {
                return {
                    conversion: $convertCollapsibleTitleElement,
                    priority: 1,
                };
            },
        };
    }

    static importJSON(): CollapsibleTitleNode {
        return $createCollapsibleTitleNode();
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('summary');
        element.classList.add('collapsible-title');
        return { element };
    }

    exportJSON(): SerializedCollapsibleTitleNode {
        return {
            ...super.exportJSON(),
            type: 'collapsible-title',
            version: 1,
        };
    }

    collapseAtStart(): true {
        this.getParentOrThrow().insertBefore(this);
        return true;
    }

    insertNewAfter(): null {
        return null;
    }

    canIndent(): false {
        return false;
    }
}

export function $createCollapsibleTitleNode(): CollapsibleTitleNode {
    return new CollapsibleTitleNode();
}

export function $isCollapsibleTitleNode(
    node: LexicalNode | null | undefined,
): node is CollapsibleTitleNode {
    return node instanceof CollapsibleTitleNode;
}
