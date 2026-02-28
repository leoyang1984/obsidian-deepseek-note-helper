# Obsidian DeepSeek Plugin - Developer Documentation

> **致未来的 AI 开发者：**
> 这份文档记录了我们在开发 Obsidian 侧边栏 DeepSeek 智能助手插件时的**架构决策、踩坑实录以及最终的解决方案**。
> 当用户让你开发新的 Obsidian 插件、或者对本项目进行二次开发时，**请务必先阅读本文档**，这可以帮你避开很多我们曾经踩过的历史大坑。

---

## 🏗️ 架构演进与血泪史 (Architecture & Pitfalls)

### ❌ 第一版架构：Svelte 现代前端框架 (已废弃)
- **初衷**：一开始为了在 Obsidian 侧边栏构建现代化的聊天 UI（状态管理、组件化等），我决定使用现成的 `svelte-obsidian-plugin-template` 或者直接引入 Svelte + NPM 依赖。
- **痛点与报错**：
  在用户的 macOS 本地环境下构建时，遇到了极难缠的 **NPM 权限问题和全局缓存问题**（如 `EACCES: permission denied, mkdir '/Users/jwq/.npm/_cacache/...'` 和 Svelte 依赖包写入错误）。
- **用户干预**：
  由于反复解决 NPM 构建错误消耗了大量时间而无法看到功能产出，用户指示我：“**别死磕这个架构了，换一个简单可行的**”。
- **教训**：对于本地跑大模型辅助开发的 Obsidian 插件，**轻量和零外部编译依赖是首要考量**。不要一上来就搞笨重的前端框架。

### ✅ 最终架构：Vanilla TypeScript + 原生 DOM API (成功运行)
- **解决方案**：我抛弃了所有的 UI 框架（React/Vue/Svelte），退回到了纯 **Vanilla TypeScript** 搭配 Obsidian 的原生 DOM 创建 API（如 `containerEl.createDiv()`、`containerEl.createEl('h4')` 等）。
- **构建工具**：仅使用官方推荐的最精简的 `esbuild` 作为打包器（`esbuild.config.js`），连 Webpack/Vite 都不用。
- **结果**：
  构建速度极快（通常在 10ms - 30ms），没有任何 NPM 依赖地狱，且与 Obsidian 的 UI 结合得非常原生（颜色变量直接复用 `var(--background-primary)` 等）。

---

## 🛠️ 核心功能实现逻辑 (Implementation Details)

### 1. 聊天界面与 Markdown 渲染
- **UI 挂载点**：在 `view.ts` 中注册 `ItemView`，并将其挂载到 `WorkspaceLeaf.getRightLeaf()` 作为右侧边栏。
- **Markdown 渲染**：对于 DeepSeek 返回的回答，**坚决不要自己写解析器！** 必须使用 Obsidian 提供的官方底层 API：
  `await MarkdownRenderer.render(this.app, text, targetDiv, sourcePath, viewComponent)`
  这样可以完美支持加粗、列表、代码块高亮甚至 Obsidian 特有的双链渲染。

### 2. DeepSeek 流式输出 (Streaming Response)
- 用户对等待几秒钟出大段文字的体验非常反感。
- 必须使用 `fetch` 开启 `stream: true` 模式。
- 通过 `response.body.getReader()` 逐字读取返回的 SSE (Server-Sent Events) 数据块：
  ```typescript
  // 关键解析循环：
  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ') && line !== 'data: [DONE]') { // 解析 JSON delta }
  }
  ```
- **渲染踩坑**：流式传输时，由于字符是一个一个冒出来的，如果每个字符都调用一遍 `MarkdownRenderer` 会导致严重的性能卡顿和 DOM 闪烁。
  **正确做法**：在流式输出过程中，仅使用普通的 `contentDiv.innerText = partText` 渲染纯文本；等到 `[DONE]` 信号流式输出完全结束后，再一口气调用 `MarkdownRenderer.render` 把完整的文本转化为 Markdown 富文本。

### 3. 上下文获取与焦点记忆 (Context Awareness)
- **自动获取全篇**：通过 `this.app.workspace.getActiveFile()` 和 `this.app.vault.read()` 获取当前激活的笔记全文喂给 AI。
- **“局部选中”记忆痛点**：用户在高亮一段文字后，如果用鼠标去点击侧边栏的输入框，主编辑器会失焦（blur），导致高亮文本消失，`editor.getSelection()` 抓取不到内容。
  **解决方案**：在 `onOpen()` 中注册原生的 `editor-change` 事件持续监听。当有任意高亮产生时，主动存入插件的 `this.lastSelection` 变量中缓存，提问消费后清空缓存。

### 4. 工具调用 (Function Calling / Tool Calling)
插件原生集成了大模型的 Tool Calling 格式，使得 AI 能像 Agent 一样自主干预 Obsidian：
- **`search_vault(query)` (RAG检索)**：
  调用 `this.app.vault.getMarkdownFiles()` 和 `app.vault.cachedRead()` 获取全库文件进行关键字检索，并将切片传回给模型。
- **`update_metadata(properties)` (修改属性)**：
  调用官方原生 API `this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => { ... })` 安全地修改 YAML 区域，避免正则表达式破坏文档。

---

## 📝 总结 & 给后来者的建议

1. **Keep it simple, stupid (KISS原则)**：写 Obsidian 插件，原生 DOM (`createEl`, `createDiv`) 配合原生的 CSS 变量 (`var(--text-normal)`) 永远是最稳定、跨设备支持最好的做法。
2. **永远拥抱原生 API**：无论是渲染 Markdown（`MarkdownRenderer`）、读写文件（`vault.read/modify`）、还是修改属性（`fileManager.processFrontMatter`），都不要尝试引入过重的第三方 Node 库。
3. **性能优先**：AI 插件容易产生大量的文本和计算。注意控制传给模型的上下文长度（例如拦截双向链接内容时强制 `substring(0, 1500)`），避免爆显存/Token耗尽。
4. **记住这句魔法指令**：如果代码写坏了，随时运行 `node esbuild.config.js production` 测试编译是否仍然能以毫秒级通过。

---

## 🏆 三阶进化实录与核心范式 (The 3-Phase Agentic Playbook)

我们在不到一天的极短时间内，以毫无 Bug 的丝滑节奏完成了此插件从零到“全自动 Agent”的三阶段进化。以下是每一阶段的核心解法路径，请未来的 AI 开发者在复刻或扩展时**严格参考这些成功范式**：

### Phase 1: 基础聊天与焦点记忆 (The Foundation)
**核心解法**：不要在每次发送消息时临时去抓取高亮。
1. **获取当前笔记全文**：`this.app.workspace.getActiveFile()` 配合 `this.app.vault.read(activeFile)`，这是最稳妥的获取全量文本的方式。
2. **克服“高亮丢失”魔咒**：用户从笔记点击侧边栏聊天框会导致编辑器失焦并清空选区。破局点在于**全局监听**。在 `onOpen` 中注册 `this.app.workspace.on('editor-change', ...)` 持续缓存用户的 `getSelection()`，在下一次提问时强制读取此缓存，读取后立即清空。

### Phase 2: 双向链接穿透与 RAG 检索 (Deep Knowledge)
**核心解法**：利用 Obsidian 缓存树，而不是粗暴正则。
1. **双链内容提取**：不要自己写 Regex 去提取 `[[xxx]]`。直接使用 `this.app.metadataCache.getFileCache(activeFile).links` 获取标准化链接对象，再通过 `app.metadataCache.getFirstLinkpathDest(linkPath, activeFile.path)` 获取真实的 `TFile` 对象并读取。
2. **RAG 检索 (`search_vault` 工具)**：利用 Tool Calling (Function Calling) 让 AI 自主检索。遍历 `this.app.vault.getMarkdownFiles()` 时，通过 `cachedRead` 读取文本。**要点**：必须对检索结果做硬性截断（如抛弃5个以上的结果，或者截取关键字前后 200 字符），否则必定撑爆模型的 Context Window 并引发 Rate Limit 或卡死。
3. **安全修改 Metadata**：严禁让 AI 吐出带有 Frontmatter 的全文让用户替换。破局点是利用 `this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => { frontmatter[key] = value })`，这是 Obsidian 官方提供的唯一绝对安全的 YAML 修改管道。

### Phase 3: 全自动文件操作系统 (Agentic Automation)
**核心解法**：赋予 AI 读写能力，但做好安全隔离。
1. **自动创建笔记 (`create_note`)**：必须将传入的路径做正则清理 `path.replace(/^\//, '')`（剔除根目录斜杠）并确保以 `.md` 结尾，然后调用 `this.app.vault.create(path, content)`。
2. **自动追加内容 (`append_to_note`)**：不要先 Read 再 Modify。直接使用效率翻倍的 `this.app.vault.append(file, '\n' + content)`。
3. **全库批量修改防护 (`modify_files_in_directory`)**：这是一个危险动作。**成功范式是“分离决策与执行”**。在暴露这个工具给 AI 时，工具的实现逻辑**不应该**直接去修改文件，而是应该通过 `getAbstractFileByPath` 递归扫描目录，将目录下的**所有文件路径清单**作为 Tool Result 返回给 AI。然后让 AI 基于这个清单，在流式对话中**循环调用**前两个安全的工具 (`update_metadata` 或 `append_to_note`) 逐一去修改这些文件。这既防止了一次性搞坏全库，又在侧边栏聊天中给留下了完整的操作日志。

> **终极总结**：开发 Obsidian AI Agent 插件的秘诀在于 —— **永远用官方的底层 API 干活，用最轻的 Vanilla TS 织网，把最复杂的逻辑运算和判断统统丢给大模型的 Tool Calling 机制去驱动。**
