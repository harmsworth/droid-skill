# harmsworth/droid-skill

A multi-skill repository for the **Droid Mission Framework** — a universal, tool-agnostic, multi-agent software development system.

## What's inside?

This is a monorepo-style skill package. It currently contains one main skill:

| Skill | Path | Description |
|-------|------|-------------|
| **droid-skill** | [`skills/droid-skill/`](skills/droid-skill/) | The complete mission framework: planning, worker execution, code review, user testing, and worker design. |

## Installation

Install the `droid-skill` skill into your agent's global skills directory. The exact command depends on your tool:

```bash
# Example pattern (replace with your actual skill installer)
npx <skill-installer> harmsworth/droid-skill/droid-skill
```

Or manually copy it:

```bash
cp -r skills/droid-skill ~/.agents/skills/
```

## What is the Droid Mission Framework?

Derived from Factory.ai Droid's built-in Mission System, this framework turns any LLM (Claude, Codex, Kimi, Cursor, etc.) into a structured software engineering team with 5 built-in roles:

1. **Orchestrator** — Plans projects into milestones, sets up infrastructure, and writes mission artifacts.
2. **Worker** — Implements features with strict TDD and structured handoffs.
3. **Scrutiny Validator** — Code-reviews completed features and runs tests/lint/typecheck.
4. **User Testing Validator** — Tests real user surfaces (browser, CLI, API) end-to-end.
5. **Worker Designer** — Helps you design new worker types and improve handoff quality.

## Quick usage examples

After the skill is loaded, just talk to the AI naturally:

- **Plan**: "Plan this project using the mission framework."
- **Implement**: "Implement feature `auth-login` from the mission plan."
- **Review**: "Run the scrutiny validator on milestone `auth`."
- **Test**: "Test the login and signup flows end-to-end."
- **Design**: "Design a new DevOps worker type for this project."

See [`skills/droid-skill/README.md`](skills/droid-skill/README.md) for the full usage guide, prompt examples, and Claude Code integration tips.

## Repository structure

```
.
├── README.md
├── README.zh-CN.md
└── skills/
    └── droid-skill/
        ├── SKILL.md              # Main system prompt
        ├── index.json            # Skill metadata
        ├── README.md             # Detailed skill usage guide
        ├── README.zh-CN.md       # Chinese usage guide
        ├── examples/
        │   └── frontend-worker.md
        └── prompts/
            ├── orchestrator.md
            ├── worker-base.md
            ├── scrutiny-validator.md
            ├── user-testing-validator.md
            └── worker-design.md
```

## Contributing

Feel free to open issues or PRs if you want to add new worker types, new examples, or improve the prompts.

## License

MIT
