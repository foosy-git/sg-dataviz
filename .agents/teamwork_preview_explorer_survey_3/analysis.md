# Requirements & E2E Verification Analysis: SG DataViz Portal Expansion

**Author**: Explorer 3 — Requirements & E2E Verification Analyst  
**Date**: 2026-09-01  
**Project**: SG DataViz Portal Expansion (`hdb-resale-analyzer`)  
**Target Path**: `.agents/teamwork_preview_explorer_survey_3/analysis.md`

---

## 1. Executive Summary

The **SG DataViz Portal** expansion requires scaling from a 2-dashboard portal (`/hdb` and `/education/ges`) to a rich, multi-domain Singapore public analytics platform featuring **3 to 4 additional datasets** from `data.gov.sg` (spanning Transport, Environment, Demographics, and Healthcare).

This document establishes the **functional requirements breakdown**, **architectural constraints**, and a **rigorous 4-Tier End-to-End (E2E) Verification Framework**. This verification harness guarantees zero build regressions, flawless HTTP 200 route health, strict data parsing resilience against missing/`"N.A."`/null values, seamless landing page navigation, and verified visual chart rendering via Recharts and Puppeteer.

---

## 2. Requirements & Acceptance Criteria Breakdown

```
+---------------------------------------------------------------------------------------+
|                                SG DATAVIZ PORTAL EXPANSION                            |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   +--------------------------+  +--------------------------+  +-------------------+   |
|   |            R1            |  |            R2            |  |        R3         |   |
|   | Autonomous Dataset Integ |  |  Landing Page Integ      |  | Production-Ready  |   |
|   | 3-4 data.gov.sg Datasets |  | src/app/page.tsx Link    |  | Resilient Parsing |   |
|   | Dedicated Next.js Routes |  | Cards ('Live' status)    |  | Recharts + Theme  |   |
|   +--------------------------+  +--------------------------+  +-------------------+   |
|                                                                                       |
|                                ACCEPTANCE CRITERIA MATRIX                             |
|   1. `npm run build` succeeds with exit code 0 and clean static/dynamic route traces. |
|   2. Automated HTTP checks verify 200 OK status (no 500s) on all portal routes.       |
|   3. Zero chart crashes on dirty, null, empty, or "N.A." data feeds.                  |
|   4. Responsive, editorial-grade UI adhering to the Fraunces / Plus Jakarta palette.  |
+---------------------------------------------------------------------------------------+
```

### 2.1 R1: Autonomous Dataset Integration
* **Dataset Discovery Scope**: 3 to 4 datasets sourced autonomously from `data.gov.sg` or official Singapore open data portals.
  * **Candidate Domains**:
    1. **Public Transport & Mobility**: Daily MRT/LRT/Bus passenger ridership or station passenger volume trends.
    2. **Environment & Weather**: Historical Singapore surface temperature, monthly rainfall, or PSI/PM2.5 air quality indices.
    3. **Demographics & Population**: Resident population by planning area, age distribution, or household income tiers.
    4. **Public Health & Healthcare**: Polyclinic attendances, public healthcare hospital capacity, or chronic disease metrics.
* **Routing Architecture**:
  * Each dataset must have a dedicated Next.js App Router directory:
    * `/transport/ridership` (or `/transport/mrt`)
    * `/environment/air-quality` (or `/environment/weather`)
    * `/demographics/population`
    * `/health/attendances` (or `/health/facilities`)
  * Route file convention: `src/app/<domain>/<subroute>/page.tsx`
* **Data Layer Strategy (Dual-Mode Reliability)**:
  * **Build-Time Snapshot (Local Cached Fallback)**: High-resolution JSON snapshots pre-fetched and stored under `public/data/<dataset>.json` (e.g. `public/data/transport-ridership.json`). This ensures the app is 100% immune to external API downtime or rate-limiting during `npm run build` or local previews.
  * **Server / API Fetching**: Server Components or Next.js Route Handlers (`src/app/api/...`) can perform fresh queries to the CKAN Datastore endpoint (`https://data.gov.sg/api/action/datastore_search?resource_id=...`) with automatic fallback to the static snapshot on network failure.
  * **Type Definitions & Utilities**: Type interfaces located in `src/types/<domain>.ts` and parsing helpers in `src/lib/<domain>.ts`.

---

### 2.2 R2: Landing Page Integration (`src/app/page.tsx`)
* **Current State**:
  * `src/app/page.tsx` currently defines a `dashboards` array with 4 items: `HDB Horizon` (`/hdb`, Live), `MRT & Transport Flow` (`#`, Coming Soon), `Education & Careers` (`/education/ges`, Live), and `Environmental Metrics` (`#`, Coming Soon).
* **Expansion Requirements**:
  * Transform all placeholder cards (`status: 'Coming Soon'`, `href: '#'`) into fully operational cards (`status: 'Live'`, active `href`).
  * Add link cards for additional newly built dashboards (e.g. Demographics, Health).
  * **Card Properties Specification**:
    ```typescript
    interface DashboardCard {
      title: string;          // e.g. "Public Transport Flow"
      description: string;    // Editorial description summarizing key analytical capabilities
      icon: LucideIcon;       // Matching Lucide React icon (Train, Leaf, Users, HeartPulse, etc.)
      href: string;           // Valid Next.js route path (e.g. "/transport/mrt")
      status: 'Live';         // Must be set to 'Live'
      color: string;          // Tailwind background/text tint (e.g. "bg-blue-500/10 text-blue-700")
    }
    ```
  * **Interactive Behavior**:
    * Cards must trigger hover elevation (`hover:shadow-md hover:border-[#243324]/20 hover:-translate-y-1`), arrow animation (`group-hover:translate-x-1`), and navigate cleanly to the target route upon click.
    * Grid layout must scale cleanly across viewports (1 column on mobile, 2 columns on tablet/desktop, or responsive 3-column layout if 6 cards).

---

### 2.3 R3: Production-Ready Analytics & UI Design System

#### Data Resilience & Parsing Rules
* Real-world government datasets frequently contain inconsistent representations of missing data. The normalization layer must enforce the following strict handling rules:

| Input Pattern | Raw Value Example | Sanitization Rule | Recharts / UI Target Output |
| :--- | :--- | :--- | :--- |
| **Missing string indicators** | `"N.A."`, `"na"`, `"NA"`, `"-"`, `"nil"`, `""`, `"null"` | Convert to `null` (or safe default `0` for summations) | Recharts skips `null` data points without crashing |
| **Formatted numeric strings** | `"1,250.75"`, `" $3,400 "`, `"84.5%"` | Strip non-numeric characters (commas, spaces, `$`, `%`) and `parseFloat` | Clean Javascript `number` (e.g. `1250.75`) |
| **Invalid / NaN values** | `"unknown"`, `undefined`, `NaN` | Explicit `isNaN(val) ? null : val` check | `null` |
| **Empty Filter Results** | `data.length === 0` | Empty array guard before `reduce()`, `Math.min()`, `Math.max()` | Safe fallback object (`{ average: 0, max: 0 }`) & Empty-state UI banner |
| **Zero Division** | Total count = 0 in denominator | `count > 0 ? sum / count : 0` | Safe numerical `0` |

#### UI Aesthetic & Design System Tokens
All new dashboard pages must mirror the established **Editorial Annual Report** aesthetic established in `hdb-resale-analyzer`:
* **Color Palette**:
  * Canvas Background: `#FBF9F5` (Soft warm cream)
  * Primary Text & Accents: `#243324` (Deep forest olive slate)
  * Secondary / Subtext: `#243324`/70 (Muted slate olive)
  * Warm Accent / Badge: `#E8DCC4` (Warm sand)
  * Dark Contrast Accent: `#1F2B1D` (Deep forest shadow)
* **Typography**:
  * Headings, Hero titles, and Top KPI Values: `font-serif` (Fraunces variable font)
  * Body, Badges, Tables, Filter Controls, Tooltips: `font-sans` (Plus Jakarta Sans)
* **Standard Page Anatomy**:
  1. **Top Reading Progress Bar**: Motion scroll indicator (`framer-motion` scaleX).
  2. **Sticky Header Navbar**: "Back to Portal" button (`ArrowLeft`, linking to `/`), Domain Icon + Title, "Live Data Sync" / "data.gov.sg" pill badge.
  3. **Hero Section**: Editorial headline, concise investigative subtitle, timestamp / source tag.
  4. **Interactive Filter Toolbar**: Period selectors, categories, multi-select town/station badges, search input with 400ms debounce.
  5. **Top KPI Metric Cards**: 3-4 headline cards displaying key summary numbers, percentage shifts, or top-ranking entities.
  6. **Interactive Visualizations (Recharts)**:
     - `ResponsiveContainer width="100%" height={350-450}`
     - Custom styled tooltips matching `#FBF9F5` card styling.
     - Clear axis legends, formatted ticks (`$`, `k`, `M`, `%`).
  7. **Granular Breakdown Table / Tabbed Views**: Clean data table with sortable columns and pagination for detailed record exploration.

---

## 3. 4-Tier E2E Verification Strategy

To guarantee zero-defect delivery, the verification process is structured into 4 sequential verification tiers. Each tier has automated scripts, explicit criteria, and pass/fail thresholds.

```
+----------------------------------------------------------------------------------------+
|                                4-TIER VERIFICATION MATRIX                              |
+----------------------------------------------------------------------------------------+
|                                                                                        |
|  [ TIER 1: HTTP & Route Health ]                                                       |
|  * Probe all routes via fast Node HTTP fetcher (localhost:3000)                        |
|  * Verify Status === 200, Content-Type === text/html, zero 500 server errors          |
|                                                                                        |
|  [ TIER 2: Boundary & Parsing Unit Suite ]                                             |
|  * Unit test parser functions against "N.A.", "-", null, corrupt strings, empty sets   |
|  * Assert zero unhandled exceptions, zero NaN/Infinity KPI outputs                     |
|                                                                                        |
|  [ TIER 3: Landing Page & Navigation Symmetry ]                                        |
|  * Extract all dashboard cards from src/app/page.tsx                                   |
|  * Verify every href maps to a live route, status === 'Live', back navigation works    |
|                                                                                        |
|  [ TIER 4: Real-World Browser DOM & Visual Integrity (Puppeteer) ]                     |
|  * Headless Chrome loads every route, checks console errors = 0                        |
|  * Verifies Recharts SVG surface (<svg class="recharts-surface">), rendered bars/lines  |
|  * Captures full-page screenshots for forensic audit                                  |
+----------------------------------------------------------------------------------------+
```

---

### 3.1 Tier 1: Route Existence & 200 HTTP Health Suite

* **Goal**: Programmatically confirm that every route in the Next.js portal is accessible, compiles without runtime crash, and delivers valid HTML.
* **Target Routes**:
  1. `/` (Portal Landing Page)
  2. `/hdb` (HDB Horizon Dashboard)
  3. `/education/ges` (Graduate Employment Survey Dashboard)
  4. `/transport/mrt` (or `/transport/ridership` — Transport Dashboard)
  5. `/environment/air-quality` (or `/environment/weather` — Environment Dashboard)
  6. `/demographics/population` (Demographics Dashboard)
  7. `/health/facilities` (or `/health/attendances` — Health Dashboard, if 4th dataset)
  8. `/api/hdb-live` (Existing live API route)
* **Test Runner Architecture (`scripts/verify-routes.mjs`)**:
  * Uses Node.js native `fetch` (Node 18+).
  * Executes concurrent requests against the active server (`http://localhost:3000`).
  * **Assertions per Route**:
    1. Response HTTP Status === 200 (Any status 404, 500, 502, 503 constitutes immediate test failure).
    2. Header `content-type` starts with `text/html` (or `application/json` for API routes).
    3. Body length > 500 bytes (prevents blank/white-screen responses).
    4. Body text does NOT contain crash keywords: `__NEXT_ERROR__`, `Internal Server Error`, `Unhandled Runtime Error`, `Minified React error #`.
  * **Exit Code**: Returns `0` on all passes; returns `1` with a detailed failure report on any assertion breach.

---

### 3.2 Tier 2: Boundary & Corrupt Data Parsing Unit Checks

* **Goal**: Ensure data normalization routines are resilient to all variations of dirty, missing, or malformed data without throwing runtime exceptions or generating `NaN`/`Infinity`.
* **Test Runner Architecture (`scripts/test-parsers.mjs`)**:
  * Runs using Node.js built-in `node:assert` and `node:test` (zero additional devDependencies needed).
  * **Test Scenarios per Parser**:
    1. **Null / Undefined Fields**: Input `{ value: null, rate: undefined }` -> Parsed as `null` or `0`.
    2. **Government "N.A." Variants**: Input `["na", "NA", "N.A.", "n.a.", "-", "nil", "None", ""]` -> Safely normalized to `null`.
    3. **Formatted String Numbers**: Input `" 1,234.50 "` -> `1234.50`; `"$4,500"` -> `4500`; `"98.2%"` -> `98.2`.
    4. **Empty Dataset Handling**: Input `[]` to aggregate functions (e.g. `calculateTopMetrics([])`, `computeYearlyAverages([])`) -> Returns `{ overallAverage: 0, topEntity: null, totalVolume: 0 }` instead of throwing `TypeError` or computing `0/0 = NaN`.
    5. **Extreme Outliers & String Types**: Input `{ value: "Corrupted String Text" }` -> Handled as `null`, preventing NaN propagation into Recharts scales.

---

### 3.3 Tier 3: Landing Page Links & Navigation Consistency Suite

* **Goal**: Guarantee zero broken links, no orphan routes, and complete status synchronization between the landing page and the underlying routes.
* **Test Runner Architecture (`scripts/verify-navigation.mjs`)**:
  * Reads and parses `src/app/page.tsx`.
  * **Assertions**:
    1. **No Dead Anchor Hrefs**: All `dashboard.href` values must NOT be `'#'` or empty strings.
    2. **File Route Mapping**: For every `href` (e.g. `/transport/mrt`), verifies that the physical file `src/app/transport/mrt/page.tsx` exists on the filesystem.
    3. **Status Tag Synchronization**: Every completed dashboard card has `status: 'Live'`.
    4. **Back Navigation Verification**: Reads each dashboard component/page file to ensure it includes a "Back to Portal" navigation link (`<Link href="/">`).
    5. **Metadata & Branding**: Verifies that page titles match between landing card titles and dashboard page headers.

---

### 3.4 Tier 4: Real-World Responsive Rendering & Chart Data Integrity Suite

* **Goal**: Render all dashboards in a real headless Chrome browser instance to catch client-side hydration errors, React state crashes, and Recharts SVG drawing failures.
* **Test Runner Architecture (`scripts/test-e2e-puppeteer.mjs`)**:
  * Uses Puppeteer (pre-installed in `package.json` at `v25.9.0`).
  * Launches headless Chrome instance (`headless: "new"`).
  * **Verification Procedures per Route**:
    1. **Console Error Listener**:
       ```javascript
       const errors = [];
       page.on('console', msg => {
         if (msg.type() === 'error') errors.push(msg.text());
       });
       page.on('pageerror', err => errors.push(err.message));
       ```
       Asserts `errors.length === 0` after full page load and network idle.
    2. **DOM Element Verification**:
       - Page header exists (`<header>` or `h1`).
       - Recharts elements rendered: `document.querySelectorAll('.recharts-surface, svg.recharts-surface').length >= 1`.
       - Stat KPI cards contain valid numerical values (assert no element text contains `"NaN"`, `"undefined"`, or `"Infinity"`).
    3. **Interactive Filter Simulation**:
       - Clicks year dropdown or filter tabs.
       - Waits for DOM update and verifies charts re-render without throwing React lifecycle errors.
    4. **Visual Evidence Generation**:
       - Takes full-page screenshots saved to `.agents/artifacts/screenshots/<route_name>.png` for visual audit.

---

## 4. Test Infrastructure Deliverables Specification

To ensure seamless coordination between Orchestrator, Workers, Reviewers, and Challengers, two core specification documents must be created:

### 4.1 Specification for `TEST_INFRA.md`
* **File Location**: `C:\Users\asus\.gemini\antigravity\scratch\hdb-resale-analyzer\.agents\TEST_INFRA.md`
* **Contents**:
  1. **Test Suite Overview**: Map of test scripts, roles, and prerequisites.
  2. **Scripts Inventory**:
     * `scripts/verify-routes.mjs` — Fast HTTP 200 health check runner.
     * `scripts/test-parsers.mjs` — Boundary and edge-case unit test runner.
     * `scripts/verify-navigation.mjs` — Landing page link and route symmetry checker.
     * `scripts/test-e2e-puppeteer.mjs` — Headless browser DOM and visual audit runner.
  3. **Execution Commands**: Direct CLI commands for running individual tiers or all tiers in sequence (`npm run verify:all` or `node scripts/...`).
  4. **Mock Data Injection**: How to inject edge-case JSON files into `public/data/` for automated robustness testing.
  5. **Exit Code Conventions**: Standardized `0` (Success) and `1` (Failure) return values for pipeline automation.

### 4.2 Specification for `TEST_READY.md`
* **File Location**: `C:\Users\asus\.gemini\antigravity\scratch\hdb-resale-analyzer\.agents\TEST_READY.md`
* **Contents**:
  1. **Pre-flight Verification Checklist**:
     - Next.js server running on `http://localhost:3000` (or build verified).
     - Static data snapshots verified in `public/`.
  2. **Target Routes Inventory Table**: Exact list of routes with expected HTTP status, title, and key components.
  3. **Step-by-Step Test Execution Protocol**: Detailed sequence of terminal commands to run.
  4. **Acceptance Gate Checklist**: Verification checklist for Challengers and Auditors to sign off in `GATE_STATUS.md`.

---

## 5. Potential Pitfalls, Edge Cases, & Mitigation Strategies

| Risk / Pitfall | Root Cause | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **External API Rate Limit or Downtime** | `data.gov.sg` API downtime, SSL errors, or 429 throttling during build/test. | Build fails or returns 500 error on route load. | **Local Snapshot First**: Bundle offline JSON data snapshot in `public/`. Fetch live API with fallback to local JSON on error. |
| **Recharts `-1` Container Dimension Warning** | `ResponsiveContainer` rendering inside unmeasured CSS flex/grid container before layout calculation. | Console warning / potential chart rendering layout jitter. | Specify fixed aspect ratio or min-height wrapper (`min-h-[350px] w-full`) and set `isAnimationActive={false}` in test environments. |
| **Hydration Mismatches** | `new Date().getFullYear()` or client-side random IDs differing between SSR and hydration. | React console warning / hydration failure. | Use deterministic static dates or ensure date calculations are enclosed in client components (`'use client'`) or `useEffect`. |
| **Division by Zero in KPI Aggregations** | Filter combinations returning 0 matching records. | Displays `NaN` or `Infinity` on dashboard KPI stat cards. | Strict defensive aggregations: `count > 0 ? (sum / count) : 0` and graceful "No matching data" empty-state UI. |
| **Missing TypeScript / Next.js Build Errors** | Unchecked types or import discrepancies during `next build`. | `npm run build` exits with code 1. | Run `npm run build` pre-verification after each milestone track. |

---

## 6. Conclusion & Recommendations for the Implementation Team

1. **Dataset Selection Recommendation**: Select 3 to 4 diverse, high-visual-impact datasets:
   - **Route 1 (`/transport/ridership` or `/transport/mrt`)**: Public Transport Daily Commuter Ridership (MRT/Bus trends over time).
   - **Route 2 (`/environment/weather` or `/environment/air-quality`)**: Singapore Climate & Rainfall Historical Trends / PSI Air Quality.
   - **Route 3 (`/demographics/population`)**: Population Demographics by Planning Area & Age Group.
   - **Route 4 (`/health/polyclinics` or `/health/attendances`)**: Public Healthcare Polyclinic Attendances & Chronic Conditions.
2. **Reliability-First Data Pipeline**: Implement pre-bundled JSON snapshots in `public/` alongside resilient parser functions in `src/lib/`.
3. **Execution Sequencing**:
   - Step 1: Implement dataset types & resilient parsers (`src/types/`, `src/lib/`).
   - Step 2: Build dashboard components & route pages (`src/components/`, `src/app/`).
   - Step 3: Integrate landing page link cards (`src/app/page.tsx`).
   - Step 4: Execute 4-Tier Test Suite (`verify-routes.mjs`, `test-parsers.mjs`, `verify-navigation.mjs`, `test-e2e-puppeteer.mjs`).
   - Step 5: Verify `npm run build` and gate sign-off.
