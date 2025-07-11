/**
 * Lexical Markdown 处理器
 * 专门用于Lexical编辑器的markdown处理
 * Lexical编辑器直接处理markdown格式，不需要转换为HTML
 */
class LexicalMarkdownProcessor {

    /**
     * 对于Lexical编辑器，我们不需要将markdown转换为HTML
     * Lexical有自己的markdown解析器($convertFromMarkdownString)
     * 这个方法现在只是简单地返回清理后的markdown
     */
    processMarkdown(markdown: string): string {
        if (!markdown || markdown.trim() === '') {
            return '';
        }

        try {
            // 清理和标准化markdown内容
            let cleanMarkdown = markdown;

            // 1. 标准化换行符
            cleanMarkdown = cleanMarkdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            // 2. 清理开头和结尾的空白，但保留内容中的空行
            cleanMarkdown = cleanMarkdown.trim();

            // 3. 确保checkbox格式正确
            cleanMarkdown = cleanMarkdown.replace(/^(\s*)-\s*\[\s*\]\s*/gm, '$1- [ ] ');
            cleanMarkdown = cleanMarkdown.replace(/^(\s*)-\s*\[x\]\s*/gm, '$1- [x] ');

            return cleanMarkdown;
        } catch (error) {
            console.error('Error processing markdown:', error);
            return markdown; // 如果处理失败，返回原始内容
        }
    }

    /**
     * 检查内容是否看起来像 markdown
     */
    isMarkdownContent(content: string): boolean {
        if (!content || content.trim() === '') {
            return false;
        }

        // 检查常见的 markdown 语法
        const markdownPatterns = [
            /^#{1,6}\s+/m,           // 标题 # ## ###
            /^\*\s+/m,               // 无序列表 *
            /^-\s+/m,                // 无序列表 -
            /^\d+\.\s+/m,            // 有序列表 1.
            /^-\s+\[[ x]\]\s+/m,     // checkbox列表 - [ ] 或 - [x]
            /```[\s\S]*?```/,        // 代码块
            /`[^`]+`/,               // 行内代码
            /\*\*[^*]+\*\*/,         // 粗体
            /\*[^*]+\*/,             // 斜体
            /\[[^\]]+\]\([^)]+\)/,   // 链接
            /!\[[^\]]*\]\([^)]+\)/,  // 图片
            /^>\s+/m,                // 引用
            /^\|.*\|$/m,             // 表格
            /^---+$/m,               // 分隔线
        ];

        return markdownPatterns.some(pattern => pattern.test(content));
    }

    /**
     * 将 markdown 内容转换为 Lexical 编辑器的 JSON 格式
     * 使用临时的 Lexical 编辑器实例进行转换
     */
    async markdownToJSON(markdown: string): Promise<string> {
        if (!markdown || markdown.trim() === '') {
            return this.createEmptyEditorJSON();
        }

        try {
            // 动态导入 Lexical 相关模块
            const { createEditor } = await import('lexical');
            const { $convertFromMarkdownString, TRANSFORMERS } = await import('@lexical/markdown');

            // 创建临时编辑器实例
            const tempEditor = createEditor({
                nodes: [], // 使用默认节点
                onError: (error) => console.error('Temp editor error:', error),
            });

            let jsonResult = '';

            // 在编辑器中执行转换
            await new Promise<void>((resolve) => {
                tempEditor.update(() => {
                    // 清理和标准化markdown内容
                    const cleanMarkdown = this.processMarkdown(markdown);

                    // 将 markdown 转换为 Lexical AST
                    $convertFromMarkdownString(cleanMarkdown, TRANSFORMERS);
                    resolve();
                });
            });

            // 获取编辑器状态的 JSON
            const editorState = tempEditor.getEditorState();
            jsonResult = JSON.stringify(editorState.toJSON());

            return jsonResult;
        } catch (error) {
            console.error('Error converting markdown to JSON:', error);
            // 如果转换失败，返回包含原始内容的简单JSON
            return this.createSimpleTextJSON(markdown);
        }
    }

    /**
     * 创建空的 Lexical 编辑器 JSON 状态
     */
    private createEmptyEditorJSON(): string {
        return JSON.stringify({
            root: {
                children: [
                    {
                        children: [],
                        direction: null,
                        format: "",
                        indent: 0,
                        type: "paragraph",
                        version: 1
                    }
                ],
                direction: null,
                format: "",
                indent: 0,
                type: "root",
                version: 1
            }
        });
    }

    /**
     * 创建包含简单文本的 JSON 状态
     */
    private createSimpleTextJSON(text: string): string {
        return JSON.stringify({
            root: {
                children: [
                    {
                        children: [
                            {
                                detail: 0,
                                format: 0,
                                mode: "normal",
                                style: "",
                                text: text,
                                type: "text",
                                version: 1
                            }
                        ],
                        direction: null,
                        format: "",
                        indent: 0,
                        type: "paragraph",
                        version: 1
                    }
                ],
                direction: null,
                format: "",
                indent: 0,
                type: "root",
                version: 1
            }
        });
    }

    /**
     * 处理导入的内容
     * 前端处理：将markdown转换为JSON格式
     */
    async processImportedContent(content: string): Promise<string> {
        if (this.isMarkdownContent(content)) {
            console.log('Detected markdown content, converting to JSON for Lexical...');
            return await this.markdownToJSON(content);
        } else {
            console.log('Content does not appear to be markdown, treating as plain text...');
            // 如果不是markdown，创建包含原始内容的JSON
            return this.createSimpleTextJSON(content);
        }
    }

    /**
     * 验证markdown格式
     * 确保常见的markdown语法正确
     */
    validateMarkdown(markdown: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // 检查checkbox格式
        const invalidCheckboxes = markdown.match(/^(\s*)-\s*\[[^\sx ]\]/gm);
        if (invalidCheckboxes) {
            errors.push(`Invalid checkbox format found: ${invalidCheckboxes.join(', ')}`);
        }

        // 检查列表格式
        const lines = markdown.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 检查有序列表格式
            if (/^\s*\d+\.\s/.test(line)) {
                const match = line.match(/^\s*(\d+)\.\s/);
                if (match) {
                    const num = parseInt(match[1]);
                    // 这里可以添加更多的列表验证逻辑
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// 创建单例实例
const lexicalMarkdownProcessor = new LexicalMarkdownProcessor();

export default lexicalMarkdownProcessor;
