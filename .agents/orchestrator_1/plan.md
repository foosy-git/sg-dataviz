# Orchestration Plan — SG DataViz Portal Expansion

## Objective
Build 3-4 new analytics dashboard pages in parallel for the SG DataViz portal (Next.js), integrating data from data.gov.sg (Transport, Health, Demographics, etc.), linking them on `src/app/page.tsx`, and ensuring production-ready error handling, Recharts + Tailwind UI, and passing builds/E2E verification.

## Execution Steps

### Phase 0: Survey & Discovery (Parallel Explorers)
- **Explorer 1**: Codebase Structure, Existing Route Patterns, UI Components, Tailwind & Recharts conventions, Landing page structure (`src/app/page.tsx`), build scripts, test setup.
- **Explorer 2**: Data.gov.sg / CKAN APIs & Public Datasets Discovery (Transport, Public Transport, Demographics, Health, etc.) - explore viable endpoints, schema structure, null/N.A. handling requirements.
- **Explorer 3**: Requirements Analysis, E2E testability, edge cases, error boundary requirements, route naming conventions.

### Phase 1: Architecture & PROJECT.md
- Synthesize explorer findings into `PROJECT.md`.
- Formulate Feature Inventory (Dataset 1, Dataset 2, Dataset 3, Dataset 4, Landing Page Link Cards, Resilient Error Handling, E2E Test Suite).
- Define milestones, code ownership boundaries, and interface contracts.

### Phase 2: Implementation & E2E Testing Tracks
- Dispatch Workers / Sub-orchestrators for:
  - Milestone 1: Dashboard Route 1 + Data Fetcher / Parser
  - Milestone 2: Dashboard Route 2 + Data Fetcher / Parser
  - Milestone 3: Dashboard Route 3 + Data Fetcher / Parser
  - Milestone 4: Dashboard Route 4 + Data Fetcher / Parser (if 4 datasets selected)
  - Milestone 5: Landing page link cards integration (`src/app/page.tsx`)
  - E2E Testing Track: Automated route verification script (200 status, no 500s, mock/live error fallback handling).

### Phase 3: Quality Assurance & Forensic Auditing
- Reviewers (2) check correctness, UI consistency, graceful error handling.
- Challengers (2) empirically verify route responses and edge-case inputs (null, "N.A.", empty data).
- Forensic Auditor (`teamwork_preview_auditor`) validates genuine implementation and lack of dummy hardcoding.
- Gate check in `GATE_STATUS.md`.

### Phase 4: Final Synthesis & Parent Reporting
- Verify all acceptance criteria.
- Prepare comprehensive handoff report (`handoff.md`).
- Communicate final report to parent via `send_message`.
