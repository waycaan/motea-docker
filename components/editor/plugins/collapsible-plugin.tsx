/**
 * Collapsible Plugin for Lexical
 * Provides collapsible container functionality
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_EDITOR,
    createCommand,
    LexicalCommand,
    $createParagraphNode,
    $createTextNode,
} from 'lexical';
import { $insertNodeToNearestRoot } from '@lexical/utils';

import {
    $createCollapsibleContainerNode,
    CollapsibleContainerNode,
} from '../nodes/collapsible-container-node';
import {
    $createCollapsibleTitleNode,
    CollapsibleTitleNode,
} from '../nodes/collapsible-title-node';
import {
    $createCollapsibleContentNode,
    CollapsibleContentNode,
} from '../nodes/collapsible-content-node';

// 创建插入可折叠容器的命令
export const INSERT_COLLAPSIBLE_COMMAND: LexicalCommand<void> = createCommand(
    'INSERT_COLLAPSIBLE_COMMAND'
);

export default function CollapsiblePlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            INSERT_COLLAPSIBLE_COMMAND,
            () => {
                editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) {
                        return;
                    }

                    // 创建可折叠容器
                    const collapsibleContainer = $createCollapsibleContainerNode(true);
                    
                    // 创建标题节点
                    const titleNode = $createCollapsibleTitleNode();
                    const titleText = $createTextNode('Collapsible Title');
                    titleNode.append(titleText);
                    
                    // 创建内容节点
                    const contentNode = $createCollapsibleContentNode();
                    const contentParagraph = $createParagraphNode();
                    const contentText = $createTextNode('Collapsible content goes here...');
                    contentParagraph.append(contentText);
                    contentNode.append(contentParagraph);
                    
                    // 组装结构
                    collapsibleContainer.append(titleNode, contentNode);
                    
                    // 插入到编辑器
                    $insertNodeToNearestRoot(collapsibleContainer);

                    // 安全地选中标题文本
                    setTimeout(() => {
                        editor.update(() => {
                            titleText.select();
                        });
                    }, 0);
                });
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    return null;
}
