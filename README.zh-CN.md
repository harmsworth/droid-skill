# harmsworth/droid-skill

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md)
[![简体中文](https://img.shields.io/badge/lang-简体中文-red.svg)](README.zh-CN.md)

适用于 **Droid Mission Framework** 的多技能仓库——一个通用、与工具无关的多 Agent 软件开发系统。

## 仓库内容

这是一个 monorepo 风格的技能包。目前包含一个主技能：

| 技能 | 路径 | 说明 |
|------|------|-------------|
| **droid-skill** | [`skills/droid-skill/`](skills/droid-skill/) | 完整的多 Agent 任务框架：规划里程碑、Worker 执行、代码审查、用户测试验证与 Worker 设计。 |
| **videocut** | [`skills/videocut/`](skills/videocut/) | 智能口播视频剪辑 Agent：自动识别口误/重复/静音/卡顿，生成审核页面，一键 FFmpeg 剪辑导出。跨平台支持 macOS/Linux/WSL2。 |

## 安装

将 `droid-skill` 安装到你的 Agent 全局技能目录中。具体命令取决于你的工具：

```bash
# 示例（替换为实际的 skill 安装器）
npx <skill-installer> harmsworth/droid-skill/droid-skill
```

或手动复制：

```bash
cp -r skills/droid-skill ~/.agents/skills/
```

## 什么是 Droid Mission Framework？

源自 Factory.ai Droid 内置的 Mission System，这个框架将任何大模型（Claude、Codex、Kimi、Cursor 等）变成一支结构化的软件工程团队，内置 5 个角色：

1. **Orchestrator（编排者）** — 将项目拆分为里程碑，搭建基础设施，撰写任务文档。
2. **Worker（执行者）** — 严格遵循 TDD，执行功能开发并进行结构化交接。
3. **Scrutiny Validator（代码审查验证者）** — 对已完成功能进行代码审查，并运行测试/类型检查/代码规范检查。
4. **User Testing Validator（用户测试验证者）** — 对真实用户界面（浏览器、CLI、API）进行端到端测试。
5. **Worker Designer（Worker 设计者）** — 帮助你设计新的 Worker 类型并提升交接质量。

## 快速使用示例

安装技能后，用自然语言直接与 AI 对话即可：

- **规划**："使用 Mission Framework 规划这个项目。"
- **实现**："从任务计划中实现 `auth-login` 功能。"
- **审查**："对 `auth` 里程碑运行 scrutiny validator。"
- **测试**："端到端测试登录和注册流程。"
- **设计**："为这个项目设计一个新的 DevOps Worker 类型。"

完整的使用指南、提示词示例和 Claude Code 集成技巧，请参阅 [`skills/droid-skill/README.md`](skills/droid-skill/README.md)。

## 仓库结构

```
.
├── README.md
├── README.zh-CN.md
└── skills/
    └── droid-skill/
        ├── SKILL.md              # 主系统提示词
        ├── index.json            # 技能元数据
        ├── README.md             # 详细使用指南
        ├── README.zh-CN.md       # 中文使用指南
        ├── examples/
        │   └── frontend-worker.md
        └── prompts/
            ├── orchestrator.md
            ├── worker-base.md
            ├── scrutiny-validator.md
            ├── user-testing-validator.md
            └── worker-design.md
```

## 贡献

欢迎提交 Issue 或 PR，添加新的 Worker 类型、示例或改进提示词。

## 许可证

MIT
