---
tags:
  - obsidian-plugin
  - deepseek
  - roadmap
  - development
  - ai-assistant
  - technical-planning
  - feature-tracking
---
# Obsidian DeepSeek Plugin - Future Roadmap

[English Version Below](#english-version) | [中文版往下看](#中文版) 

---

## English Version

The plugin currently has completed its core context awareness, streaming interaction (now fully native and secure via `requestUrl`), and Agentic automated operations. To continuously evolve, we have divided our future plans into completed milestones and new areas to explore:

> [!CAUTION]
> **🌟 Urgent & High Priority (Urgent Bugfix)**
> - [x] **Fix settings persistence failure**: The `this.plugin.saveSettings()` method call error in `main.ts` has been fixed, and configuration can now correctly persist.

## ✅ Phase 1: Interactive Experience (Completed)
- [x] **Streaming Response (Native)**
  Integrated DeepSeek API and adapted it for native Obsidian `requestUrl` compliance while maintaining fast rendering.
- [x] **Selection Memory (Focus)**
  Resolved the issue of losing highlight upon editor blur, supporting caching of the last selection.
- [x] **One-Click Quick Copy**
  Added a Copy button to the response interface to improve the output closed loop.

## ✅ Phase 2: Deep Knowledge Base Integration (Completed)
- [x] **RAG / Vault Search**
  Achieved full-vault knowledge extraction via the `search_vault` tool.
- [x] **Bidirectional Link Deep Resolution**
  Automatically tracks `[[bi-links]]` and reads associated note contents.
- [x] **Structured Data Injection (Metadata)**
  Automated management of YAML properties through the `update_metadata` tool.

## ✅ Phase 3: Agentic Automation Output (Completed)
- [x] **Fully Automated Note Operations (Function Calling)**
  AI can autonomously execute `create_note` and `append_to_note`.
- [x] **Vault Bulk Modification Pre-scan**
  Achieves safe bulk refactoring through directory scanning and streaming loop calls.

---

## 🚀 Future Exploration: Phase 4 and Beyond

### 📸 Phase 4: Multimodal Perception (Vision)
- [ ] **Image Content Recognition and Analysis**
  Allow the model to read `![[images]]` in notes, analyzing flowcharts, handwritten notes, or chart contents.
- [ ] **Image-to-Code**
  One-click conversion of screenshots to Mermaid flowchart code or Markdown tables.

### ⌨️ Phase 5: Deep Command Flow (Workflow Integration)
- [ ] **Shortcut Keys and Slash Commands**
  Support quick polishing/questioning in-place within the editor via `/deepseek`.
- [ ] **External Services Extension**
  Allow API integration to push notes to personal blogs or commit via Git.

---
*This document is used for long-term thinking and planning. Welcome to iterate based on new pain points in daily use.*

<br>
<br>
<br>

---

## 中文版

目前插件已完成了核心的上下文感知、安全请求交互以及 Agentic 自动化操作。为了持续进化，我们将未来的规划分为已完成的里程碑和待探索的新领域：

> [!CAUTION]
> **🌟 紧急修复任务 (Urgent & High Priority)**
> - [x] **解决设置持久化失效问题**：已修复 `main.ts` 中的 `this.plugin.saveSettings()` 方法调用错误，现在配置可以正确持久化保存了。

## ✅ 第一阶段：交互体验（已完成）
- [x] **原生极速响应 (Native Response)**
  接入 DeepSeek API 并完美适配了 Obsidian 原生的 `requestUrl` 安全规范。
- [x] **局部文本精准聚焦 (Selection Memory)**
  解决了失焦导致高亮消失的问题，支持缓存最后一次选择。
- [x] **一键快速复制**
  在回复界面加入 Copy 按钮，提升产出闭环。

## ✅ 第二阶段：深度知识库整合（已完成）
- [x] **全库检索增强 (RAG / Vault Search)**
  通过 `search_vault` 工具实现全库知识提取。
- [x] **双向链接深度解析**
  自动追踪 `[[双链]]` 并读取关联笔记内容。
- [x] **结构化数据注入 (Metadata)**
  通过 `update_metadata` 工具实现 YAML 属性的自动化管理。

## ✅ 第三阶段：Agentic 自动化执行（已完成）
- [x] **全自动笔记操作 (Function Calling)**
  AI 可自主执行 `create_note` 和 `append_to_note`。
- [x] **全库批量修改预审**
  通过目录扫描和流式循环调用实现安全的批量重构。

---

## 🚀 未来探索：第四阶段及以后

### 📸 第四阶段：多模态感知 (Vision)
- [ ] **图片内容识别与分析**
  允许模型读取笔记中的 `![[图片]]`，分析流程图、手写笔记或图表内容。
- [ ] **图片转代码 (Image-to-Code)**
  一键将截图转化为 Mermaid 流程图代码或 Markdown 表格。

### ⌨️ 第五阶段：深度命令流 (Workflow Integration)
- [ ] **快捷键与斜杠命令 (Slash Commands)**
  支持在编辑器内通过 `/deepseek` 快速原地润色提问。
- [ ] **外部服务扩展**
  允许通过 API 联动将笔记推送到个人博客或通过 Git 提交。

---
*此文档用于长期思考和规划。欢迎在日常使用中根据新痛点进行迭代。*
