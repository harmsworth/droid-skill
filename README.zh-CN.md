# Droid Mission Framework（通用版）

一个与工具无关的多智能体软件开发框架，源自 Factory.ai Droid 内置的 Mission System。

## 这是什么？

这个 Skill 提供了一套完整的**任务规划 + 代码实现 + 自动验证**框架，适用于**任何大语言模型**——Claude Code、OpenAI Codex、Kimi、Cursor 等。它使用通用的 Markdown 协议，没有任何厂商锁定。

你可以把它理解为 living 在 AI 助手内部的"项目经理 + 代码审查 + QA 测试"系统。它会把大型项目拆分成里程碑（milestone），指派专业 Worker 执行，并在每个里程碑结束后自动验证代码质量和用户体验。

## 安装

### 方式 1：全局 Skill 目录（推荐，适用于 Claude Code / Trae）

```bash
# 将 skill 文件夹复制到全局 .agents/skills 目录
cp -r droid-skill ~/.agents/skills/
```

重启你的 AI 工具，下次会话启动时会自动加载。

### 方式 2：直接注入 Prompt

打开 `SKILL.md`，将其完整内容粘贴到 system prompt 中，或放在新对话的最开头。

### 方式 3：项目内本地使用

将 `droid-skill/` 文件夹放入你的项目仓库，然后在对话中显式引用：

> "使用 `droid-skill/SKILL.md` 中的指令来规划这个项目。"

## 工作原理

这个 Skill 定义了 **5 个角色**。你不需要死记硬背——像平时一样自然地跟 AI 说话，AI 会根据你的请求自动匹配对应的角色指令。

| 角色 | 作用 |
|------|------|
| **Orchestrator（编排者）** | 规划项目：拆分为里程碑、确定基础设施、创建 `mission/` 目录下的各种文件。 |
| **Worker（执行者）** | 实现具体功能，遵循测试驱动开发（TDD）。 |
| **Scrutiny Validator（代码审查验证者）** | 对里程碑内所有已完成功能进行代码审查，并运行测试/类型检查/代码规范检查。 |
| **User Testing Validator（用户测试验证者）** | 测试真实的用户界面（浏览器、CLI、API），确保功能真正可用。 |
| **Worker Designer（Worker 设计者）** | 帮助你设计新的 Worker 类型，优化 Handoff（交接）质量。 |

## 快速开始——你可以直接复制使用的 Prompt

### 项目规划（Orchestrator）
- "使用 Mission Framework 帮我规划这个项目。"
- "我想做一个 Slack 克隆版，帮我拆成里程碑并写任务提案。"
- "为给这个仓库接入 Stripe 支付创建一个任务计划。"
- "用 Droid Mission Framework 规划接下来 3 个 Sprint。"

### 功能实现（Worker）
- "实现 `mission/features.json` 里的 `auth-login` 功能。"
- "你是前端 Worker，按照 mission 计划把登录页做出来。"
- "继续完成 `checkout` 里程碑，下一个功能是 `payment-form`。"
- "按照 `droid-skill/SKILL.md` 里的 Worker 指令实现 Dashboard。"

### 代码审查（Scrutiny Validator）
- "对 `auth` 里程碑运行 Scrutiny Validator。"
- "验证 `checkout` 里程碑——审查所有已完成功能并运行完整测试套件。"
- "该做代码审查了，检查 `user-profile` 里程碑有没有阻塞性问题。"

### 用户测试（User Testing Validator）
- "对 `auth` 里程碑运行用户测试，验证登录和注册流程。"
- "验证端到端的结账流程是否能跑通。"
- "以 User Testing Validator 身份检查 `dashboard` 里程碑。"

### 设计 / 优化 Worker（Worker Designer）
- "设计一个专门做 DevOps 任务的 Worker 类型。"
- "现在的 Worker 交接报告太模糊了，帮我收紧标准。"
- "一个移动端 + 后端的项目，我应该创建哪些 Worker 类型？"

## 配合 Claude Code 内置指令使用

Claude Code 有一些内置的交互模式，以下是配合本 Skill 的最佳实践：

### `/clear` 或新开对话

清除后 skill 全局上下文仍然有效。直接开始：
> "使用 Mission Framework 规划这个项目。"

### `@` 提及或文件引用

你可以显式指向 skill，确保它优先级最高：
> "@droid-skill 规划这个项目。"
> "按照 `~/.agents/skills/droid-skill/SKILL.md` 的指令，把需求拆成里程碑。"

### `/compact`（压缩对话）

如果对话太长进行了压缩，提醒 AI 当前角色：
> "我们压缩了。我现在还在 Orchestrator 阶段——继续完成里程碑规划。"

### 跨会话的多步骤任务

Claude Code 的会话会随时间丢失细节，所以最好在每次 Handoff 后**把 `mission/` 文件提交到 git**。在新会话中：
> "恢复之前的 mission。先读取 `mission/MISSION.md` 和 `mission/features.json`，然后告诉我当前状态和下一步该做什么。"

## 项目目录结构

当这个 Skill 激活后，AI 会在你的仓库中创建并管理以下文件：

```
mission/
  MISSION.md              # 任务提案和策略
  runbook.md              # 服务、命令、端口定义
  features.json           # 功能列表及状态跟踪
  validation-contract.md  # 必须通过的验收断言
  validation-state.json   # 当前断言的通过/失败状态
  handoffs/               # Worker 完成的交接报告
  library/                # 知识库，供后续 Worker 参考
  evidence/               # 截图、日志、测试证据
workers/
  <类型>/
    WORKER.md             # Worker 角色定义
validation/
  <里程碑>/
    scrutiny/             # 代码审查合成报告 + 单功能审查报告
    user-testing/         # 用户测试合成报告 + 流程测试报告
```

## 获得最佳效果的技巧

1. **频繁提交 `mission/`** —— 它是多智能体工作流的"存档点"。
2. **如果 AI 困惑，明确指定角色** —— 例如"切换到 Scrutiny Validator 模式"。
3. **一次只处理一个里程碑** —— 不要试图在一个超大回合里实现并验证所有内容。
4. **善用 `workers/` 专业化** —— 如果项目涉及前端、后端、DevOps，为每种工作创建独立的 `WORKER.md`。

## 需要帮助？

- 查看 `examples/frontend-worker.md` 获取一个完整的 Worker 模板。
- 查看 `prompts/` 目录，可以看到（或自定义）每个角色的原始指令。
- 阅读 `SKILL.md` 获取完整的系统 Prompt。
