import { ItemView, WorkspaceLeaf, Notice, TFile, requestUrl, MarkdownRenderer, MarkdownView } from 'obsidian';
import DeepSeekPlugin from './main';

export const DEEPSEEK_VIEW_TYPE = 'deepseek-chat-view';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string | null;
    tool_calls?: Array<{ id: string, type: string, function: { name: string, arguments: string } }>;
    tool_call_id?: string;
    name?: string;
}

export class DeepSeekView extends ItemView {
    plugin: DeepSeekPlugin;
    chatContainer!: HTMLElement;
    inputEl!: HTMLTextAreaElement;
    messageHistory: ChatMessage[] = [];
    lastSelection: string = '';

    constructor(leaf: WorkspaceLeaf, plugin: DeepSeekPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return DEEPSEEK_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'DeepSeek Note Helper';
    }

    getIcon(): string {
        return 'bot';
    }

    async onOpen() {
        await Promise.resolve();
        // Cache selection aggressively so losing focus doesn't drop it
        this.registerEvent(
            this.app.workspace.on('editor-change', (editor) => {
                const selection = editor.getSelection();
                if (selection) {
                    this.lastSelection = selection;
                }
            })
        );

        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();
        container.addClass('deepseek-chat-container');

        container.createEl('h4', { text: 'DeepSeek chat', cls: 'chat-h4' });

        this.chatContainer = container.createDiv({ cls: 'chat-messages' });
        const inputContainer = container.createDiv({ cls: 'chat-input-container' });
        this.inputEl = inputContainer.createEl('textarea', { cls: 'chat-input' });
        this.inputEl.placeholder = 'Type your message... (Shift+Enter for newline, Enter to send)';
        const sendBtn = inputContainer.createEl('button', { text: 'Send' });
        sendBtn.addClass('mod-cta');
        sendBtn.addEventListener('click', () => this.handleSend());

        this.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent default newline
                this.handleSend().catch(console.error);
            }
        });

        // Initial greeting
        this.appendMessage('assistant', 'Hello! Ask me anything. If you highlight text in your note, I will remember it and focus on that. I can also search your entire vault or update your note metadata if you ask me to!');
    }

    async handleSend() {
        const instruction = this.inputEl.value.trim();
        if (!instruction) return;

        this.appendMessage('user', instruction);
        this.inputEl.value = '';

        let contextString = '';
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

        // Fallback getting active view directly just in case event missed it, but prioritize cache if exists
        if (activeView) {
            const currentSelection = activeView.editor.getSelection();
            if (currentSelection) {
                this.lastSelection = currentSelection;
            }
        }

        const activeFile = this.app.workspace.getActiveFile();
        let linkedNotesContext = '';

        if (activeFile) {
            // Attempt to fetch bidirectional links
            const cache = this.app.metadataCache.getFileCache(activeFile);
            if (cache && cache.links) {
                const uniqueLinks = Array.from(new Set(cache.links.map(l => l.link)));
                for (const linkPath of uniqueLinks) {
                    const linkedFile = this.app.metadataCache.getFirstLinkpathDest(linkPath, activeFile.path);
                    if (linkedFile instanceof TFile && linkedFile.extension === 'md') {
                        const linkedContent = await this.app.vault.read(linkedFile);
                        const truncatedContent = linkedContent.length > 1500 ? linkedContent.substring(0, 1500) + '... (truncated)' : linkedContent;
                        linkedNotesContext += `\n--- Linked Note: [[${linkedFile.basename}]] ---\n${truncatedContent}\n`;
                    }
                }
            }
        }

        if (this.lastSelection && activeFile) {
            contextString = `\n\n[System Info: The user highlighted the following text in the note "${activeFile.name}". Focus your answer specifically around this highlighted text:\n---\n${this.lastSelection}\n---]`;
            // Clear it after using it so it doesn't leak into unrelated future queries
            this.lastSelection = '';
        } else if (activeFile) {
            const content = await this.app.vault.read(activeFile);
            contextString = `\n\n[System Info: The user is currently viewing the note "${activeFile.name}". Its full content is:\n---\n${content}\n---]`;
        }

        if (linkedNotesContext) {
            contextString += `\n\n[System Info: The active note contains links to the following notes. Here is their content for additional context:\n${linkedNotesContext}]`;
        }

        try {
            const prompt = instruction + contextString;

            const messages: ChatMessage[] = [
                { role: 'system', content: 'You are a helpful AI assistant integrated into Obsidian. You can converse naturally with the user. If they provide note context, use it to answer their questions or help them brainstorm.' }
            ];

            const recentHistory = this.messageHistory.slice(-10);
            recentHistory.forEach(msg => messages.push(msg));

            // We only send the new prompt with context this time
            messages.push({ role: 'user', content: prompt });

            await this.processConversationStream(messages, prompt);
        } catch (error) {
            console.error('DeepSeek Error:', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            new Notice('DeepSeek API Error: ' + errorMsg);
            this.appendMessage('system', 'Error: ' + errorMsg);
        }
    }

    async appendMessage(role: 'user' | 'assistant' | 'system' | 'tool', text: string) {
        if (role !== 'system' && role !== 'tool') {
            this.messageHistory.push({ role, content: text });
        }

        const msgDiv = this.chatContainer.createDiv({ cls: `chat-msg role-${role}` });
        const senderName = role === 'user' ? 'You' : (role === 'assistant' ? 'DeepSeek' : (role === 'tool' ? 'Tool' : 'System'));

        const headerDiv = msgDiv.createDiv({ cls: 'msg-header' });
        headerDiv.createEl('strong', {
            text: senderName,
            cls: 'chat-sender-label'
        });

        if (role === 'assistant') {
            const copyBtn = headerDiv.createEl('button', {
                text: 'Copy',
                cls: 'clickable-icon chat-copy-btn'
            });
            copyBtn.addEventListener('click', () => {
                (async () => {
                    await navigator.clipboard.writeText(text);
                    copyBtn.innerText = 'Copied!';
                    setTimeout(() => { copyBtn.innerText = 'Copy'; }, 2000);
                })().catch(console.error);
            });
        }

        const contentDiv = msgDiv.createDiv({ cls: 'msg-content' });

        if (role === 'user' || role === 'system' || role === 'tool') {
            contentDiv.addClass('chat-whitespace-pre');
            contentDiv.innerText = text;
            msgDiv.addClass(role === 'user' ? 'chat-msg-user' : 'chat-msg-system');
        } else {
            msgDiv.addClass('chat-msg-assistant');
            // Render markdown for assistant responses
            await MarkdownRenderer.render(this.app, text, contentDiv, '', this);
        }

        this.chatContainer.scrollTo(0, this.chatContainer.scrollHeight);
    }

    async executeSearchVault(query: string): Promise<string> {
        const files = this.app.vault.getMarkdownFiles();
        const results = [];
        const lowerQuery = query.toLowerCase();

        // Sort files by last modified to get most recent relevant stuff
        files.sort((a, b) => b.stat.mtime - a.stat.mtime);

        for (const file of files) {
            const content = await this.app.vault.cachedRead(file);
            if (content.toLowerCase().includes(lowerQuery) || file.basename.toLowerCase().includes(lowerQuery)) {
                const matchIndex = content.toLowerCase().indexOf(lowerQuery);
                const start = Math.max(0, matchIndex - 100);
                const end = Math.min(content.length, matchIndex + 300);
                results.push(`--- File: [[${file.basename}]] ---\n...${content.substring(start, end)}\n`);
                if (results.length >= 5) break; // Limit to 5 results to avoid token blowup
            }
        }

        if (results.length === 0) {
            return `No files found matching "${query}".`;
        }
        return `Found ${results.length} files matching "${query}":\n\n` + results.join('\n\n');
    }

    async executeUpdateMetadata(properties: Record<string, string | number | boolean | string[]>): Promise<string> {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return "Error: No active file to update.";

        try {
            await this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
                for (const [key, value] of Object.entries(properties)) {
                    frontmatter[key] = value;
                }
            });
            return `Successfully updated metadata for ${activeFile.basename}.`;
        } catch (e) {
            return `Failed to update metadata: ${e instanceof Error ? e.message : String(e)}`;
        }
    }

    async executeCreateNote(path: string, content: string): Promise<string> {
        try {
            // Ensure path ends with .md
            if (!path.endsWith('.md')) path += '.md';

            // Normalize path (remove leading slash if present)
            const normalizedPath = path.replace(/^\//, '');

            const fileExists = this.app.vault.getAbstractFileByPath(normalizedPath);
            if (fileExists) {
                return `Error: File already exists at path ${normalizedPath}`;
            }

            await this.app.vault.create(normalizedPath, content);
            return `Successfully created new note at ${normalizedPath}`;
        } catch (e) {
            return `Failed to create note: ${e instanceof Error ? e.message : String(e)}`;
        }
    }

    async executeAppendToNote(path: string, content: string): Promise<string> {
        try {
            if (!path.endsWith('.md')) path += '.md';
            const normalizedPath = path.replace(/^\//, '');
            const file = this.app.vault.getAbstractFileByPath(normalizedPath);

            if (!file || !(file instanceof TFile)) {
                return `Error: Markdown file not found at path ${normalizedPath}`;
            }

            await this.app.vault.append(file, '\n' + content);
            return `Successfully appended content to ${normalizedPath}`;
        } catch (e) {
            return `Failed to append to note: ${e instanceof Error ? e.message : String(e)}`;
        }
    }

    async executeModifyDirectory(directoryPath: string, instruction: string): Promise<string> {
        await Promise.resolve();
        try {
            const normalizedPath = directoryPath.replace(/^\//, '').replace(/\/$/, '');
            const folder = normalizedPath === '' ? this.app.vault.getRoot() : this.app.vault.getAbstractFileByPath(normalizedPath);

            if (!folder) {
                return `Error: Directory not found at path ${normalizedPath || '/'}`;
            }

            // In a real production environment, you would want to confirm this with the user via a modal.
            // For now, we will return a message instructing the AI that it needs user permission first,
            // or we just execute it directly as requested since the user approved the plan.

            // To be safe but functional for the prompt, we'll execute it, but we won't actually let the AI rewrite 
            // the whole file in one function without seeing it. Instead, we'll tell the AI what files are there and ask it to use append/modify.
            // Actually, the plan says "bulk modify". Let's just return the list of files to the AI so it can call `append_to_note` or `update_metadata` on them iteratively.
            // Doing a full bulk string replace in one prompt is too risky.

            const markdownFiles: TFile[] = [];

            // Recursive helper to get all MD files
            const getFiles = (f: import("obsidian").TAbstractFile | any) => {
                if (f.children) {
                    for (const child of f.children) {
                        getFiles(child);
                    }
                } else if (f instanceof TFile && f.extension === 'md') {
                    markdownFiles.push(f);
                }
            };

            getFiles(folder);

            if (markdownFiles.length === 0) {
                return `No markdown files found in directory ${normalizedPath || '/'}`;
            }

            // We return a list of paths back to the model, instructing it to use the other tools to actually make the changes.
            const filePaths = markdownFiles.map(f => f.path).join(', ');
            return `Found ${markdownFiles.length} files in directory ${normalizedPath || '/'}. The files are: ${filePaths}. \nTo apply the instruction "${instruction}", please call 'update_metadata' or 'append_to_note' on these files one by one.`;
        } catch (e) {
            return `Failed to process directory: ${e instanceof Error ? e.message : String(e)}`;
        }
    }

    async processConversationStream(messages: ChatMessage[], originalUserPrompt: string) {
        const { apiKey, apiUrl, model } = this.plugin.settings;
        if (!apiKey) {
            throw new Error('API Key not set in settings.');
        }

        const tools = [
            {
                type: "function",
                function: {
                    name: "search_vault",
                    description: "Search the entire Obsidian vault for files matching a keyword query. Use this when the user asks about past files, vault contents, or broader knowledge outside the current note.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "The keyword or phrase to search for." }
                        },
                        required: ["query"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "update_metadata",
                    description: "Update the YAML frontmatter / metadata of the active note. Use this if the user asks you to add tags, change status, or edit properties.",
                    parameters: {
                        type: "object",
                        properties: {
                            properties: {
                                type: "object",
                                description: "Key-value pairs to set in the frontmatter. For tags, use an array of strings."
                            }
                        },
                        required: ["properties"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "create_note",
                    description: "Create a new markdown note in the vault at the specified path.",
                    parameters: {
                        type: "object",
                        properties: {
                            path: { type: "string", description: "The path including filename where the note should be created, e.g. 'Daily/2026-01-01.md'." },
                            content: { type: "string", description: "The initial markdown content of the new note." }
                        },
                        required: ["path", "content"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "append_to_note",
                    description: "Append new content to the end of an existing note.",
                    parameters: {
                        type: "object",
                        properties: {
                            path: { type: "string", description: "The path of the existing note, e.g. 'Ideas/Project.md'." },
                            content: { type: "string", description: "The content to append to the end of the note." }
                        },
                        required: ["path", "content"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "modify_files_in_directory",
                    description: "Get a list of all markdown files in a directory to perform bulk operations.",
                    parameters: {
                        type: "object",
                        properties: {
                            directory_path: { type: "string", description: "The path of the directory to scan, e.g. 'Work/Projects'. Use '/' for the root vault." },
                            instruction: { type: "string", description: "A description of what needs to be changed across these files." }
                        },
                        required: ["directory_path", "instruction"]
                    }
                }
            }
        ];

        // Prepare UI for streaming response
        const msgDiv = this.chatContainer.createDiv({ cls: `chat-msg role-assistant` }); msgDiv.addClass('chat-msg-assistant');

        const headerDiv = msgDiv.createDiv({ cls: 'msg-header' });
        const senderLabel = headerDiv.createEl('strong', {
            text: 'DeepSeek (thinking...)',
            cls: 'chat-sender-label'
        });

        const copyBtn = headerDiv.createEl('button', {
            text: 'Copy',
            cls: 'clickable-icon chat-copy-btn chat-hidden'
        });

        const contentDiv = msgDiv.createDiv({ cls: 'msg-content' });
        let fullResponse = '';
        let toolCall: { id: string, name: string, arguments: string } | null = null;

        try {

            const requestBody = {
                model: model,
                messages: messages,
                stream: false, // Streaming removed to satisfy Obsidian review bot (fetch -> requestUrl)
                tools: tools
            };

            const response = await requestUrl({
                url: `${apiUrl}/chat/completions`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (response.status !== 200) {
                throw new Error(`API returned status ${response.status}: ${response.text}`);
            }

            const data = response.json;
            if (data.choices && data.choices[0].message) {
                const message = data.choices[0].message;
                if (message.content) {
                    fullResponse = message.content;
                    contentDiv.innerText = fullResponse;
                    this.chatContainer.scrollTo(0, this.chatContainer.scrollHeight);
                }

                if (message.tool_calls) {
                    for (const tc of message.tool_calls) {
                        if (!toolCall) {
                            toolCall = { id: tc.id, name: tc.function?.name || '', arguments: '' };
                        }
                        if (tc.function?.arguments) {
                            toolCall.arguments += tc.function.arguments;
                        }
                    }
                }
            }
            if (toolCall) {
                senderLabel.innerText = `DeepSeek (running ${toolCall.name}...)`;
                let toolResult = '';

                try {
                    const args = JSON.parse(toolCall.arguments || '{}');
                    if (toolCall.name === 'search_vault') {
                        toolResult = await this.executeSearchVault(args.query);
                    } else if (toolCall.name === 'update_metadata') {
                        toolResult = await this.executeUpdateMetadata(args.properties);
                    } else if (toolCall.name === 'create_note') {
                        toolResult = await this.executeCreateNote(args.path, args.content);
                    } else if (toolCall.name === 'append_to_note') {
                        toolResult = await this.executeAppendToNote(args.path, args.content);
                    } else if (toolCall.name === 'modify_files_in_directory') {
                        toolResult = await this.executeModifyDirectory(args.directory_path, args.instruction);
                    } else {
                        toolResult = `Error: Unknown tool ${toolCall.name}`;
                    }
                } catch (e) {
                    toolResult = `Error executing tool: ${e instanceof Error ? e.message : String(e)}`;
                }

                // Optional: show user what tool ran
                msgDiv.addClass('chat-msg-tool');
                contentDiv.innerText = `=> Used tool: ${toolCall.name}\n=> Result: ${toolResult.substring(0, 50)}...`;

                // Append assistant tool call request
                messages.push({
                    role: 'assistant',
                    content: null,
                    tool_calls: [
                        {
                            id: toolCall.id,
                            type: 'function',
                            function: {
                                name: toolCall.name,
                                arguments: toolCall.arguments
                            }
                        }
                    ]
                });

                // Append tool result
                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    name: toolCall.name,
                    content: toolResult
                });

                // Recurse to let model generate final text based on tool result
                await this.processConversationStream(messages, originalUserPrompt);
                msgDiv.remove(); // Clean up intermediate tool message if we wanted, or keep it. Let's remove it to keep UI clean.
                return;
            }

            // Streaming complete without tool call. Render final markdown and save to history.
            senderLabel.innerText = 'DeepSeek';
            copyBtn.removeClass('chat-hidden');
            copyBtn.addEventListener('click', () => {
                (async () => {
                    await navigator.clipboard.writeText(fullResponse);
                    copyBtn.innerText = 'Copied!';
                    setTimeout(() => { copyBtn.innerText = 'Copy'; }, 2000);
                })().catch(console.error);
            });
            contentDiv.innerHTML = ''; // Clear raw text
            await MarkdownRenderer.render(this.app, fullResponse, contentDiv, '', this);

            // Replace system prompt context with generic user prompt for history to save tokens for next round
            if (originalUserPrompt) {
                const cleanPrompt = originalUserPrompt.split('\n\n[System Info')[0];
                // Make sure we haven't already pushed this prompt in a previous recursive step
                if (this.messageHistory.length === 0 || this.messageHistory[this.messageHistory.length - 1].content !== cleanPrompt) {
                    this.messageHistory.push({ role: 'user', content: cleanPrompt });
                }
            }

            this.messageHistory.push({ role: 'assistant', content: fullResponse });

        } catch (e) {
            msgDiv.remove();
            throw e;
        }
    }
}
