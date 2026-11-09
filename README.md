# LegacyLens AI — Developer-First Legacy Codebase, Blast-Radius & Interactive KT Blueprint Copilot

[![Gemini 2.5 Flash](https://img.shields.io/badge/Gemini-2.5%20Flash-6366F1?logo=google&logoColor=white)](https://ai.google.dev/)
[![Next.js 14 App Router](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black?logo=next.js)](https://nextjs.org/)
[![Theme: Blueprint Obsidian](https://img.shields.io/badge/Theme-Blueprint%20Obsidian-070B14)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

**LegacyLens AI** is a signature developer-tools intelligence platform (inspired by **GitHub Next, React Flow Canvas, Linear, and Raycast**). It ingests multi-file legacy source code, database DDL schemas, and technical memos, transforming them into live, line-cited developer intelligence via **`@google/genai` (`gemini-2.5-flash`)**.

Rejecting generic single-page dashboards, LegacyLens AI provides a **3-Pane Interactive IDE & Visual Blueprint Canvas** with real-time cross-file blast-radius simulation, side-by-side plain-English code X-Rays, dead code audits, characterization test harnesses (`TestGuard`), and a downloadable 4-page Technical KT Blueprint PDF.

---

## 🏛️ Signature 3-Pane IDE Architecture

### 1. Left Pane (22% Width — Collapsible VS Code Repository Explorer)
- **Top Actions:** 1-click **"Load 4-File Banking Repo"** preset button and **"+ Upload / Paste Code"** modal.
- **Interactive File Tree:** File-type badges (`.sql`, `.java`, `.txt`, `.py`, `.ts`), line counts, hardcoded business rule counters (`2 Rules` on `LoanInterestEngine.java`, `1 Rule` on `UserAuthSchema.sql`), and active selection indicators.
- **Client-Side Ingestion:** Native `FileReader` + `jszip` for in-browser `.zip` unpacking, multi-file uploads, and `=== FILE: Name ===` pasted block parsing.

### 2. Center Stage (53% Width — Blueprint Canvas + Side-by-Side Split X-Ray)
- **Top Half (Engineering Dot-Matrix Blueprint Canvas):**
  - Custom interactive SVG visual flow stage with dot-matrix grid (`#070B14`, `radial-gradient(#1E293B 1.2px, transparent 1.2px)` at `20px 20px`).
  - Animated directional data-flow particles connecting `UserAuthSchema.sql` ⇄ `MonthlyBillingBatch.java` ⇄ `LoanInterestEngine.java` ⇄ `legacy_arch_notes_2016.txt`.
  - **Dynamic Blast-Radius Color States:** When a change simulation runs, affected nodes and edges pulse **Crimson (`#F43F5E`)** or **Amber (`#F59E0B`)** in real-time.
- **Bottom Half (Side-by-Side Split Code X-Ray Drawer):**
  - *Left Split:* Line-numbered legacy source code viewer with Amber gutter markers on hardcoded logic lines and smooth scroll-to-line highlighting.
  - *Right Split:* Plain-English Business Rule translation, I/O Contracts, and Technical Debt explanations aligned directly to exact `File:Line` citations.

### 3. Right Pane (25% Width — Docked "Blast-Radius & Forensic Copilot" Drawer)
- Always visible alongside diagram and code!
- **Tool 1: Live Blast-Radius Simulator (`/api/impact`):** Pick target file, column, or method with 1-click scenarios (*Rename `customer_tier`*, *Update Tax 18.5% → 12.0%*). Computes Blast-Radius Risk Score (`0–100%`), severity badges, broken downstream sites (`MonthlyBillingBatch.java:94`), side effects, and refactoring checklist while lighting up graph nodes.
- **Tool 2: Grounded Forensic Copilot (`/api/chat`):** 100% grounded Q&A with 1-click prompt chips. Every response cites clickable `[FileName:LineStart-LineEnd]` pills that automatically open that file in the center X-Ray and scroll to the line. Zero hallucinations protocol.

---

## 🎯 3 Focused IDE Modes

1. **Architecture & Code X-Ray:** Signature 3-pane workflow connecting repository tree, blueprint canvas, side-by-side code X-Ray, and docked simulator/copilot.
2. **Dead Code & Coupling Audit:** Visual 3-column architectural audit:
   - *Safe-to-Retire Dead Code (80–100% Safe):* e.g., `MonthlyBillingBatch.java:165-192` (28 dead lines of decommissioned tape batch) & `tbl_account_master.legacy_fax_optin`.
   - *High-Risk Tangled / Circular Dependencies (Caution):* Deprecated date math & implicit database sync triggers.
   - *Active Critical Path (0% Safe - Protected):* Core settlement and yield calculation loops.
   - *Safe Purge Diff Preview:* 1-click preview of exact lines to delete without side-effects.
3. **TestGuard Generator:** Split-screen characterization test studio (Michael Feathers methodology). Generates runnable, copyable unit & integration test suites (**JUnit 5**, **Jest**, **PyTest**, **NUnit**) via `/api/tests` with edge-case coverage tags (Happy Path, Boundary/Null, Hardcoded Rule Verification, Defensive Legacy Trap).

---

## 📄 Downloadable 4-Page Technical KT Blueprint PDF

Clicking **`Export Technical KT & Blueprint PDF`** generates an executive engineering dossier using `jspdf` + `jspdf-autotable`:
- **Page 1:** Executive Summary, Technical Debt Scorecard, and **Vector Architecture Diagram** drawn natively onto the PDF canvas.
- **Page 2:** Module-by-Module I/O Contracts & Extracted Business Rules Table.
- **Page 3:** Dead Code Audit & Strangler-Fig Decoupling Roadmap.
- **Page 4:** Auto-Generated Characterization Test Harness & Architecture Governance Sign-off.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Or build and start production server
npm run build
node ./node_modules/next/dist/bin/next start -p 3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
