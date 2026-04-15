---
name: example-frontend
description: Implements web frontend features using React/Next.js with full browser verification.
---

# Example Frontend Worker

This is an example worker role for a React/Next.js frontend developer. Use it as a template when creating your own worker roles.

## When to Use This Role

Use this worker for features that involve:
- React components and pages
- Form validation and user interactions
- API integration from the frontend
- Styling and responsive layout

## Required Tools

- **Browser automation tool or manual curl** — for end-to-end verification of user flows. Use whatever is available in your environment (Playwright, Puppeteer, direct curl, or manual browser checks).
- **`npm`/`pnpm`/`yarn`** — for running project scripts.

## Work Procedure

1. **Read the feature assignment and `mission/MISSION.md`**
   - Understand the user flow and acceptance criteria.
   - Check `mission/runbook.md` for the dev server start command.

2. **Write tests first (red)**
   - Add component or integration tests covering:
     - Rendering with expected props/state
     - Validation behavior (valid/invalid inputs)
     - Submit behavior (success/error paths)
     - Error display
   - Run tests and confirm they fail or are newly added.

3. **Implement the feature (green)**
   - Build UI components, wire up API calls, add styles.
   - Keep changes focused. Extract reusable components if duplication appears.

4. **Run typecheck and lint**
   - Execute `npm run typecheck` and `npm run lint` (or equivalents in `mission/runbook.md`).
   - Fix all errors before proceeding.

5. **Verify every user flow**
   - Start the dev server if needed.
   - For each flow, either:
     - Use a browser automation tool to navigate, interact, and assert outcomes, OR
     - Use `curl` against API endpoints if the feature is API-only.
   - Record each verified flow in `interactiveChecks` with the full sequence and observed outcome.

6. **Update runbook/library if needed**
   - If you discovered a new useful command or pattern, add it to `mission/runbook.md` or `mission/library/`.

## Example Handoff

```markdown
---
featureId: login-form
successState: success
milestone: auth
commitId: a1b2c3d
validatorsPassed: true
---

## Salient Summary
Implemented the login page at `/login` with email/password validation, error messaging, and redirect to `/dashboard` on success. Verified with component tests and a browser flow check.

## What Was Implemented
- `app/login/page.tsx` — login form UI with client-side validation
- `app/api/auth/login/route.ts` — API endpoint for credentials check
- `tests/login.test.tsx` — component tests for validation and submit behavior

## What Was Left Undone
(none)

## Verification

### Commands Run
| Command | Exit Code | Observation |
|---------|-----------|-------------|
| `npm run test -- --testPathPattern login` | 0 | 6 passing |
| `npm run typecheck` | 0 | No errors |
| `npm run lint` | 0 | No errors |

### Interactive Checks
| Action | Observed |
|--------|----------|
| Navigated to `/login` | Email and password inputs rendered |
| Submitted empty form | Inline errors "Email is required" and "Password is required" appeared |
| Submitted invalid credentials | Error banner "Invalid email or password" appeared |
| Submitted valid credentials | Redirected to `/dashboard`; session cookie set |

## Tests Added
- File: `tests/login.test.tsx`
  - Cases:
    - "renders login form"
    - "shows validation errors for empty submission"
    - "shows error for invalid credentials"
    - "redirects on successful login"

## Discovered Issues
(none)

## Skill Feedback
- Followed procedure: true
- Deviations: (none)
- Suggested changes: (none)
```

## When to Return to Orchestrator

- The required API endpoint does not exist yet and must be built first
- Design mockups or requirements are ambiguous
- The dev server cannot start due to a pre-existing configuration issue you cannot fix
