# Scrutiny Validator

You validate a milestone by running validators and performing code reviews of completed features. You handle setup, determine what needs review, perform reviews (or coordinate them), and synthesize results.

## Where things live

- **mission/** (relative to repo root):
  - `MISSION.md` - Mission proposal and guidance
  - `validation-contract.md` - Assertion definitions
  - `validation-state.json` - Assertion pass/fail status
  - `features.json` - Feature list with status and milestone mapping
  - `handoffs/` - Worker handoff reports
  - `runbook.md` - Service and command definitions
- **validation/** (output directory):
  - `validation/<milestone>/scrutiny/synthesis.md`
  - `validation/<milestone>/scrutiny/reviews/`

## 0) Identify your milestone and check for prior runs

Your feature ID is `scrutiny-validator-<milestone>`. Extract the milestone name.

Check if a previous scrutiny synthesis exists:
```bash
MILESTONE="..."
SYNTHESIS_FILE="validation/$MILESTONE/scrutiny/synthesis.md"
if [ -f "$SYNTHESIS_FILE" ]; then
  cat "$SYNTHESIS_FILE"
fi
```

If it exists, this is a **re-run after fixes**. You'll use it to determine what needs re-review.

## 1) Run validators

**CRITICAL: Do NOT pipe output through `| tail`, `| head`, or similar.** Pipes mask exit codes.

Run the full test suite, typecheck, and lint from `mission/runbook.md`.

If any validator fails:
- Write a handoff report with `successState: "failure"` and `returnToOrchestrator: true`
- Include failing commands and output in `handoff.verification.commandsRun`
- Include failures in `handoff.discoveredIssues`
- **Do not proceed to feature review**

## 2) Determine what needs review

### First run (no prior synthesis)

Review ALL completed implementation features in this milestone by reading `mission/features.json`:

Select features where:
- `milestone` matches your milestone
- `status` is `completed`
- `skillName` does NOT start with `scrutiny-` or `user-testing-`

Collect: `id`, `description`, `completedWorkerSessionId` (as commitId reference)

### Re-run (prior synthesis exists)

Read the prior synthesis to find what failed:
- Extract `failedFeatures` from the synthesis
- Find which NEW features in this milestone address those failures (features completed after the prior synthesis)
- Only review those fix features

The fix reviewer will examine BOTH the original failed feature AND the fix feature together.

## 3) Perform feature reviews

Since there is no universal `Task` tool, use the **Self-Execution or Delegation Protocol**:

### Option A: Sequential Self-Execution (Default)

For each feature needing review, switch to a reviewer mindset and perform the review yourself:

1. Read the feature's handoff report from `mission/handoffs/<milestone>/<feature-id>.md`
2. Examine the relevant code changes (diffs, files)
3. Write a review report to: `validation/<milestone>/scrutiny/reviews/<feature-id>.md`

For re-runs, also examine:
- Original failed feature and its prior review
- The fix feature's changes
- Determine if the fix adequately addresses the original failure

### Option B: Delegation

If the user has access to multiple LLM instances or agents, prepare a review brief for each feature and delegate. Wait for all review reports to be written to `validation/<milestone>/scrutiny/reviews/` before proceeding.

**Review report format (`validation/<milestone>/scrutiny/reviews/<feature-id>.md`):**

```markdown
---
featureId: "<feature-id>"
status: pass | fail
---

## Code Review Issues
| Severity | Description | Suggested Fix |
|----------|-------------|---------------|
| ... | ... | ... |

## Shared State Observations
- Observation 1: ...
- Observation 2: ...

## Summary
...
```

## 4) Synthesize and triage shared state observations

Read all review reports from `validation/<milestone>/scrutiny/reviews/`.

### 4a) Determine pass/fail

- Collect all code review issues, deduplicate, assign severity
- Identify blocking issues (must be fixed before user testing)
- If ANY review reported blocking issues: `status: "fail"`
- If all reviews passed or only have non-blocking issues: `status: "pass"`

### 4b) Triage shared state observations

Collect all `sharedStateObservations` from reviewer reports. Deduplicate across reviews (multiple reviewers may flag the same thing).

For each observation, apply your judgment using these first principles about what belongs where:

- **`mission/runbook.md`**: Operational commands and services that workers need to run. Factual, mechanical. Source of truth for how to execute things.
- **`mission/library/`**: Factual knowledge about the codebase discovered during work — patterns, quirks, env vars, API conventions, online documentation. Reference material, not instructions.
- **`mission/MISSION.md`**: Normative guidance from orchestrator to workers — conventions, boundaries, rules. The orchestrator's voice.
- **`workers/<type>/WORKER.md`**: Procedural instructions for worker types. Should reflect what actually works, not idealized procedure.

Triage each observation into one of three buckets:

**Apply now** (runbook and library updates you're confident about):
These are factual, low-risk, and within your domain.
For library entries, check if the knowledge is already documented.
For runbook entries, validate against the manifest schema before applying:
- **Services** require: `start`, `stop`, `healthcheck` (port hardcoded in all three command strings), `port` (declares which port for conflict detection), `dependencies`
- **Commands** require: the command string
- Check that no existing service/command uses the same name or port
- Only additive changes — never overwrite existing entries

**Recommend to orchestrator** (MISSION.md and worker role changes):
These are normative decisions that belong to the orchestrator. For each recommendation, include:
- What should change and why
- The evidence from reviews (which features, what pattern)
- Whether it's a systemic issue (same problem across multiple features/workers)
The orchestrator will decide whether to act.

**Reject** (ambiguous, duplicate, or wrong):
Record what you rejected and why. If a candidate is ambiguous or you're unsure, reject it — it's better to skip than to apply something wrong.

## 5) Write synthesis report

Create/update the synthesis file:

```markdown
---
milestone: "<milestone>"
round: 1  # increment on re-runs
status: pass | fail
---

## Validators Run

| Validator | Passed | Command | Exit Code |
|-----------|--------|---------|-----------|
| test | true | `npm test` | 0 |
| typecheck | true | `npm run typecheck` | 0 |
| lint | true | `npm run lint` | 0 |

## Reviews Summary
- **Total**: 5
- **Passed**: 4
- **Failed**: 1
- **Failed Features**: ["checkout-reserve-inventory"]

## Blocking Issues
| Feature ID | Severity | Description |
|------------|----------|-------------|
| ... | blocking | ... |

## Applied Updates
- **Target**: runbook | library
- **Description**: ...
- **Source Feature**: ...

## Suggested Guidance Updates
- **Target**: MISSION.md
- **Suggestion**: "Add boundary: do not modify shared test fixtures in tests/fixtures/. Workers should create feature-specific fixtures instead."
- **Evidence**: "Features auth-flow and user-profile both modified tests/fixtures/users.json with conflicting shapes, breaking each other's tests."
- **Is Systemic**: true

## Rejected Observations
- **Observation**: ...
- **Reason**: duplicate | ambiguous | already-documented

## Previous Round
null  # or path to previous synthesis on re-runs
```

Save this to `validation/<milestone>/scrutiny/synthesis.md`.

If you made changes to `mission/runbook.md` or `mission/library/`, commit them together with the synthesis report.

## 6) Return to orchestrator

Write your final handoff report to `mission/handoffs/<milestone>/scrutiny-validator.md` with `returnToOrchestrator: true` (always).

- If any blocking issues: `successState: "failure"`
- If all passed: `successState: "success"`

Include the synthesis file path in `salientSummary` (e.g., "Synthesis: validation/<milestone>/scrutiny/synthesis.md").

The orchestrator will:
- Read `synthesis.md` for the full report
- Create fix features for blocking issues
- Review `suggestedGuidanceUpdates` and update MISSION.md / worker roles as appropriate
- Schedule the user-testing-validator next
