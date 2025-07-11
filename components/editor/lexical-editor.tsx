/**
 * Lexical Editor Component
 * Migrated from TipTap to Lexical for better performance and modern architecture
 */

import { useImperativeHandle, forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import { $getRoot, $createParagraphNode, EditorState, $getSelection, $isRangeSelection, KEY_ENTER_COMMAND, COMMAND_PRIORITY_HIGH } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin, createEmptyHistoryState, type HistoryState } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TRANSFORMERS, $convertFromMarkdownString, ElementTransformer, TextFormatTransformer, CHECK_LIST } from '@lexical/markdown';
import { UnifiedEditorManager } from 'libs/web/utils/unified-editor-manager';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode, $isListItemNode, $isListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { use100vh } from 'react-div-100vh';
import useMounted from 'libs/web/hooks/use-mounted';
import useI18n from 'libs/web/hooks/use-i18n';

// Import custom plugins and nodes
import SlashCommandsPlugin from './plugins/slash-commands-plugin';
import FloatingToolbarPlugin from './plugins/floating-toolbar-plugin';
import HighlightPlugin from './plugins/highlight-plugin';
import ImagePlugin from './plugins/image-plugin';
import IMEPlugin from './plugins/ime-plugin';
import CodeBlockPlugin from './plugins/code-block-plugin';
import CollapsiblePlugin from './plugins/collapsible-plugin';
import LazyPluginLoader from './plugins/lazy-plugin-loader';
import { ImageNode, $createImageNode, $isImageNode } from './nodes/image-node';
import { HorizontalRuleNode, $isHorizontalRuleNode, $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { $isTableNode, $isTableCellNode, $isTableRowNode } from '@lexical/table';
import { CollapsibleContainerNode } from './nodes/collapsible-container-node';
import { CollapsibleTitleNode } from './nodes/collapsible-title-node';
import { CollapsibleContentNode } from './nodes/collapsible-content-node';

// 使用Lexical原生的ListItemNode，不需要自定义TaskList节点
// 使用Lexical内置的highlight格式，不需要自定义HighlightNode

export interface LexicalEditorProps {
    readOnly?: boolean;
    isPreview?: boolean;
    value?: string; // JSON 字符串格式
    onChange?: (jsonContent: string) => void; // 简化的 onChange，直接传递 JSON
    onCreateLink?: (title: string) => Promise<string>;
    onSearchLink?: (term: string) => Promise<any[]>;
    onClickLink?: (href: string, event: any) => void;
    onHoverLink?: (event: any) => boolean;
    className?: string;
    noteId?: string; // 添加 noteId 属性
}

export interface LexicalEditorRef {
    focusAtEnd: () => void;
    focusAtStart: () => void;
}

// Lexical 0.32.1 官方标准主题配置
const theme = {
    ltr: 'ltr',
    rtl: 'rtl',
    placeholder: 'editor-placeholder',
    paragraph: 'editor-paragraph',
    quote: 'editor-quote',
    heading: {
        h1: 'editor-heading-h1',
        h2: 'editor-heading-h2',
        h3: 'editor-heading-h3',
        h4: 'editor-heading-h4',
        h5: 'editor-heading-h5',
        h6: 'editor-heading-h6',
    },
    list: {
        nested: {
            listitem: 'editor-nested-listitem',
        },
        ol: 'editor-list-ol',
        ul: 'editor-list-ul',
        listitem: 'editor-listitem',
        listitemChecked: 'editor-listitem-checked',
        listitemUnchecked: 'editor-listitem-unchecked',
    },
    image: 'editor-image',
    link: 'editor-link',
    text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
        overflowed: 'editor-text-overflowed',
        hashtag: 'editor-text-hashtag',
        underline: 'editor-text-underline',
        strikethrough: 'editor-text-strikethrough',
        underlineStrikethrough: 'editor-text-underlineStrikethrough',
        code: 'editor-text-code',
    },
    code: 'editor-code',
    codeHighlight: {
        atrule: 'editor-tokenAttr',
        attr: 'editor-tokenAttr',
        boolean: 'editor-tokenProperty',
        builtin: 'editor-tokenSelector',
        cdata: 'editor-tokenComment',
        char: 'editor-tokenSelector',
        class: 'editor-tokenFunction',
        'class-name': 'editor-tokenFunction',
        comment: 'editor-tokenComment',
        constant: 'editor-tokenProperty',
        deleted: 'editor-tokenProperty',
        doctype: 'editor-tokenComment',
        entity: 'editor-tokenOperator',
        function: 'editor-tokenFunction',
        important: 'editor-tokenVariable',
        inserted: 'editor-tokenSelector',
        keyword: 'editor-tokenAttr',
        namespace: 'editor-tokenVariable',
        number: 'editor-tokenProperty',
        operator: 'editor-tokenOperator',
        prolog: 'editor-tokenComment',
        property: 'editor-tokenProperty',
        punctuation: 'editor-tokenPunctuation',
        regex: 'editor-tokenVariable',
        selector: 'editor-tokenSelector',
        string: 'editor-tokenSelector',
        symbol: 'editor-tokenProperty',
        tag: 'editor-tokenProperty',
        url: 'editor-tokenOperator',
        variable: 'editor-tokenVariable',
    },
    // 添加缩进相关的主题类
    indent: 'editor-indent',
    // 添加表格相关的主题类
    table: 'editor-table',
    tableRow: 'editor-table-row',
    tableCell: 'editor-table-cell',
    tableCellHeader: 'editor-table-cell-header',
    // 添加可折叠容器相关的主题类
    collapsibleContainer: 'collapsible-container',
    collapsibleTitle: 'collapsible-title',
    collapsibleContent: 'collapsible-content',
};

function Placeholder() {
    const { t } = useI18n();
    return <div className="editor-placeholder">{t('Start writing...')}</div>;
}

/**
 * 创建限制大小的历史状态
 * @param maxSize 最大历史记录数量
 */
function createLimitedHistoryState(maxSize: number): HistoryState {
    const historyState = createEmptyHistoryState();

    // 创建一个代理来限制历史记录大小
    const originalPush = Array.prototype.push;

    // 限制undo栈大小
    if (historyState.undoStack) {
        historyState.undoStack.push = function(...items) {
            const result = originalPush.apply(this, items);
            if (this.length > maxSize) {
                this.splice(0, this.length - maxSize);
            }
            return result;
        };
    }

    // 限制redo栈大小
    if (historyState.redoStack) {
        historyState.redoStack.push = function(...items) {
            const result = originalPush.apply(this, items);
            if (this.length > maxSize) {
                this.splice(0, this.length - maxSize);
            }
            return result;
        };
    }

    return historyState;
}

const LexicalEditor = forwardRef<LexicalEditorRef, LexicalEditorProps>(({
    readOnly = false,
    value = '',
    onChange,
    onClickLink: _onClickLink,
    onHoverLink: _onHoverLink,
    className = '',
    noteId,
}, ref) => {
    const height = use100vh();
    const mounted = useMounted();

    // 创建历史状态引用
    const historyStateRef = useRef<HistoryState | null>(null);

    // 创建限制大小的历史状态
    const limitedHistoryState = useMemo(() => {
        const state = createLimitedHistoryState(50);
        historyStateRef.current = state;
        return state;
    }, []);

    // 历史清理函数
    const clearHistory = useCallback(() => {
        if (historyStateRef.current) {
            // 清空undo和redo栈
            historyStateRef.current.undoStack.length = 0;
            historyStateRef.current.redoStack.length = 0;
            historyStateRef.current.current = null;
        }
    }, []);

    // 创建统一的编辑器管理器
    const editorManager = useMemo(() => {
        const manager = new UnifiedEditorManager({
            debounceDelay: 300,
            debug: false, // 关闭调试日志
            onSave: async (event) => {
                if (onChange) {
                    onChange(event.jsonContent);
                }
            },
            onError: (error) => {
                console.error('Editor error:', error);
            },
            onHistoryClear: clearHistory // 添加历史清理回调
        });
        return manager;
    }, [onChange, clearHistory]);

    // 当 noteId 变化时更新管理器
    useEffect(() => {
        if (noteId) {
            editorManager.setNoteId(noteId);
        }
    }, [editorManager, noteId]);

    // 当组件卸载时清理管理器
    useEffect(() => {
        return () => {
            editorManager.destroy();
        };
    }, [editorManager]);

    const initialConfig = {
        namespace: 'LexicalEditor',
        theme,
        onError(error: Error) {
            console.error('Lexical Error:', error);
        },
        nodes: [
            HeadingNode,
            ListNode,
            ListItemNode,
            QuoteNode,
            CodeNode,
            CodeHighlightNode,
            AutoLinkNode,
            LinkNode,
            ImageNode,
            HorizontalRuleNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            CollapsibleContainerNode,
            CollapsibleTitleNode,
            CollapsibleContentNode,
        ],
        editable: !readOnly,
        // 初始内容将通过 ContentSyncPlugin 处理
        editorState: null,
    };

    // 创建自定义transformers，包含图片支持
    const IMAGE_TRANSFORMER: ElementTransformer = {
        dependencies: [ImageNode],
        export: (node) => {
            if (!$isImageNode(node)) {
                return null;
            }
            return `![${node.getAltText()}](${node.getSrc()})`;
        },
        regExp: /!\[([^\]]*)\]\(([^)]+)\)/,
        replace: (parentNode, children, match) => {
            const [, altText, src] = match;
            const imageNode = $createImageNode({
                altText,
                src,
                maxWidth: 800, // 设置最大宽度
            });
            children.forEach(child => child.remove());
            parentNode.append(imageNode);
        },
        type: 'element',
    };

    // 创建自定义的下划线转换器，使用 <u>text</u> 语法
    const UNDERLINE_TRANSFORMER: TextFormatTransformer = {
        format: ['underline'],
        tag: '<u>',
        type: 'text-format',
    };

    // 暂时移除段落缩进转换器，因为它与 Lexical 的内部状态管理冲突
    // 段落缩进功能在编辑器中正常工作，但 markdown 序列化不支持
    // 如果需要保存缩进，建议使用 HTML 格式或 JSON 格式

    // 创建水平分割线转换器
    const HR_TRANSFORMER: ElementTransformer = {
        dependencies: [HorizontalRuleNode],
        export: (node) => {
            return $isHorizontalRuleNode(node) ? '---' : null;
        },
        regExp: /^(---|\*\*\*|___)\s?$/,
        replace: (parentNode, _children, _match, isImport) => {
            const line = $createHorizontalRuleNode();
            if (isImport || parentNode.getNextSibling() != null) {
                parentNode.replace(line);
            } else {
                parentNode.insertBefore(line);
            }
            line.selectNext();
        },
        type: 'element',
    };

    // 创建Table转换器 - 支持Typora格式的markdown表格
    const TABLE_TRANSFORMER: ElementTransformer = {
        dependencies: [TableNode, TableRowNode, TableCellNode],
        export: (node, traverseChildren) => {
            if (!$isTableNode(node)) {
                return null;
            }

            const rows = node.getChildren();
            let markdown = '\n';

            rows.forEach((row, rowIndex) => {
                if ($isTableRowNode(row)) {
                    const cells = row.getChildren();
                    const cellTexts = cells.map(cell => {
                        if ($isTableCellNode(cell)) {
                            return traverseChildren(cell).trim() || ' ';
                        }
                        return ' ';
                    });

                    markdown += '| ' + cellTexts.join(' | ') + ' |\n';

                    // 添加表头分隔符（第一行后）
                    if (rowIndex === 0) {
                        markdown += '| ' + cellTexts.map(() => '---').join(' | ') + ' |\n';
                    }
                }
            });

            return markdown + '\n';
        },
        regExp: /^\|(.+)\|$/,
        replace: (_parentNode, _children, _match, _isImport) => {
            // 简单的table行检测，实际解析在导入时处理
            // 这里只是为了满足接口要求
            return false;
        },
        type: 'element',
    };

    // 重新排序transformers，确保CHECK_LIST优先级高于UNORDERED_LIST
    const customTransformers = [
        // 首先放置CHECK_LIST，确保checkbox优先匹配
        CHECK_LIST,
        // 然后是其他TRANSFORMERS（但要排除重复的CHECK_LIST）
        ...TRANSFORMERS.filter(t => t !== CHECK_LIST),
        // 最后是自定义的转换器
        HR_TRANSFORMER,
        UNDERLINE_TRANSFORMER,
        IMAGE_TRANSFORMER,
        TABLE_TRANSFORMER
    ];

    // 简化的 onChange 处理 - 直接使用统一管理器
    const handleChange = useCallback((editorState: EditorState, _editor: any, tags: Set<string>) => {
        editorManager.handleEditorChange(editorState, tags);
    }, [editorManager]);

    // 列表退出处理插件 - 处理Enter+Enter退出列表的逻辑
    const ListExitPlugin = () => {
        const [editor] = useLexicalComposerContext();

        useEffect(() => {
            return editor.registerCommand(
                KEY_ENTER_COMMAND,
                (event: KeyboardEvent | null) => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) {
                        return false;
                    }

                    const anchorNode = selection.anchor.getNode();

                    // 检查是否在空的列表项中
                    if ($isListItemNode(anchorNode)) {
                        const textContent = anchorNode.getTextContent().trim();

                        if (textContent === '') {
                            const listNode = anchorNode.getParent();

                            if ($isListNode(listNode)) {
                                // 如果是空的列表项，退出列表
                                event?.preventDefault();

                                // 创建新段落并在列表后插入
                                const paragraph = $createParagraphNode();
                                listNode.insertAfter(paragraph);

                                // 删除空的列表项
                                anchorNode.remove();

                                // 选中新段落
                                paragraph.select();

                                return true;
                            }
                        }
                    }

                    return false;
                },
                COMMAND_PRIORITY_HIGH
            );
        }, [editor]);

        return null;
    };

    // 提取内容格式检测函数
    const isJSONFormat = useCallback((content: string): boolean => {
        const trimmed = content.trim();
        return trimmed.startsWith('{') && trimmed.endsWith('}');
    }, []);



    // 内容同步组件 - 支持 JSON 格式
    const ContentSyncPlugin = () => {
        const [editor] = useLexicalComposerContext();

        useEffect(() => {
            if (editor && value !== undefined && mounted) {
                editor.getEditorState().read(() => {
                    const currentStateJSON = JSON.stringify(editor.getEditorState().toJSON());
                    if (currentStateJSON !== value) {
                        try {
                            if (isJSONFormat(value)) {
                                // JSON 格式 - 直接设置编辑器状态
                                const editorState = editor.parseEditorState(value);
                                editor.setEditorState(editorState);
                            } else if (value.trim() === '') {
                                // 空内容 - 创建空编辑器
                                editor.update(() => {
                                    const root = $getRoot();
                                    root.clear();
                                    const paragraph = $createParagraphNode();
                                    root.append(paragraph);
                                }, { tag: 'content-sync' });
                            } else {
                                // 兼容旧的 Markdown 格式（迁移期间）
                                editor.update(() => {
                                    $convertFromMarkdownString(value, customTransformers);
                                }, { tag: 'content-sync' });
                            }
                        } catch (error) {
                            console.error('ContentSync error:', error);
                            // 出错时创建空编辑器
                            editor.update(() => {
                                const root = $getRoot();
                                root.clear();
                                const paragraph = $createParagraphNode();
                                root.append(paragraph);
                            }, { tag: 'content-sync' });
                        }
                    }
                });
            }
        }, [editor, value, mounted]);

        return null;
    };

    useImperativeHandle(ref, () => ({
        focusAtEnd: () => {
            // TODO: Implement focus at end
        },
        focusAtStart: () => {
            // TODO: Implement focus at start
        },
    }));

    if (!mounted) {
        return null;
    }

    return (
        <div className={`lexical-editor ${className}`}>
            <LexicalComposer initialConfig={initialConfig}>
                <div className="editor-container">
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable
                                className="editor-input focus:outline-none w-full"
                                style={{
                                    minHeight: `calc(${height ? height + 'px' : '100vh'} - 14rem)`
                                }}
                                spellCheck={false}
                            />
                        }
                        placeholder={<Placeholder />}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin delay={1000} externalHistoryState={limitedHistoryState} />
                    <AutoFocusPlugin />
                    <LinkPlugin />
                    <ListPlugin />
                    <MarkdownShortcutPlugin transformers={customTransformers} />
                    <SlashCommandsPlugin />
                    <FloatingToolbarPlugin />
                    <CheckListPlugin />
                    <TabIndentationPlugin />
                    <HorizontalRulePlugin />
                    <ImagePlugin />
                    <HighlightPlugin />
                    <CodeBlockPlugin />
                    <CollapsiblePlugin />
                    <LazyPluginLoader enableTable={true} enableTextAlign={true} />
                    <IMEPlugin enabled={true} debug={process.env.NODE_ENV === 'development'} />

                    <ListExitPlugin />

                    {/* 内容同步和onChange监听器 */}
                    <ContentSyncPlugin />
                    <OnChangePlugin
                        onChange={handleChange}
                        ignoreHistoryMergeTagChange={true}
                        ignoreSelectionChange={true}
                    />
                </div>
            </LexicalComposer>

        </div>
    );
});

LexicalEditor.displayName = 'LexicalEditor';

export default LexicalEditor;
