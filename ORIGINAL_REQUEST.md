# Original User Request

## Initial Request — 2026-09-01T15:59:13+08:00

# Teamwork Project Prompt

Build 3-4 new analytics dashboard pages in parallel for the existing SG DataViz Next.js portal. The team should autonomously discover interesting datasets from data.gov.sg (e.g. Transport, Health, Demographics), fetch the data, and visualize it. 

Working directory: C:\Users\asus\.gemini\antigravity\scratch\hdb-resale-analyzer
Integrity mode: development

## Requirements

### R1. Autonomous Dataset Integration
Autonomously discover 3 to 4 datasets from data.gov.sg, fetch the data via the CKAN API or JSON downloads, and build dedicated Next.js routes for each.

### R2. Landing Page Integration
Add a link card for each newly built analytics page to the main portal landing page (`src/app/page.tsx`).

### R3. Production-Ready Analytics
Pages must handle data parsing errors gracefully and match the existing aesthetic UI patterns (using Recharts and Tailwind CSS).

## Acceptance Criteria

### Build & Run Verification
- [ ] `npm run build` completes successfully with no errors caused by the new pages.
- [ ] A test script or manual programmatic check (e.g., via `curl` against the local dev server) verifies that all new routes return a 200 HTTP status and do not throw 500 Server Errors.

### Data Robustness
- [ ] The data fetching and parsing logic explicitly handles missing, null, or "N.A." string values without causing chart rendering crashes.
