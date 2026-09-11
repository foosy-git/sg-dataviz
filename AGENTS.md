# SG DataViz — Agent Technical Architecture & Project Context

This document provides essential context, architectural principles, data schemas, operational rules, and deployment procedures required for any AI agent or developer continuing development on **SG DataViz**.

---

## 1. Project Overview & Identity
- **Repository**: `foosy-git/sg-dataviz`
- **Application**: SG DataViz (Singapore Open Data Visualization Platform)
- **Domain**: Public visual analytics platform tracking housing, economy, demographics, education, transit, and climate trends across Singapore using official open government datasets.
- **Production Server**: Google Cloud Compute Engine VM (`34.173.29.213:3000`)
- **Design Philosophy**: *"Warm Editorial / Singapore Botanical"* theme. Muted botanical palette (`#243324` forest green, `#FAF8F5` background, `#E8DCC4` warm sand accent), clean typography, card layouts, and responsive chart containers.

---

## 2. Tech Stack & Core Dependencies
- **Framework**: Next.js 14.2 (App Router, Server & Client Components)
- **Language**: TypeScript 5, React 18
- **Styling**: Tailwind CSS 3.4, PostCSS, Lucide React icons
- **Charts**: Recharts 3.x, Framer Motion
- **Geospatial Visualizations**: Leaflet / React-Leaflet, D3-Geo, TopoJSON Client (`public/sg.geojson` planning area boundaries)
- **Data Parsing & Utilities**: PapaParse, date-fns, SWR, clsx, tailwind-merge
- **Process Manager**: PM2 daemonizing Node.js on Ubuntu (GCP VM)

---

## 3. Directory Layout
```
sgdataviz/
├── .github/workflows/deploy.yml      # CI/CD: build & deploy to GCP VM via SSH/SCP
├── public/
│   ├── sg.geojson                     # Singapore planning area boundary polygons
│   ├── hdb_resale_index.json          # Cached quarterly resale price index (1Q2009 = 100)
│   ├── hdb_historical_avg.json        # Historical annual average resale prices (1990+)
│   └── merlion-bg.jpg, singapore.svg  # Static assets
├── scripts/
│   └── fetchHistorical.js             # Historical data scraping & compilation utility
├── src/
│   ├── app/
│   │   ├── page.tsx                   # Homepage & dashboard module directory
│   │   ├── layout.tsx                 # Root layout, navigation bar, fonts, footer
│   │   ├── hdb/page.tsx               # HDB Resale Prices & Housing Analytics
│   │   ├── economy/
│   │   │   ├── income/page.tsx        # Household Income & Wealth Distribution
│   │   │   └── employment/page.tsx    # Resident Unemployment Rate & Labour Market
│   │   ├── education/ges/page.tsx     # Graduate Employment Survey (Autonomous Unis)
│   │   ├── demographics/birth-rates/  # Total Fertility Rate (TFR) & Marriage Ages
│   │   ├── transport/
│   │   │   ├── coe/page.tsx           # COE Bidding Results & Quota Premiums
│   │   │   └── commuting/page.tsx     # Public Transport Ridership (MRT, Bus, LRT)
│   │   ├── environment/
│   │   │   ├── climate/page.tsx       # Surface Temperature & Rainfall Trends
│   │   │   └── air-quality/page.tsx   # Live PSI & PM2.5 Regional Streaming
│   │   ├── singapore-story/page.tsx   # Multi-Decade Macro Economic Narrative Slider
│   │   └── api/
│   │       ├── hdb-live/route.ts      # Live Datastore proxy for HDB resale records
│   │       └── feedback/route.ts      # Rate-limited feedback submission endpoint
│   ├── components/
│   │   ├── Dashboard.tsx              # Main HDB analytics container
│   │   ├── DashboardFilters.tsx       # HDB estate, flat type & date filters
│   │   ├── charts/                    # Charts (Heatmap, GeoMap, Macro, LeaseDecay)
│   │   ├── economy/, transport/, etc. # Domain-specific dashboard components
│   │   └── ui/                        # Primitives (DataSourcePopover, badges, etc.)
│   └── lib/
│       ├── dataSourceConfig.ts        # Central metadata catalog for all datasets
│       ├── fetchDates.ts              # Live last-updated timestamps from data.gov.sg
│       ├── employmentData.ts          # Static labour market series & MOM data
│       └── utils.ts                   # Formatting helpers & Tailwind merge
```

---

## 4. Official data.gov.sg API Catalog & Sources

All dataset definitions and metadata are centralized in `src/lib/dataSourceConfig.ts`.

| Module | Dataset Name & Agency | Endpoint / Resource ID | Update Frequency |
|---|---|---|---|
| **HDB Resale** | Resale Flat Prices (Jan 2017+), HDB | `d_8b84c4ee58e3cfc0ece0d773c8ca6abc` | Monthly / Live API |
| **HDB Macro** | HDB Resale Price Index (1Q09=100), HDB/SingStat | `d_14f63e595975691e7c24a27ae4c07c79` | Quarterly |
| **Income** | Resident Employed Household Income, SingStat | `d_c74ebe613db891d25e4836aaf98d7a47` | Annual Survey |
| **Income Deciles** | Household Income by Deciles, SingStat | `d_b37bc6f05c76337ad51aefddf0b7c888` | Annual Survey |
| **CPI (Inflation)** | Consumer Price Index, SingStat | `d_b7c2e74824c179995d15d73eac845ba1` | Annual |
| **Employment** | Resident Unemployment Rate (SA, End-June), MOM | `d_285a079d823a1cc22dffb9cac325f81a` | Annual |
| **Education** | Graduate Employment Survey, MOE | `d_3c55210de27fcccda2ed0c63fdd2b352` | Annual Survey |
| **Fertility** | Total Fertility Rate by Ethnic Group, SingStat | `d_e39eeaeadb571c0d0725ef1eec48d166` | Annual |
| **Marriage** | Median Age at First Marriage, SingStat | `d_48bab86448603efe0a6f0fcd6aa545b6` | Annual |
| **COE** | COE Bidding Results, LTA | `d_69b3380ad7e51aff3a7dcc84eba52b8a` | Bi-Monthly (Post-Bid) |
| **Transit** | Public Transport Ridership (Daily Avg), LTA | `d_75248cf2fbf340de6a746dc91ec9223c` | Annual |
| **Climate** | Surface Air Temp (`d_755290a2...`) & Rain (`d_b16d06b8...`) | `d_755290a24afe70c8f9e8bcbf9f251573` | Monthly |
| **Air Quality** | PSI & PM2.5 Live Streams, NEA | `https://api.data.gov.sg/v1/environment/psi` | Hourly (Real-Time) |

---

## 5. Critical Engineering Principles & Rules

### A. Mathematical Rigor (Medians vs Means)
- **Rule**: In housing and income data, **always calculate true mathematical medians** (sort numeric values and extract 50th percentile). Never calculate an arithmetic mean (`sum / count`) when a card or chart is labeled "Median", as public housing has positive price skew due to high-value executive flats.

### B. Dataset Boundary Enforcement
- **Rule**: Never permit open-ended or out-of-bounds date selection in filters.
- In `src/components/DashboardFilters.tsx` and `src/app/api/hdb-live/route.ts`, date selections are clamped strictly within available dataset boundaries (`2017-01` to `2026-09`). Native pickers use `min` and `max` constraints. Out-of-range inputs return 400 or clamped defaults.

### C. Partial Year / YTD Handling
- **Rule**: In multi-year time series (e.g., rainfall in `ClimateDashboard.tsx`), **never plot an incomplete YTD year as a standard annual bar** without distinct visual indication. Partial years must display with dashed borders, soft tones, and a clear `(Year-to-Date • X mos)` annotation to prevent misleading interpretations.

### D. Rate Limiting & API Keys
- **Rule**: When querying `data.gov.sg`, always supply the API key in the headers if present in `process.env.DATAGOV_API_KEY`:
  ```ts
  headers: process.env.DATAGOV_API_KEY ? { 'api-key': process.env.DATAGOV_API_KEY.trim() } : {}
  ```
  Failing to pass the header when making concurrent requests (e.g. `src/lib/fetchDates.ts`) triggers HTTP `429 Too Many Requests`.

### E. User Interface Semantics & Color Inversion
- **Rule**: In employment and cost metrics, invert standard delta coloring:
  - Unemployment decrease: **Green** (favorable economic outcome).
  - Unemployment increase: **Red** (unfavorable).
- For mobile touch interaction, tooltips use decoupled hover/pointer handlers so users are not required to double-tap on touch screens.

---

## 6. Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATAGOV_API_KEY` | Recommended | data.gov.sg API key to avoid 429 rate limits on live queries. |
| `GOOGLE_FEEDBACK_WEBHOOK_URL` | Optional | Google Apps Script webhook to log user feedback to Google Sheets. |
| `NEXT_TELEMETRY_DISABLED` | Optional | Set to `1` in CI/CD and deployment environments. |

---

## 7. CI/CD & Production Deployment

### Automated GitHub Actions Pipeline (`.github/workflows/deploy.yml`)
- Triggers automatically on `git push origin main`.
- **Pipeline Workflow**:
  1. Checks out repository on `ubuntu-latest`.
  2. Runs `npm install` and `npm run build` with `NEXT_TELEMETRY_DISABLED=1`.
  3. Compresses production output (`tar -czf next-build.tar.gz .next`).
  4. Transports archive to GCP VM via SCP (`appleboy/scp-action@v0.1.7`).
  5. SSHs into the VM (`appleboy/ssh-action@v1.2.0`), resets code, pulls latest Git files, installs production dependencies (`npm install --omit=dev`), unpacks `.next`, and triggers zero-downtime reload via `pm2 restart "sg-dataviz"`.

### Target Host Configuration
- **Server IP**: `34.173.29.213`
- **Application Directory**: `~/apps/sg-dataviz`
- **Process Daemon**: PM2 managing `npm run start` under process name `sg-dataviz` on port `3000`.

---

## 8. Verification Workflow for Future Agents

Before committing and pushing changes to `main`:
1. **Type & Lint Check**:
   ```bash
   npx tsc --noEmit
   npm run lint
   ```
2. **Production Build**:
   ```bash
   npm run build
   ```
   *Must exit with code 0.*
3. **Verify API Endpoints & Routes**:
   Ensure dynamic routes (`/api/hdb-live`, `/api/feedback`) and static dashboard pages compile without hydration mismatches.
