# Agent Documentation: SG DataViz

This file contains critical context, architectural decisions, and technical quirks about the SG DataViz project. **Any agent working on this repository MUST read and understand these rules before making changes.**

## 1. CRITICAL: The Next.js Build & Git Workflow

This project is deployed on a low-RAM VM that cannot handle running `next build`. Therefore, **the `.next` folder is tracked in Git** to bypass the VM's memory limits. The VM simply pulls from `main` and runs `npm run start`.

### 🚨 The "Dev Artifact" Crash Danger
**NEVER** commit the `.next` folder after running `npm run dev` locally! 
Running the dev server injects development-specific manifests (e.g., `_buildManifest.js`, `app-pages-internals.js`) into the `.next` folder. If you commit these dev artifacts and push to production, the `npm run start` server will completely crash with an `ERR_EMPTY_RESPONSE`.

**The Golden Rule for Deployment:**
Before committing ANY changes to `main`, you MUST run a clean production build:
```bash
npm run build
git add .
git commit -m "Your message"
git push origin main
```
If you ever run `npm run dev` to test locally, you must run `npm run build` again before committing.

## 2. Tailwind CSS v4 Quirks

This project uses **Tailwind CSS v4**. 
In v4, custom CSS variables defined in the `:root` of `globals.css` (such as `--popover`, `--accent`) do **not** automatically generate utility classes like `bg-popover` or `text-accent` unless they are explicitly registered inside a `@theme` block in the CSS. 
If you find UI elements that are transparent or missing backgrounds (like dropdowns), do not assume `bg-popover` works. Fall back to standard Tailwind colors (e.g., `bg-white`, `bg-gray-100`) to guarantee it works.

## 3. Data.gov.sg v2 API Navigation

All data in this portal is fetched live from the Singapore Government's open data API.

### The Search API is Broken
The v2 API's search endpoints (`package_search` and `?search=`) are currently **broken**. They return the same standard list of datasets regardless of your query. 
To find new `resource_id`s for datasets, you must either:
1. Search the web.
2. Write a script to paginate through `https://api-production.data.gov.sg/v2/public/api/datasets?page=1` up to page 200+, save the JSON locally, and `grep` it.

### Fetching Data
Data is fetched using the `datastore_search` action:
`https://data.gov.sg/api/action/datastore_search?resource_id=<ID>&limit=100`

**Known Resource IDs in use:**
*   **HDB Resale Prices:** `d_8b84c4ee58e3cfc0ece0d773c8ca6abc`
*   **Birth Rates & Fertility (TFR, Ethnic, Age):** `d_e39eeaeadb571c0d0725ef1eec48d166`
*   **Median Age at First Marriage:** `d_48bab86448603efe0a6f0fcd6aa545b6`
*   **Graduate Employment Survey (GES):** `d_3c55210de27fcccda2ed0c63fdd2b352`
*   **COE Bidding Results:** `d_b5a1955fb490518f8eaf0c1966a3d314`
*   **Climate/Temperature:** `d_2cdeebbbabf5742617a268afdb3203c6`

## 4. Architecture & Data Flow

1.  **Server Components (`src/app/.../page.tsx`):**
    These files are responsible for fetching the raw data from `data.gov.sg`, applying `revalidate: 86400` for 24-hour caching, and transforming/merging the data (e.g., aligning multiple datasets by Year).
2.  **Client Components (`src/components/.../Dashboard.tsx`):**
    These files receive the clean, merged data array as props. They handle the UI state (e.g., time range filters) and render the Recharts visualizations.

**Data Alignment Warning:**
When fetching multiple datasets to overlay on a single chart (e.g., TFR and Marriage Age), be aware that different datasets may end at different years (e.g., one ends in 2023, the other has projections up to 2026). Ensure your "Latest Data" UI cards search backward for the first *valid* data point rather than blindly trusting `data[data.length - 1]`.
