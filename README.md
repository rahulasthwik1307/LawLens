# LawLens

### India-First GenAI Legal Document Assistance

> **Understand. Verify. Act. Prepare. Connect.**

> **Legal Notice:** LawLens provides informational assistance for understanding documents and preparing for professional consultation. It does not provide binding legal determinations or replace qualified legal advice from an advocate licensed by the Bar Council of India or relevant jurisdiction.

---

## 1. Product Overview

**LawLens** is an evidence-grounded legal document assistant that helps users understand documents, verify important findings against their source text, identify actionable items, compare documents, prepare questions and evidence for professional consultation, and connect with relevant Indian legal resources.

Legal agreements are often dense, structurally complex, and packed with unfamiliar statutory jargon that disadvantages tenants, founders, consumers, and small business owners. LawLens bridges this information asymmetry through an evidence-first architecture: transforming opaque legal contracts into structured, plain-language insights where **every factual finding is linked back to verifiable lines in the original source text**.

LawLens is an informational companion designed to assist users in preparing for consultation with a qualified legal professional — **it is not an AI lawyer, an attorney, a legal representative, or a substitute for professional legal counsel.**

---

## 2. Core Differentiator: Evidence Grounding

Most legal AI applications summarize documents loosely, risking ungrounded assertions or fabricated clauses. LawLens is designed around a strict principle:

```text
AI Explanation
      ↓
Original Document Evidence
      ↓
Deterministic Verification
      ↓
Actionable Assistance
```

### Evidence → Explanation → Action

* **The AI interprets:** Language models extract meaning, identify risk areas, and structure next steps.
* **The document anchors:** Factual findings require verbatim source excerpts with physical line coordinates.
* **Deterministic code validates:** An independent verification engine (`evidence-validator.ts`) checks every cited quote and line range against normalized document lines without relying on AI self-reporting.
* **The application assists:** Verified information is converted into prioritized action items, structured legal action plans, and exportable preparation packs.

```text
AI Interpretation
      ↓
Source Evidence (Verbatim Quote + Line Range)
      ↓
Deterministic Validator
      ↓
[ Verified ]  or  [ Unverified / unclear_from_document ]
```

> **Design Principle:** LawLens is designed to prevent unsupported findings from being presented as verified evidence.

---

## 3. Why LawLens

### Evidence-First
Important AI-generated findings are connected back to verifiable source evidence. Citations link directly to exact line coordinates in the uploaded document.

### Document-Grounded
The system operates strictly within the four corners of the user's provided document rather than extrapolating speculative or ungrounded legal conclusions.

### Action-Oriented
LawLens goes beyond static summarization. It extracts operational deadlines, generates prioritized checklists, and provides structured evaluation through the Legal Action Planner.

### Consultation-Ready
Users can assemble an exportable, print-ready Professional Preparation Pack containing key terms, verified evidence, and targeted questions for counsel.

### India-First
Contextual guidance, statutory classifications, and dispute forum routing are tailored to the Indian legal ecosystem, connecting users to official legal aid and statutory grievance bodies.

---

## 4. The Challenge: AI for Legal Assistance & Access

### Problem Statement
Legal documents — such as commercial leases, employment agreements, vendor contracts, and terms of service — are difficult to understand, compare, navigate, and act upon without professional assistance. Non-lawyers frequently miss critical notice windows, unilateral termination covenants, hidden liabilities, and altered monetary terms across contract drafts.

### How LawLens Addresses the Challenge

| Challenge Need | LawLens Capability | Implemented Component |
| :--- | :--- | :--- |
| **Simplify legal documents** | Understand | Categorized plain-language synthesis (`findings-panel.tsx`, `analysis-schema.ts`) |
| **Identify important clauses** | Findings | 9 statutory categories with verbatim quotes (`ai-service.ts`, `groq-schemas.ts`) |
| **Answer document questions** | Evidence-Grounded Q&A | Retrieval-augmented Q&A citing line ranges (`document-qa-panel.tsx`, `context-retriever.ts`) |
| **Compare documents** | Compare | Two-stage clause alignment across drafts (`document-comparison-panel.tsx`, `clause-aligner.ts`) |
| **Detect inconsistencies** | Inconsistency Detection | Identifies changed figures, dates, and covenants (`comparison-schema.ts`, `evidence-validator.ts`) |
| **Help users understand options** | Actions & Action Map | Prioritized compliance checklists (`action-map-panel.tsx`, `action-extractor.ts`) |
| **Generate actionable outputs** | Legal Action Planner | 7-part plain-language evaluations (`legal-action-planner-panel.tsx`, `legal-action-planner.ts`) |
| **Prepare for legal professional** | Preparation Pack | Print-ready briefing pack for counsel (`preparation-pack-panel.tsx`, `pack-composer.ts`) |
| **Connect users to resources** | Connect | Direct routing to NALSA, SLSA, NCH, Indian Kanoon (`connect-panel.tsx`, `resource-registry.ts`) |

---

## 5. Complete Feature Set

### 1. Understand (Document Analysis)
Extracts and structures findings across 9 essential legal categories:
* **Parties:** Entities, designations, registered addresses, and roles.
* **Dates:** Execution dates, commencement, expiry, renewal windows, and grace periods.
* **Monetary & Payment Terms:** Base fees, security deposits, escalation rates, billing cycles, and penalties.
* **Rights:** Operational entitlements, licenses, access permissions, and renewal options.
* **Obligations:** Maintenance covenants, statutory compliances, insurance mandates, and deliverables.
* **Restrictions:** Non-compete covenants, subletting prohibitions, exclusivity, and use restrictions.
* **Termination:** Notice timelines, lock-in periods, material breach cure periods, and liquidated damages.
* **Dispute Resolution:** Arbitration seats, governing law, exclusive court jurisdictions, and conciliation clauses.
* **Review Points:** Ambiguities, one-sided terms, and items warranting professional attention.

### 2. Verify (Deterministic Evidence Grounding)
* **Verbatim Citation Matching:** Validates AI evidence quotes against normalized source lines using exact and normalized substring boundaries.
* **Line Range Indexing:** Every citation preserves 1-indexed `startLine` and `endLine` coordinates for document inspection.
* **Honest Uncertainty:** When the document does not contain sufficient information to support a topic or question, LawLens explicitly reports `unclear_from_document` rather than guessing.

### 3. Q&A (Document Question Answering)
* **Targeted Context Retrieval:** Isolates relevant document sections while preserving global line indices.
* **Evidence-Grounded Answers:** Returns structured responses containing factual explanations, confidence calibration, and cited line quotes.
* **Missing Provision Detection:** Correctly identifies when a questioned clause is absent from the text and adjusts confidence accordingly.

### 4. Compare (Document Comparison & Version Diffing)
* **Structural Clause Alignment:** Deterministically parses numbered clauses, roman numeral sections, and headings to align corresponding provisions between Document A and Document B.
* **Difference Categorization:** Classifies discrepancies into `modified`, `value_changed`, `added`, `removed`, or `unchanged`.
* **Value & Timeline Tracking:** Flags numerical discrepancies in rent, security deposits, interest percentages, and notice days.
* **Dual Evidence:** Cites verbatim quotes independently from Document A, Document B, or both.

### 5. Actions (Clause-to-Action Mapping)
* **Operational Follow-Ups:** Transforms verified findings and comparison differences into structured action items.
* **Action Types:** Categorized into `review`, `verify`, `prepare`, `ask`, and `track`.
* **Priority Triage:** Prioritized as `attention`, `important`, or `standard` to help users focus on urgent milestones.
* **Checklist Management:** Allows users to track review status (`open`, `reviewed`, `completed`) without modifying underlying evidence.

### 6. Legal Action Planner
Provides an in-depth 7-part evaluation for critical or ambiguous clauses:
1. **What it says:** Verbatim contractual language and cited line coordinates.
2. **What it means:** Plain-language synthesis of legal and commercial implications.
3. **Why it matters:** Risk assessment and operational impact on the user.
4. **What to check:** Specific facts, operational readiness, or records to verify.
5. **Possible next steps:** Practical, non-binding courses of action.
6. **Questions to ask a lawyer:** Targeted inquiries formulated for advocate consultation.
7. **Supporting evidence:** Deterministically verified source excerpts.

### 7. Preparation Pack
* **Consultation Briefing:** Compiles verified findings, comparison differences, action items, and attorney questions into a unified document.
* **Executive Summary:** Highlights critical terms, aggregate liability caps, and dispute venues.
* **Evidence Appendix:** De-duplicates and compiles verified citations with document designations.
* **Print & Export Ready:** Formatted for clean printing or copying to clipboard before advocate meetings.

### 8. Connect (Statutory Legal Resources)
Contextually routes users to established Indian statutory institutions and public legal repositories:
* **NALSA (National Legal Services Authority):** Free legal aid and Lok Adalat access for eligible citizens under the Legal Services Authorities Act, 1987.
* **State Legal Services Authorities (SLSA):** State-level legal assistance portals across Indian states.
* **National Consumer Helpline (NCH):** Department of Consumer Affairs grievance redressal for commercial and consumer disputes.
* **Indian Kanoon:** Authoritative Indian case law and statute repository for reference research.

---

## 6. Supported Document Types

LawLens supports client-side and server-side text extraction across four standard legal document formats:

```text
.txt   — Plain Text Files
.md    — Markdown Legal Briefs & Agreements
.pdf   — Portable Document Format Contracts
.docx  — Microsoft Word Legal Drafts
```

All extracted documents undergo identical normalization, line-number indexing, and security boundaries before analysis.

---

## 7. End-to-End System Workflow

### High-Level User Journey
```text
Upload (.txt, .md, .pdf, .docx)
   ↓
Understand (Structured Findings)
   ↓
Verify (Deterministic Line Grounding)
   ↓
Act (Action Map & Milestones)
   ↓
Prepare (Legal Action Planner & Pack)
   ↓
Connect (Statutory Legal Aid & Portals)
```

### Detailed Pipeline Architecture
```text
Document Upload (.txt, .md, .pdf, .docx)
      ↓
Document Extraction & Normalization
  ├── Format extraction (pdf / docx / txt / md)
  ├── 1-indexed physical line mapping ([L{N}])
  └── Security sanitization (untrusted data wrapper)
      ↓
Token Guard & Cache Preflight
  ├── Input size & complexity estimation
  ├── SHA-256 cache key lookup
  └── In-flight request deduplication
      ↓
Groq AI Analysis Engine
  ├── Primary Model:   openai/gpt-oss-120b
  └── Fallback Model:  openai/gpt-oss-20b (on transient failure)
      ↓
Strict JSON Schema Structured Output
      ↓
Zod Schema Validation
      ↓
Deterministic Evidence Verification
  ├── Exact substring boundary matching
  ├── Normalized whitespace & token matching
  └── Citation status assignment: verified / unverified
      ↓
Interactive Workspace
      ├── Findings Panel (9 statutory categories + line highlights)
      ├── Document Viewer (synchronous scrolling to cited text)
      ├── Q&A Panel (retrieval-augmented, line-grounded answers)
      ├── Compare Panel (clause alignment, value tracking, dual evidence)
      ├── Action Map (prioritized tasks, deadlines, verification checks)
      ├── Legal Action Planner (7-part structured clause evaluations)
      ├── Preparation Pack (exportable consultation briefing)
      └── Connect Panel (statutory legal aid & grievance forums)
```

---

## 8. Evidence-Grounded by Design

LawLens enforces a strict separation between AI-generated interpretation and deterministic document evidence:

1. **Document Normalization:** Source files are parsed into immutable `NormalizedDocumentLine` streams with 1-indexed line numbers.
2. **Untrusted Data Isolation:** Prompts encapsulate document text in strict `<document_source_content>` structural boundaries to neutralize prompt injection.
3. **Structured Claim Generation:** Models return structured JSON conforming to strict schemas requiring verbatim evidence quotes and line numbers.
4. **Deterministic Validation:** The application executes exact and normalized string matching against the document text. A finding is marked `verified` only if its quote is located in the authentic text.
5. **Calibrated Confidence:** If evidence is missing, ungrounded, or ambiguous, confidence is set to `unclear_from_document` or `needs_review`.

```text
AI Interpretation
      ↓
Source Evidence (Verbatim Quote + Line Range)
      ↓
Deterministic Validator
      ↓
[ Verified ]  or  [ Unverified / unclear_from_document ]
```

---

## 9. Technical Architecture

### Technology Stack
* **Framework:** Next.js 16 (App Router)
* **Frontend:** React 19, TypeScript 5, Tailwind CSS
* **Typography:** Newsreader (editorial serif for contracts), Geist Sans (system interface), Geist Mono (line numbers & code)
* **AI Provider:** **Groq is the production AI provider.**
* **Primary Model:** `openai/gpt-oss-120b` (high-fidelity legal analysis)
* **Fallback Model:** `openai/gpt-oss-20b` (resilience fallback)
* **Schema Enforcement:** Zod runtime validation + Groq strict JSON Schema structured output
* **Document Extraction:** `unpdf` for PDF text extraction, `mammoth` for DOCX parsing

### System Resilience
* **Dual-Model Fallback:** Automatically switches from primary (`gpt-oss-120b`) to fallback (`gpt-oss-20b`) on recoverable transient errors (HTTP 429 rate limits, 500/503 service unavailability, network timeouts) with exponential backoff.
* **Token Guard:** `token-guard.ts` performs preflight checks to guarantee prompt and document context fit within token limits.
* **Result Caching:** `result-cache.ts` caches deterministic analysis outputs keyed by SHA-256 hashes of document content and task parameters.
* **In-Flight Deduplication:** Identical simultaneous requests share a single execution promise, preventing redundant downstream network calls.
* **Truncation-Aware Recovery:** Catches token limit exceptions and escalates completion budgets safely to ensure valid JSON schema generation.

### Token Optimization
* **Adaptive Completion Budgets:** Tailors output token limits based on document complexity metrics (line count, word count) rather than requesting maximum limits unconditionally.
* **Compact Action Candidate Representation:** Action Extraction uses a compact candidate representation (`<candidate id="..." type="..." priority="..." findingId="...">`) that avoids redundant boilerplate context while preserving clause identity, factual summary, source quotes, and line-range evidence.
* **Static System Prefix Caching:** Positions static system instructions before dynamic document streams to maximize Groq prompt-prefix caching.
* **Deterministic Zero-Token Synthesis:** When findings or comparison candidates are already verified, local deterministic synthesis can assemble actions and preparation packs without additional AI calls.

---

## 10. Security & Privacy

* **Server-Side API Security:** All AI provider interactions occur exclusively within server-side API routes. `NEXT_PUBLIC_GROQ_API_KEY` is explicitly prohibited and tested against client exposure.
* **Untrusted Data Boundary:** Uploaded documents are treated strictly as untrusted data inputs. Internal prompts wrap document text in structural XML delimiters to neutralize prompt-injection attempts.
* **Input Validation & File Bounds:** Strict file-size enforcement (5 MB limit), extension validation (`.txt`, `.md`, `.pdf`, `.docx`), and empty-file rejection.
* **Strict Schema Conformance:** All raw completions are validated with Zod schemas. Malformed payloads fail safely with HTTP 422.
* **Safe DOM Rendering:** Zero usage of `dangerouslySetInnerHTML`, `innerHTML`, `eval()`, or `new Function()`.
* **Privacy-Safe Operation:** Documents are processed in-memory for the duration of the analysis session. No confidential contract text is written to external databases. Telemetry is privacy-safe and never logs document text, quotes, or user legal questions.

---

## 11. Getting Started

### Prerequisites
* Node.js 18.17+ or 20+
* npm 9+

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

Configure your Groq API credentials in `.env.local`:
```env
# Groq API Key (Server-Side Only)
GROQ_API_KEY=your_groq_api_key_here

# Model Configuration (Optional — defaults to GPT-OSS models)
GROQ_PRIMARY_MODEL=openai/gpt-oss-120b
GROQ_FALLBACK_MODEL=openai/gpt-oss-20b
```

> **Note:** If no `GROQ_API_KEY` is provided, LawLens runs in mock/offline mode, serving deterministic sample analysis for test documents.

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 12. Quality Gates & Verification

LawLens enforces continuous engineering quality gates across unit testing, schema validation, type safety, linting, and production compilation:

```bash
# Run automated test suite (175 tests, 0 failures)
npm test

# Run ESLint (0 errors, 0 warnings)
npm run lint

# Run strict TypeScript compiler verification (0 errors)
npx tsc --noEmit

# Run production build (Next.js 16 + Turbopack)
npm run build
```

### Measured Quality Metrics
* **Automated Tests:** **175/175 tests passed**, with 0 failures and 0 skipped tests.
* **Evidence Verification:** In the tested validation set, 100% of authentic evidence references passed deterministic source verification against source lines.
* **Legal/Semantic Correctness:** LawLens does not represent legal or semantic correctness as a 100% guarantee; all outputs remain informational.
* **System Reliability:** 100% of tested requests completed successfully in targeted validation runs, with zero unhandled failures observed.

---

## 13. Evaluator Walkthrough

Follow this step-by-step path to experience the complete capabilities of LawLens:

### 01 — Launch
Navigate to [http://localhost:3000](http://localhost:3000) to view the editorial landing page highlighting the evidence principle, statutory categories, and safety boundaries.

### 02 — Upload
Click **Start Document Intake** or navigate to `/workspace`. Choose one of the preloaded Indian legal documents or upload your own `.txt`, `.md`, `.pdf`, or `.docx` agreement.

### 03 — Analyze
Inspect the extracted, 1-indexed document lines in the left pane and click **Analyze Document**. Review structured findings categorized across the 9 statutory areas.

### 04 — Verify
Click **View Evidence** on any finding. Observe how the document viewer synchronously scrolls to and highlights the exact physical line coordinates.

### 05 — Ask
Switch to the **Q&A** tab. Click a suggested question (e.g., *"What are the notice requirements for termination?"*) or type a custom query. Observe how the response cites verbatim source lines.

### 06 — Compare
Switch to the **Compare** tab. Select a revised agreement draft and click **Compare Documents**. Review clause alignment, detected modifications, shifted notice timelines, and changed monetary amounts.

### 07 — Review Actions
Switch to the **Actions** tab. Inspect the prioritized checklist of contractual obligations, deadlines, and payment verifications extracted from the agreement.

### 08 — Legal Action Planner
Click **Plan Legal Action** on any finding or open the Planner tab. Explore the 7-part evaluation: What it says, What it means, Why it matters, What to check, Possible next steps, Questions for counsel, and Supporting evidence.

### 09 — Preparation Pack
Switch to the **Prepare** tab. Review the consolidated briefing pack containing key terms, executive summary, action items, and attorney consultation questions. Test printing or copying to clipboard.

### 10 — Connect
Switch to the **Connect** tab. Browse authoritative Indian legal aid institutions and grievance redressal portals (NALSA, State Legal Services Authorities, National Consumer Helpline, Indian Kanoon) matched to the document context.

---

### What the Evaluator Should Notice
* **Evidence-Grounded AI:** Interpretations are visibly anchored to authentic source lines.
* **Source-Line Highlighting:** Clicking an evidence badge immediately navigates to and highlights the target lines in the document viewer.
* **Honest Uncertainty:** Clear reporting of `unclear_from_document` when a provision is absent rather than hallucinated.
* **Two-Stage Comparison:** Deterministic clause alignment followed by structural difference classification.
* **Clause-to-Action Mapping:** Practical translation of static legalese into operational checklists.
* **Legal Safety Boundary:** Clear informational framing without deceptive claims of autonomous legal advice.
* **India-First Context:** Native alignment with Indian statutory concepts, arbitration frameworks, and legal aid bodies.

---

## 14. License & Disclaimer

LawLens is released for evaluation and hackathon submission.  
© 2026 LawLens Contributors. All rights reserved.

*LawLens is an informational tool designed to support document review and advocate consultation. It does not provide legal advice or replace professional legal counsel from an advocate licensed by the Bar Council of India or relevant jurisdiction.*
