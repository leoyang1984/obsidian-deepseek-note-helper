---
tags:
  - obsidian-plugin
  - deepseek
  - ai-assistant
  - documentation
  - readme
  - user-guide
  - plugin-installation
  - feature-overview
  - knowledge-management
  - product-introduction
---
# Obsidian DeepSeek Plugin (DeepSeek Note Helper)

[English Version Below](#english-version) | [中文版往下看](#中文版) 

---

## English Version

A powerful plugin dedicated to seamlessly integrating **DeepSeek AI** into your Obsidian knowledge base workflow.

By summoning your personal AI assistant in the sidebar, it not only **reads and understands your notes**, but also **deeply penetrates your bidirectional links**, performs **vault-wide searches**, and **automatically manages your note metadata (YAML Properties)**. It is your ultimate tool for building a "Second Brain".

---

### 🌟 Core Highlights (Features)

#### 1. 🤖 A True "Knowledge Base Roaming Assistant"
- **Current Note Awareness**: Open any note, and the DeepSeek sidebar will automatically read its full content as memory context. You can directly ask: "Help me summarize this note" or "Polish the third paragraph".
- **Local Precision Focus (Selection Focus)**: **Highlight a piece of text** in the editor, and the AI will automatically lock onto it as the focus. Even if you lose focus by clicking into the sidebar to type, the plugin has **selection memory** to accurately answer questions regarding that specific highlighted text.

#### 2. 🔗 Bidirectional Link Context (Deep Resolution)
- AI is no longer "blindly feeling the elephant". If your current note contains `[[Bidirectional Links]]` pointing to other notes, the plugin will automatically follow the trail in the background, **feeding the content of the linked notes to the AI as well**.
- *Scenario Experience*: When reading "Project Architecture Design", if it references `[[Database Table Structure]]`, the AI can dynamically combine the content of both articles to provide a comprehensive answer.

#### 3. 🧠 Agentic Tool Calling (RAG & Vault Search)
- **Native Support for DeepSeek Function Calling**. When the AI determines that your request goes beyond the current note, it will automatically summon the following advanced magic tools:
  - **`search_vault` (Vault Search)**: Supports RAG-level (Retrieval-Augmented Generation) vault-wide search exploration.
  - **`create_note` (Create Note)**: It can create a brand new, well-formatted Markdown note in a specified folder based on your instructions.
  - **`append_to_note` (Append Record)**: Tell the AI to automatically "clip" the inspiration or summary you just discussed and seamlessly paste it to the end of a specified existing note.
  - **`modify_files_in_directory` (Bulk Directory Modification Review)**: When you ask it to make bulk modifications to an entire directory (e.g., `/Diary`), it will first scan all `.md` files in that directory. For safety, it will not overwrite the whole vault unauthorized, but will report the scanned files in the sidebar, ready to assist you in modifying them one by one using `update_metadata` or `append_to_note` in subsequent conversations.

#### 4. 🎛️ Metadata Automation Manager (YAML / Properties)
- The AI possesses the **`update_metadata`** tool with top-level rewrite permissions.
- You no longer need to manually add tags. You can instruct it: "Based on the core idea of this article, automatically add appropriate tags in the Properties area, and change the status to active." **The AI will automatically update the YAML Frontmatter for you, completely hands-free.**

#### 5. ⚡ Silky Smooth Interactive Experience
- **One-Click Copy**: Every AI-generated response has a Copy button in the top right corner, allowing you to quickly extract organized thoughts to your clipboard and seamlessly integrate them back into your notes.
- **Native Markdown Streaming Rendering**: Utilizing the DeepSeek Streaming API (typewriter effect) overlaid with Obsidian's native `MarkdownRenderer`, all complex formatting (bold, lists, code blocks) is rendered perfectly word by word, eliminating anxious waiting times.
- **Quick Enter to Send**: Supports `Enter` to send messages and `Shift + Enter` to insert a new line.
- **10-Round Coherent Context Memory**: Just like using the ChatGPT web version, it remembers past chat context, ensuring your train of thought doesn't break.

---

### 🛠️ Installation & User Guide

#### 1. Installation Method
This plugin is developed using a minimalist native pure TypeScript approach, without relying on any bloated third-party frameworks.
1. Download the latest compiled plugin release zip (containing `main.js` and `manifest.json`).
2. Find the hidden `.obsidian/plugins/` folder in your Obsidian vault directory.
3. Create a new folder named `obsidian-deepseek-note-helper` and place the two files inside.
4. Restart Obsidian, and enable this plugin in **Settings -> Community Plugins**.

#### 2. Configure DeepSeek API
1. Click the "gear" icon on the left side of the sidebar to enter the settings interface.
2. Find this plugin and enter your **DeepSeek API Key** (`sk-xxxxxxxxxx`) in the configuration.
3. (Optional) If you use a proxy API or deploy a local large model, you can modify the `API URL` and `Model` name here.

#### 3. Start Using
Click the 🤖 (Robot) icon on the left ribbon to wake up your DeepSeek assistant in the right sidebar!

---
*For the future roadmap, please refer to the `ROADMAP.md` file in the plugin directory. Let's build a knowledge garden with AI!*

<br>
<br>
<br>

---

## 中文版

一个致力于将 **DeepSeek AI** 无缝融入您的 Obsidian 知识库工作流的强大插件。

通过在侧边栏唤出您的随身 AI 助理，它不仅能**阅读和理解您的笔记**，还能**深度穿透您的双向链接**、**全库检索**、并**自动化管理您的笔记元数据(Metadata)**，是您打造“第二大脑”的终极利器。

---

### 🌟 核心亮点功能 (Highlights)

#### 1. 🤖 真正的“知识库漫游助手”
- **当前笔记感知**：打开任何笔记，侧边栏的 DeepSeek 将自动读取其全文内容作为记忆上下文。您可以直接询问：“帮我总结这篇笔记”或“润色第三段落”。
- **局部精准聚焦 (Selection Focus)**：编辑器里**高亮选中**一段文字，AI 将自动锁定其为焦点。即使您鼠标点入侧边栏打字导致高亮消失，插件也拥有**选择记忆**，精准回答针对这段话的提问。

#### 2. 🔗 双向链接深度解析 (Bidirectional Context)
- AI 不再只会“盲人摸象”。如果您的当前笔记包含指向其他笔记的 `[[双向链接]]`，插件会在后台自动顺藤摸瓜，**将关联笔记的内容一并喂给 AI**。
- *场景体验*：在阅读《项目架构设计》时，如果里面引用了 `[[数据库表结构]]`，AI 就能在回答时结合这两篇文章的内容为您进行综合解答。

#### 3. 🧠 Agentic 工具调用 (RAG & 全库检索)
- **原生支持 DeepSeek Function Calling**。当 AI 判断您的需求超出现有笔记时，它会自动召唤以下高级魔法工具：
  - **`search_vault` (全库搜索)**：支持 RAG (检索增强生成) 级别的全库搜索探索。
  - **`create_note` (新建笔记)**：它可以根据您的指令，在指定的文件夹创建全新的 Markdown 笔记并生成排版好的内容。
  - **`append_to_note` (追加记录)**：它可以像做摘录一样，把你们聊出来的灵感或某段总结，自动“无缝粘贴”到您指定的现有笔记的末端。
  - **`modify_files_in_directory` (全卷查阅与批量预审)**：当您要求它对某整个目录（例如 `/日记`）进行批量修改时，它会先自动扫描出该目录下所有的 `md` 文件。为了安全起见，它不会擅自一键覆写全库，而是会在侧边栏报告它扫描到了哪些文件，并准备在后续对话中根据您的需要逐个使用 `update_metadata` 或 `append_to_note` 对这些文件进行调整。

#### 4. 🎛️ 元数据自动化管家 (YAML / Properties)
- AI 拥有最高改写权限的 **`update_metadata`** 工具。
- 不再需要手动打标签。您可以对它下达指令：“根据这篇文章的核心思想，自动在属性(Properties)区添加合适的 tags，并把 status 改成 active”。**AI 会自动为您更新 YAML Frontmatter，全程无需动手。**

#### 5. ⚡ 丝滑流畅的使用交互
- **一键复制 (Copy)**：每条 AI 生成的回复右上角均配有一键 Copy 按钮，方便您将整理好的思路快速提取到剪贴板，随后无缝融合回笔记里。
- **原生 Markdown 流式渲染**：采用 DeepSeek Streaming API (打字机效果) 叠加 Obsidian 原生的 `MarkdownRenderer`，所有复杂格式（加粗、列表、代码块）逐字完美展现，杜绝焦躁的等待时间。
- **快捷回车发送**：支持 `Enter` 发送消息，`Shift + Enter` 换行输入。
- **10 轮记忆连贯对话**：像使用 ChatGPT 网页版一样，它会记住过去的聊天上下文，让思想的递进不断链。

---

### 🛠️ 安装与使用教程

#### 1. 安装方法
本插件采用极简原生的纯 TypeScript 方案开发，不依赖任何第三方臃肿框架。
1. 下载最新编译的插件文件压缩包（需包含 `main.js` 和 `manifest.json`）。
2. 在您的 Obsidian 知识库目录中找到隐藏文件夹 `.obsidian/plugins/`。
3. 新建一个文件夹命名为 `obsidian-deepseek-note-helper`，将两个文件放入其中。
4. 重启 Obsidian，在**设置 -> 第三方插件**中开启本插件。

#### 2. 配置 DeepSeek API
1. 点击侧边栏左侧的“齿轮”图标进入设置界面。
2. 找到本插件，在配置项中填入您的 **DeepSeek API Key** (`sk-xxxxxxxxxx`)。
3. （可选）如果您使用中转代理 API 或者部署了本地大模型，可以在此处修改 `API URL` 和 `Model` 名称。

#### 3. 开始使用
点击左侧功能丝带 (Ribbon) 上的 🤖 (机器人) 图标，即可在右侧边栏唤醒您的 DeepSeek 助手！

---
*未来路线图敬请参考插件目录下的 `ROADMAP.md` 文件。与 AI 共建知识花园！*
