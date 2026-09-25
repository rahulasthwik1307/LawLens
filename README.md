# LawLens — India-First GenAI Legal Document Assistance Platform

> **Important Legal Notice**  
> LawLens provides legal information, analysis, and document preparation assistance. It does **not** provide legal advice, make binding determinations, or replace consultation with a qualified legal advocate or advocate-on-record.

---

## 1. Product Overview

**LawLens** is an India-first GenAI platform engineered to help individuals, founders, tenants, and small enterprises understand, verify, compare, and act on legal agreements with uncompromising evidence grounding.

Dense contracts, arbitrary arbitration clauses, and unfamiliar statutory terminology often disadvantage non-lawyers. LawLens bridges this asymmetry by transforming opaque agreements into clear, plain-language explanations where **every single finding is deterministically verified against authentic source text lines**.

The platform is structured around six core capabilities:
* **Understand:** Plain-language synthesis categorized into parties, dates, monetary terms, rights, obligations, restrictions, termination clauses, dispute resolution venues, and review points.
* **Verify:** Deterministic evidence verification linking every AI claim directly to exact line coordinates in the original document.
* **Compare:** Two-stage structural clause alignment and difference analysis across multiple versions or drafts.
* **Act:** Automated extraction of time-sensitive milestones, compliance requirements, and risk items into actionable checklists.
* **Prepare:** Evidence-backed Legal Action Plans and exportable **Professional Preparation Packs** for productive advocate consultations.
* **Connect:** Contextual routing to official Indian statutory institutions, including NALSA, State Legal Services Authorities (SLSA), National Consumer Helpline (NCH), and the Indian Kanoon legal research repository.

---

## 2. Core Differentiator: Strict Evidence Grounding

Most legal AI platforms summarize documents loosely, introducing hallucinations, ungrounded confidence, or fabricated clauses. LawLens enforces strict deterministic evidence grounding:

```text
       AI Explanation
             ↓
    Original Document Source
             ↓
Deterministic Evidence Validator
             ↓
  [ Verified ] or [ Unverified ]
```

* **Zero Ungrounded Claims:** Every finding must provide verbatim evidence text and target line numbers.
* **Independent Verification:** The evidence validator (`evidence-validator.ts`) executes deterministic string-boundary, token-normalized, and substring matching against the normalized document lines.
* **Explicit Distinction:** Original contract text is displayed in serif typography with line coordinates; plain-language interpretations are rendered in sans-serif and explicitly labeled. If a clause is missing or ambiguous, LawLens reports `unclear_from_document` rather than guessing.

---

## 3. Challenge Alignment & Capabilities

| Challenge Requirement | How LawLens Solves It | Implemented Component |
| :--- | :--- | :--- |
| **Document Simplification** | Translates dense legalese into plain language while preserving contractual precision. | `findings-panel.tsx`, `analysis-schema.ts` |
| **Important Clause Identification** | Automatically extracts 9 statutory categories: parties, dates, payments, rights, obligations, restrictions, termination, dispute resolution, review points. | `ai-service.ts`, `groq-schemas.ts` |
| **Evidence-Grounded Q&A** | Answers document questions with cited line ranges and source snippets. Rejects out-of-document speculation. | `document-qa-panel.tsx`, `context-retriever.ts` |
| **Document Comparison** | Structural clause alignment and side-by-side discrepancy detection across agreements. | `document-comparison-panel.tsx`, `clause-aligner.ts` |
| **Inconsistency Detection** | Identifies altered monetary amounts, modified notice periods, deleted covenants, and added liabilities. | `comparison-schema.ts`, `evidence-validator.ts` |
| **Options & Next Steps** | Synthesizes actionable triggers into verified checklists prioritized by urgency. | `action-map-panel.tsx`, `action-extractor.ts` |
| **Legal Action Planner** | 7-part structured action plan: what it says, what it means, why it matters, what to check, next steps, lawyer questions, and evidence. | `legal-action-planner-panel.tsx`, `legal-action-planner.ts` |
| **Consultation Preparation** | Compiles a comprehensive, print-ready Professional Preparation Pack with statistics, key findings, and questions for counsel. | `preparation-pack-panel.tsx`, `pack-composer.ts` |
| **Statutory Connection** | Routes users to authoritative Indian dispute forums and free legal aid authorities based on document context. | `connect-panel.tsx`, `resource-registry.ts` |

---

## 4. Main Workflows

### High-Level Workflow
```text
  Upload Document
        ↓
    Understand
        ↓
     Verify
        ↓
       Act
        ↓
     Connect
```

### Detailed End-to-End System Workflow
```text
  Upload (.txt, .md, .pdf)
        ↓
  Server-Side Extraction & Normalization (line mapping, token counting)
        ↓
  Token Guard Preflight & SHA-256 Cache Check
        ↓
  Groq Primary Provider (openai/gpt-oss-120b)
   [On Transient Failure: Auto-Fallback to openai/gpt-oss-20b]
        ↓
  Strict JSON Schema Validation (Zod)
        ↓
  Deterministic Evidence Verification (exact quote & line matching)
        ↓
  Interactive Split-Pane Workspace:
  ├── Findings (9 statutory categories + verified line quotes)
  ├── Evidence Viewer (synchronous scrolling & line highlighting)
  ├── Document Q&A (retrieval-augmented, evidence-grounded answers)
  ├── Compare (clause alignment, modified terms, inconsistency flags)
  ├── Actions & Action Map (prioritized tasks, deadlines, verification checklist)
  ├── Legal Action Planner (7-step structured evaluation for critical clauses)
  ├── Preparation Pack (exportable, print-ready briefing pack for advocates)
  └── Connect (NALSA, State Legal Aid, NCH, Indian Kanoon)
```

---

## 5. System Architecture

```text
Next.js 16 (App Router & React 19)
               │
               ▼
       API Route Handlers
  (/api/documents/analyze, /qa, /compare, /actions)
               │
               ▼
      LawLensAIService (src/services/ai/ai-service.ts)
  ├── Token Guard (token-guard.ts)
  ├── In-Flight Deduplication & SHA-256 Cache (result-cache.ts)
  └── Context Retriever (context-retriever.ts)
               │
               ▼
Groq Legal Analysis Provider (src/services/ai/providers/groq-provider.ts)
  ├── Primary Model:   openai/gpt-oss-120b
  └── Fallback Model:  openai/gpt-oss-20b
               │
               ▼
     Strict Structured Output (JSON Schema)
               │
               ▼
     Zod Schema Validation (analysis-schema.ts, qa-schema.ts, etc.)
               │
               ▼
Deterministic Evidence Validator (src/services/ai/evidence-validator.ts)
               │
               ▼
    Workspace UI Panels (Findings, Q&A, Compare, Actions, Prepare, Connect)
```

### Production Resilience & Reliability Mechanisms
1. **Groq Primary + Fallback Pipeline:** The production system utilizes `openai/gpt-oss-120b` for high-fidelity legal reasoning. On transient provider failures (HTTP 429 rate limits, 500/503 service unavailabilities, network timeouts), it automatically switches to `openai/gpt-oss-20b` with exponential backoff.
2. **Token Guard:** `token-guard.ts` performs preflight checks verifying that prompt + context + schema bounds fit comfortably within model token ceilings, truncating context safely if necessary.
3. **Result Caching:** `result-cache.ts` caches deterministic analysis outputs keyed by SHA-256 hashes of the normalized document content and prompt configuration (with configurable TTL).
4. **In-Flight Request Deduplication:** Identical simultaneous requests share a single in-flight promise, preventing redundant downstream API calls and token waste.
5. **Document Normalization:** `document-normalizer.ts` standardizes line endings, normalizes whitespace, numbers every physical line, and provides exact line-range indexing for reliable evidence citation.

---

## 6. Security & Privacy Controls

* **Zero Client-Side Secrets:** All Groq API communication occurs exclusively in server-side API routes. `NEXT_PUBLIC_GROQ_API_KEY` is explicitly prohibited and tested against exposure.
* **Untrusted Document Boundary:** Uploaded documents are treated strictly as untrusted data inputs. Internal system prompts wrap document content in isolated structural delimiters to neutralize prompt-injection attempts.
* **Input Validation & File Bounds:** Strict file-size enforcement (maximum 5 MB), extension whitelisting (`.txt`, `.md`, `.pdf`), and empty-file rejection.
* **Schema Conformance:** All raw model completions are validated against strict Zod schemas before entering application state. Malformed payloads are intercepted and safely rejected with status 422.
* **No Dynamic HTML Execution:** The codebase contains zero instances of `dangerouslySetInnerHTML`, `innerHTML`, `eval()`, or `new Function()`.
* **Privacy-Safe Operation:** Documents are processed ephemerally in-memory for the duration of the analysis session. No confidential contracts are persisted to external databases. Telemetry is privacy-safe and never logs document text or user legal questions.

---

## 7. Environment Setup & Configuration

### Prerequisites
* Node.js 18.17+ or 20+
* npm 9+ or modern package manager

### Installation
```bash
git clone https://github.com/rahulasthwik1307/LawLens.git
cd LawLens
npm install
```

### Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:
```env
# Groq API Key (Server-Side Only)
GROQ_API_KEY=your_groq_api_key_here

# Model Configuration (Optional — defaults to GPT-OSS models)
GROQ_PRIMARY_MODEL=openai/gpt-oss-120b
GROQ_FALLBACK_MODEL=openai/gpt-oss-20b
```

> **Note:** LawLens runs in offline/mock mode if no `GROQ_API_KEY` is provided, returning structured analysis for test documents and sample datasets.

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access LawLens.

---

## 8. Verification & Quality Gates

LawLens is thoroughly validated across automated testing, static type checking, code quality linting, and production compilation:

```bash
# Run unit, integration, resilience, comparison, and security test suite (175 passing tests, 0 failures)
npm test

# Run ESLint (0 errors, 0 warnings)
npm run lint

# Run strict TypeScript type check (0 errors)
npx tsc --noEmit

# Compile production build
npm run build
```

---

## 9. Evaluator & Judge Demo Walkthrough

Follow this step-by-step path to experience the complete capabilities of LawLens:

1. **Launch Platform:** Navigate to [http://localhost:3000](http://localhost:3000) and review the editorial landing page highlighting the core evidence principle, statutory grounding, and safety rules.
2. **Start Document Intake:** Click **Start Document Intake** or navigate to `/workspace`.
3. **Select Sample Agreement:** In the document upload zone, choose one of the preloaded Indian legal documents (e.g., *Commercial Office Lease Agreement (Bengaluru)*).
4. **Review Extracted Text & Run Analysis:** Inspect the extracted document lines and click **Analyze Document**.
5. **Inspect Verified Findings:** Review findings across the 9 statutory categories. Click the **View Evidence** button on any finding to observe synchronous scrolling and line-highlighting in the source viewer.
6. **Ask Evidence-Grounded Q&A:** Switch to the **Q&A** tab. Click a suggested question (e.g., *"What are the notice requirements for termination?"*) or type a custom question. Observe how the answer cites specific document lines with verified evidence chips.
7. **Run Document Comparison:** Switch to the **Compare** tab. Select the revised draft (*Commercial Office Lease Agreement (Revised Draft 2)*) and click **Compare Documents**. Review the detected modifications: altered security deposit amounts, modified notice periods, and shifted maintenance obligations.
8. **Inspect Action Map:** Switch to the **Actions** tab. Review the prioritized checklist of contractual obligations, deadlines, and verification steps extracted directly from the agreement.
9. **Explore Legal Action Planner:** Click **Plan Legal Action** on any actionable finding (or open the Planner tab). Review the 7-part breakdown: What it says, What it means, Why it matters, What to check, Possible next steps, Questions for counsel, and Supporting evidence.
10. **Generate Preparation Pack:** Switch to the **Prepare** tab. Review the comprehensive briefing summary, statistics, key clauses, and lawyer questions. Test copying the briefing to clipboard or printing.
11. **Connect to Statutory Resources:** Switch to the **Connect** tab. Browse authoritative dispute venues and legal aid portals (NALSA, State Legal Services Authorities, National Consumer Helpline, Indian Kanoon) tailored to the agreement type.

---

## 10. License & Legal Disclaimer

LawLens is released for evaluation and hackathon submission.  
© 2026 LawLens Contributors. All rights reserved.

*LawLens is an informational tool designed to support document review and advocate consultation. It does not replace professional legal advice from an advocate licensed by the Bar Council of India or relevant jurisdiction.*
