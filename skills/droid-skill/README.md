# Droid Mission Framework (Universal)

A tool-agnostic, multi-agent software development framework derived from Factory.ai Droid's built-in Mission System.

## What is this?

This skill provides a complete mission planning and execution framework that works with **any LLM** — Claude Code, OpenAI Codex, Kimi, Cursor, etc. It uses universal markdown-based protocols with no vendor lock-in.

Think of it as a "project management + code review + QA" system that lives inside your AI assistant. It splits large projects into milestones, assigns specialized workers, and automatically validates code quality and user-facing behavior.

## Installation

### Option 1: Global skills directory (recommended for Claude Code / Trae)

```bash
# Copy the skill folder into your global .agents/skills directory
cp -r droid-skill ~/.agents/skills/
```

Restart your AI tool. The skill will be loaded automatically on the next session.

### Option 2: Direct prompt injection

Open `SKILL.md` and paste its contents into the system prompt or at the very beginning of a new conversation.

### Option 3: Project-local usage

Drop the `droid-skill/` folder into your project repo, then reference it explicitly in chat:

> "Use the instructions in `droid-skill/SKILL.md` to plan this project."

## How it works

This skill defines **5 roles**. You don't need to memorize them — just talk to the AI naturally. The AI will follow the corresponding role instructions based on what you ask.

| Role | What it does |
|------|--------------|
| **Orchestrator** | Plans the project: breaks it into milestones, sets up infrastructure, and creates `mission/` artifacts. |
| **Worker** | Implements a specific feature following test-driven development (TDD). |
| **Scrutiny Validator** | Code-reviews all completed features in a milestone and runs tests/lint/typecheck. |
| **User Testing Validator** | Tests the real user surface (browser, CLI, API) to make sure features actually work. |
| **Worker Designer** | Helps you design new worker types and improve handoff quality. |

## Quick Start — Try these exact prompts

### Planning (Orchestrator)
- "Plan this project for me using the mission framework."
- "I want to build a Slack clone. Break it into milestones and write the mission proposal."
- "Create a mission plan for adding Stripe checkout to this repo."
- "Use the droid mission framework to plan the next 3 sprints."

### Implementation (Worker)
- "Implement feature `auth-login` from the mission plan."
- "You're the frontend worker. Build the login page according to `mission/features.json`."
- "Continue working on milestone `checkout`. The next feature is `payment-form`."
- "Follow the worker instructions in `droid-skill/SKILL.md` and implement the dashboard."

### Code Review (Scrutiny Validator)
- "Run the scrutiny validator on milestone `auth`."
- "Validate the `checkout` milestone — review all completed features and run the test suite."
- "It's time for code review. Check milestone `user-profile` for blocking issues."

### User Testing (User Testing Validator)
- "Run user testing on milestone `auth`. Test the login and signup flows."
- "Validate that the checkout flow works end-to-end."
- "Perform the user-testing validator role on milestone `dashboard`."

### Designing / Improving Workers (Worker Designer)
- "Design a new worker type for DevOps tasks."
- "The current worker handoffs are too vague. Help me tighten them up."
- "What worker types should I create for a mobile + backend project?"

## Using with Claude Code built-in commands

Claude Code has a few built-in interaction patterns. Here's how to use this skill with them:

### `/clear` or new conversation
After clearing, the skill context is still loaded globally. Just start with:
> "Plan this project using the mission framework."

### `@` mentions or file references
You can explicitly point to the skill to make sure it's prioritized:
> "@droid-skill Plan this project."
> "Follow the instructions in `~/.agents/skills/droid-skill/SKILL.md` to break this into milestones."

### `/compact` (summary mode)
If the conversation gets long and you compact, remind the AI of the active role:
> "We compacted. I'm still in the Orchestrator phase — continue planning the milestones."

### Multi-step missions across sessions
Because Claude Code sessions can lose detail over time, it's best to **commit `mission/` files to git** after every handoff. In a new session, say:
> "Resume the mission. Read `mission/MISSION.md` and `mission/features.json`, then tell me the current status and what's next."

## Project directory layout

When this skill is active, the AI will create and manage files under these paths:

```
mission/
  MISSION.md              # Mission proposal and strategy
  runbook.md              # Services, commands, ports
  features.json           # Feature tracker with status
  validation-contract.md  # Assertions that must pass
  validation-state.json   # Current pass/fail status
  handoffs/               # Worker completion reports
  library/                # Knowledge base for future workers
  evidence/               # Screenshots, logs, test artifacts
workers/
  <type>/
    WORKER.md             # Worker role definition
validation/
  <milestone>/
    scrutiny/             # Code review synthesis + reports
    user-testing/         # Flow test synthesis + reports
```

## Tips for best results

1. **Commit `mission/` often** — it's the "save game" of your multi-agent workflow.
2. **Be explicit about the role** if the AI seems confused — e.g. "Switch to Scrutiny Validator mode."
3. **One milestone at a time** — don't try to implement and validate everything in one giant turn.
4. **Use `workers/` for specialization** — if your project has frontend, backend, and DevOps work, create a `WORKER.md` for each.

## Need help?

- Look at `examples/frontend-worker.md` for a concrete worker template.
- Check `prompts/` if you want to see (or customize) the raw instructions for each role.
- Read `SKILL.md` for the complete, combined system prompt.
