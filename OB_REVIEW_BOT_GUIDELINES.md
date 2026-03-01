---
tags:
  - obsidian
  - plugin-development
  - review-guidelines
  - best-practices
---
# Obsidian 官方插件开发防坑指南 (Review Bot Checklist)

由于 Obsidian 官方社区对上架插件有极其严苛的人工与机器混合审核标准（尤其是针对 `ObsidianReviewBot`），在开发任何新的 Obsidian 插件时，请**务必**在提交 PR 前逐一对照以下这份泣血整理的清单！

这是我们与官方机器人数次“交锋”后总结的绝对铁律。

---

## 🛑 1. 致命禁区：绝对不能做的操作

### ❌ 严禁使用原生 `fetch` 或 `XMLHttpRequest`
- **原因**：官方为了控制流氓插件和保障跨平台（移动端） CORS 安全，禁止插件私自调用浏览器原生网络请求。
- **正解**：必须引用 `import { requestUrl } from 'obsidian'`，并全部使用 `requestUrl` 替代 `fetch`。
- **代价**：由于 `requestUrl` 的限制，您可能**无法实现原生的流式 Server-Sent Events (SSE) 文字打印效果**，只能退而求其次等 API 全部返回后再一次性渲染。如果是强行做 stream，极易被审核机器人的 AST 语法树扫描打回。

### ❌ 严禁在代码里写内联样式 (Inline Styles)
- **踩坑点**：`element.style.display = 'flex'` 或 `element.style.padding = '10px'`。报错提示 `Avoid setting styles directly via element.style...`
- **原因**：内联样式会破坏 Obsidian 丰富的主题生态（Themes），导致暗/亮色切换失效或样式冲突。
- **正解**：
  1. 在根目录建立一个 `styles.css` 文件。
  2. 在 CSS 中写类：`.my-flex-box { display: flex; padding: 10px; }`。
  3. 在 TS 代码中使用：`element.addClass('my-flex-box')` 或 `createDiv({ cls: 'my-flex-box' })`。

### ❌ 严禁使用万能的 `any` 类型
- **踩坑点**：图省事写 `function parseData(data: any)`，报错提示 `Unexpected any...`
- **原因**：官方要求所有上架插件必须是严格增强的 TypeScript。
- **正解**：
  - 如果是 JSON 对象，请老老实实写 `interface` 或使用 `Record<string, unknown>` / `Record<string, string | number>`。
  - 遇到实在推断不出的回调，请使用 `unknown` 代替 `any`。

---

## ⚠️ 2. 异步陷阱：异步函数 (Promise) 的严苛控制

### ❌ 悬空回调 (Floating Promises)
- **踩坑点**：在按钮点击事件等回调里直接调用异步函数：`btn.addEventListener('click', () => this.doSomethingAsync());`
- **原因**：未捕获的 Promise 如果崩了，会带着整个 Obsidian 的生命周期一起报错。
- **报错提示**：`Promises must be awaited, end with a call to .catch... or be explicitly marked as ignored with the void operator.`
- **正解**：
  必须为回调里的 Promise 兜底。
  - **方案A（推荐）**：带上 catch：`this.doSomethingAsync().catch(console.error);`
  - **方案B（强制声明忽略）**：`void this.doSomethingAsync();`（但不推荐，官方依然可能卡你）。

### ❌ `async` 标了却不 `await`
- **踩坑点**：习惯性给生命周期写 `async onOpen() { /* 里面全都是同步代码 */ }`。
- **报错提示**：`Async method 'onOpen' has no 'await' expression.`
- **正解**：如果函数体里没有 `await` 操作，就**坚决把函数签名前的 `async` 关键字删掉**。如果在必须要符合某个 `async` 接口的情况下，至少要在里面硬塞一句 `await Promise.resolve();`。

---

## 🎨 3. UI 规范：魔鬼藏在细节里

### ❌ 标题里不能带 "Settings" 字眼
- **踩坑点**：在插件设置页里加个标题 `DeepSeek Settings`。
- **报错提示**：`Avoid using "settings" in settings headings.`
- **原因**：已经在设置面板页面里了，写 Settings 是同义反复的废话。
- **正解**：直接写产品名，比如 `DeepSeek` 即可。

### ❌ 标题不能手写 HTML 标签
- **踩坑点**：`containerEl.createEl('h2', {text: 'DeepSeek'})`。
- **报错提示**：`For a consistent UI use new Setting(containerEl)...setHeading()`
- **正解**：无论是什么标题，凡是设置页里起头的，必须调用官方提供的原生组件 `new Setting(containerEl).setName('DeepSeek').setHeading()`。

### ❌ 疯狂的“句首大写”强迫症 (Sentence Case)
- **踩坑点**：在设置页面里为了好看写 `API Key`，`API URL`，`DeepSeek Note Helper`。
- **报错提示**：`Use sentence case for UI text.`
- **原因**：官方要求所有 UI 上的文字说明、设置项名称，必须遵守严格的**英文句首大写规则**（只有第一个字母和专有名词大写，后面的全小写）。
- **正解**：
  - `API Key` 👉 必须改成 `API key`
  - `DeepSeek Note Helper` 👉 必须改成 `DeepSeek note helper`

---

## 💡 总结与建议

如果您计划开发下一个 Obsidian 插件或者让 AI 帮您生成初始化代码，请务必在提示词 (Prompt) 加上这样一段话：

> *"你现在是一个专业的 Obsidian 插件开发者。在编写代码时，你必须严格遵守官方审核机器人的规则：1. 严禁使用 fetch，只能用 requestUrl；2. 严禁内联 style，必须提取到 styles.css；3. 所有的 UI 文字必须使用严格的 Sentence case 句首大写；4. 禁止任何 any 类型；5. 设置页只能用 .setHeading() 创建标题，且标题内禁止出现 'settings' 字眼；6. 所有的 Promise 无论在哪里触发都必须被 await 或 .catch() 接住。"*

存下这份指南，以后每次提交 PR 前用它对照走一遍，包您一遍过！
