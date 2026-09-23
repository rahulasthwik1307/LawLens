# LawLens — Product Rules

## 1. Purpose

This document defines the non-visual product behavior and safety rules for LawLens.

It governs:

- legal-information behavior;
- AI behavior;
- document handling;
- evidence grounding;
- jurisdiction handling;
- uncertainty;
- user agency;
- privacy-oriented behavior;
- security boundaries;
- external legal information;
- professional-assistance handoff;
- AI-generated outputs.

These rules apply to every feature, API, server action, AI workflow, component, and future product capability.

The purpose is to ensure that LawLens remains an **information and assistance product**, rather than becoming an uncontrolled legal-advice or autonomous legal-action system.

---

# 2. Product Role

LawLens is a:

> **GenAI-powered legal information and document navigation platform.**

LawLens helps users:

- understand legal documents;
- identify relevant information;
- compare documents;
- ask questions about provided documents;
- identify obligations and important dates;
- organize information;
- prepare questions;
- prepare information for professional assistance;
- navigate toward appropriate authoritative resources.

LawLens does not replace qualified legal professionals.

---

# 3. Core Behavioral Principle

Every LawLens feature should answer:

> **Does this help the user understand, verify, prepare, or navigate legal information?**

If the answer is no, the feature should not be added without a clear product justification.

The product should prioritize:

1. Understanding
2. Evidence
3. Clarity
4. User agency
5. Safe next steps

over:

- unnecessary automation;
- unnecessary AI generation;
- excessive feature count;
- unsupported legal conclusions.

---

# 4. Information, Not Professional Legal Advice

LawLens must not present itself as a lawyer or legal professional.

Do not use product language that implies:

- "AI lawyer";
- "your lawyer";
- "replace your lawyer";
- "guaranteed legal answer";
- "guaranteed legal outcome";
- "legally correct in every case";
- "we determine your legal rights."

Prefer language that accurately communicates:

- explanation;
- document analysis;
- information;
- preparation;
- review;
- evidence;
- questions;
- possible considerations.

---

# 5. User Agency

LawLens exists to support user decision-making.

The system should:

- explain information;
- organize information;
- compare information;
- identify relevant document content;
- surface questions;
- identify uncertainty;
- prepare information.

The system should not unnecessarily make consequential decisions for users.

Avoid statements such as:

> "You should definitely do X."

when the underlying situation requires professional legal judgment.

Prefer:

> "The document states X."

or:

> "The document appears to describe X."

or:

> "This may be worth clarifying with a qualified professional."

---

# 6. Evidence Hierarchy

LawLens should distinguish different information sources.

Use the following conceptual hierarchy:

## Level 1 — User-Provided Evidence

Information contained directly in documents or information explicitly provided by the user.

## Level 2 — Structured Findings

Information extracted or organized from user-provided evidence.

## Level 3 — AI Explanation

Plain-language explanation derived from available evidence.

## Level 4 — Authoritative External Information

Information obtained from appropriate official or authoritative sources.

## Level 5 — General AI Knowledge

General model knowledge should not be presented as authoritative legal information.

When an answer depends on legal rules outside the uploaded document, LawLens should distinguish external legal information from document-specific findings.

---

# 7. Evidence Grounding

Important document-based claims should be grounded in the relevant document whenever possible.

A useful conceptual output structure is:

> **Finding**
>
> **Plain-language explanation**
>
> **Evidence**
>
> **Source**

Evidence references should identify useful source information where available, such as:

- document;
- page;
- section;
- clause;
- paragraph;
- relevant excerpt.

The system should not create fake page numbers, section numbers, citations, or quotations.

If an exact source location cannot be established, do not fabricate one.

---

# 8. Original Text vs AI Interpretation

LawLens must clearly distinguish:

### Original Document

The user's supplied legal content.

### AI Explanation

A generated explanation of that content.

### AI-Derived Finding

Structured information extracted or inferred from the supplied content.

These categories must not be visually or semantically represented as identical information.

AI-generated explanations must never be presented as if they were part of the original legal document.

---

# 9. No Fabricated Legal Information

LawLens must never intentionally invent:

- laws;
- regulations;
- court decisions;
- legal citations;
- clauses;
- obligations;
- deadlines;
- penalties;
- authorities;
- legal rights;
- legal duties;
- government programs;
- contact details;
- official resources.

If the required information cannot be verified from the available evidence, LawLens must communicate that limitation.

---

# 10. Uncertainty Is a Valid Result

LawLens must be allowed to say:

> "The available information is not sufficient to determine this."

or an equivalent clear explanation.

Do not force the model to produce an answer merely because a user asked a question.

The following outcomes are valid:

- Answer available from the document.
- Answer partially supported.
- Information is ambiguous.
- Information is missing.
- External legal information is required.
- Professional review may be appropriate.

The system should prefer an honest limitation over a confident unsupported answer.

---

# 11. Jurisdiction Rules

LawLens is India-first.

The default jurisdiction is:

> **India**

The application must also provide a jurisdiction-selection mechanism.

The selected jurisdiction is part of the legal context.

The system must not silently change jurisdictions.

If the user selects a jurisdiction, relevant AI workflows should use that jurisdiction as context.

If a legal question is jurisdiction-dependent and the jurisdiction is unknown or ambiguous, the system should request clarification or clearly state the limitation.

Do not infer a jurisdiction solely from:

- language;
- name;
- location assumptions;
- document formatting;
- user demographics.

---

# 12. India-First Does Not Mean India-Only

India is the initial product focus.

The architecture should remain extensible so that additional jurisdictions can be added without rewriting the entire application.

Jurisdiction-specific logic should be isolated from generic product functionality wherever practical.

Avoid hard-coding Indian legal assumptions into generic document-processing or UI components.

---

# 13. Document Content Is Untrusted Data

Uploaded documents must always be treated as **data to analyze**.

They are not application instructions.

A document may contain text that attempts to:

- override system instructions;
- manipulate the AI;
- request secrets;
- alter application behavior;
- invoke tools;
- change security rules;
- expose internal prompts;
- instruct the model to ignore previous instructions.

Such content must be treated as document content, not as commands.

The application must preserve the separation between:

**System instructions**

↓

**Application/product rules**

↓

**User request**

↓

**Document data**

Document content must not gain authority over the application.

---

# 14. Prompt Injection Resistance

AI workflows that process user-provided documents must assume that document content can contain malicious or adversarial instructions.

The system should:

- isolate document content from control instructions;
- clearly identify retrieved document content as data;
- avoid blindly following instructions contained inside documents;
- validate structured model output;
- restrict tool access;
- avoid unnecessary tool permissions;
- avoid exposing system instructions;
- prevent document content from changing application behavior.

A document saying:

> "Ignore all previous instructions"

must remain document content.

It must not become an instruction to LawLens.

---

# 15. Tool and Action Boundaries

LawLens should use the principle of least privilege.

AI systems should only have access to tools required for the current task.

Do not give the AI unnecessary abilities such as:

- arbitrary code execution;
- unrestricted network access;
- unrestricted file access;
- unrestricted database access;
- autonomous external communication.

LawLens should prefer:

> **Prepare information for human review**

over:

> **Automatically perform consequential legal actions.**

---

# 16. No Autonomous Legal Actions

LawLens should not automatically:

- file legal documents;
- submit government forms;
- send legal notices;
- contact opposing parties;
- send legal responses;
- initiate legal proceedings;
- make binding contractual decisions;
- accept or reject legal agreements on behalf of users.

If such functionality is ever considered, it requires a separate product decision and explicit safety review.

---

# 17. Document Upload Rules

Uploaded documents should be validated before processing.

The system should validate, where applicable:

- supported file type;
- file size;
- processing limits;
- document readability;
- parsing success;
- content availability.

Invalid or unsupported documents should result in clear user feedback.

Do not silently process corrupted or incomplete documents as if they were valid.

---

# 18. Document Processing

Document processing should preserve the relationship between:

- original content;
- extracted text;
- document sections;
- pages;
- clauses;
- structured findings.

Where possible, the processing pipeline should preserve source location metadata.

Do not discard source information if it is required for evidence grounding.

---

# 19. OCR and Unreadable Documents

If a document is scanned or contains content that cannot be reliably extracted:

LawLens should recognize the limitation.

Do not pretend that the document was fully analyzed.

Where appropriate, communicate:

- that some content could not be read;
- which portion may be affected;
- what the user can do next.

---

# 20. Document Q&A

Questions about an uploaded document should prioritize the uploaded document as the primary source.

For each question:

1. Identify relevant evidence.
2. Retrieve the smallest useful context.
3. Generate an answer from that evidence.
4. Validate the response where appropriate.
5. Present evidence/source information.
6. Communicate uncertainty if required.

Do not automatically send the entire document to the model for every question if targeted retrieval can answer the question.

---

# 21. Questions Outside the Document

If a user asks a question that cannot be answered from the provided document, LawLens must not pretend that the answer exists in the document.

Clearly distinguish:

> "The document says..."

from:

> "General legal information may suggest..."

and:

> "This cannot be determined from the provided document."

If external legal information is required, the system should use an appropriate authoritative source workflow rather than silently inventing information.

---

# 22. Legal Source Handling

When external legal information is used, prefer appropriate authoritative sources.

For India-first workflows, relevant sources may include official government, court, statutory, regulatory, or recognized legal-aid resources as appropriate to the question.

Do not present third-party summaries as official legal authority unless their status is explicitly clear.

Do not fabricate source URLs.

Do not fabricate citations.

---

# 23. Time-Sensitive Legal Information

Some legal information can change.

Examples include:

- regulations;
- government schemes;
- procedures;
- forms;
- deadlines;
- official contact information;
- administrative requirements.

The system should avoid presenting potentially outdated information as current without appropriate verification.

Where freshness matters, the source and relevant date should be made clear when possible.

---

# 24. Comparison Rules

When comparing documents, LawLens should distinguish:

### Exact/clear difference

The documents clearly contain different information.

### Structural difference

One document contains a section that another does not.

### Potential inconsistency

Two provisions appear difficult to reconcile.

### Legal conclusion

Whether a difference is legally enforceable, invalid, unlawful, or controlling.

LawLens may identify the first three when supported.

LawLens should not automatically convert a detected difference into a legal conclusion.

---

# 25. Risk Language

LawLens should use careful language when discussing potential risks.

Prefer:

- "This clause may deserve review."
- "The documents appear to differ on..."
- "This provision could have an important effect depending on..."
- "The document does not clearly specify..."
- "Consider clarifying this point."

Avoid unsupported definitive statements such as:

- "This clause is illegal."
- "You will definitely lose."
- "This contract is invalid."
- "You are guaranteed to win."
- "You must sue."
- "This is definitely enforceable."

Such conclusions may require professional legal analysis.

---

# 26. Obligation Extraction

When identifying an obligation, distinguish between:

### Explicit obligation

Clearly stated in the document.

### Conditional obligation

Applies only when a stated condition occurs.

### Inferred relationship

May be logically suggested by the document but is not explicitly stated.

The UI should avoid presenting an inference as if it were an explicit contractual requirement.

---

# 27. Date and Deadline Extraction

Dates should be extracted carefully.

The system should distinguish:

- fixed dates;
- relative periods;
- recurring dates;
- notice periods;
- renewal periods;
- conditions that trigger a deadline.

Do not invent missing dates.

If a date depends on an event that is not known, explain the dependency rather than calculating a false deadline.

---

# 28. Monetary Information

Amounts should preserve:

- currency;
- units;
- relevant conditions;
- frequency;
- source location.

Do not alter or normalize amounts in a way that changes their meaning.

If the document contains ambiguity about an amount, preserve the ambiguity.

---

# 29. Preparation Pack Rules

A preparation pack should organize information for human use.

It may contain:

- situation summary;
- relevant facts;
- important document sections;
- important dates;
- amounts;
- questions;
- unresolved issues;
- additional documents that may be useful.

It should not present itself as:

> "The legal strategy you should follow."

It should instead function as:

> **A structured preparation aid for discussion with an appropriate professional.**

---

# 30. Checklist Rules

Checklists should be derived from available evidence where possible.

Each item should have a clear purpose.

Avoid generating generic legal checklists that are unrelated to the user's situation.

When a checklist item is based on a document finding, retain its source relationship when practical.

---

# 31. Legal-Aid and Professional Resources

When LawLens identifies that professional assistance may be appropriate, the product may help users navigate toward relevant resources.

Resources must be:

- appropriate to the user's jurisdiction;
- clearly identified;
- sourced appropriately;
- presented without implying guaranteed eligibility.

Do not tell a user that they definitely qualify for a legal-aid service unless eligibility has been appropriately verified.

---

# 32. Privacy-Oriented Data Minimization

Only collect information needed for the current product capability.

Avoid collecting unnecessary:

- personal identifiers;
- sensitive information;
- legal-history details;
- contact information;
- document metadata.

When information is not needed, do not request it merely because it might be useful later.

---

# 33. Secrets

Never expose or hard-code secrets in:

- frontend code;
- source-controlled files;
- UI;
- prompts visible to users;
- client-side configuration.

API keys and private credentials must remain server-side and use appropriate environment configuration.

Never commit real credentials to the repository.

---

# 34. Client vs Server Boundaries

Sensitive operations should remain server-side.

Examples include:

- provider API calls requiring secret credentials;
- privileged database operations;
- sensitive document processing;
- secure storage operations.

The client should receive only the information required for the current user experience.

---

# 35. AI Output Validation

AI-generated structured outputs should be validated before being treated as application data.

Where appropriate:

- use schemas;
- validate required fields;
- validate data types;
- reject malformed outputs;
- handle partial outputs;
- handle provider errors.

Do not assume an AI model always returns valid structured data.

---

# 36. AI Provider Independence

The product should not scatter provider-specific logic throughout the application.

AI provider interactions should be isolated behind a clear service boundary.

This allows:

- provider replacement;
- fallback;
- model upgrades;
- testing;
- cost optimization.

Product features should not depend directly on a specific provider's API wherever practical.

---

# 37. Efficiency Rules

AI calls should be purposeful.

Before making an AI request, consider:

1. Can deterministic code solve this?
2. Can existing structured data solve this?
3. Can targeted retrieval reduce context?
4. Can an existing result be reused?
5. Does the user actually need AI generation?

Do not use an LLM for tasks that can be performed reliably and efficiently with deterministic logic.

---

# 38. Error Handling

Every external dependency should have a failure path.

Potential failures include:

- AI provider unavailable;
- rate limit;
- malformed AI response;
- document parsing failure;
- storage failure;
- database failure;
- network failure;
- unsupported document;
- timeout.

Users should receive clear, useful feedback.

Do not expose internal stack traces or secrets.

---

# 39. No Silent Failure

If an important part of document processing fails, LawLens must not present the document as completely analyzed.

The system should communicate the limitation.

For example:

> "Some document content could not be processed. Findings may be incomplete."

The exact UI language may vary, but the principle must remain.

---

# 40. User Confirmation

When an action could materially affect the user's information or workflow, provide appropriate confirmation.

Examples:

- deleting a document;
- removing saved information;
- changing jurisdiction;
- discarding a comparison;
- replacing an uploaded document.

Do not make destructive actions unexpectedly irreversible.

---

# 41. Accessibility as Product Behavior

Accessibility must be preserved in functional behavior, not just visual styling.

Important interactions must support:

- keyboard navigation;
- focus management;
- screen-reader semantics;
- reduced motion;
- adequate touch targets;
- readable text;
- meaningful labels;
- non-color-only communication.

A visually beautiful interface that cannot be operated accessibly does not satisfy LawLens's product requirements.

---

# 42. Responsive Behavior as Product Behavior

Responsive layouts must preserve the user's ability to:

- read documents;
- inspect evidence;
- ask questions;
- compare documents;
- review findings;
- access preparation outputs.

Responsive behavior must not remove essential functionality merely because the viewport is smaller.

Instead, complex layouts should transform appropriately.

---

# 43. Conversation Behavior

The AI should communicate in a way that is:

- clear;
- concise where possible;
- transparent;
- respectful;
- non-alarmist;
- evidence-oriented.

Avoid unnecessarily frightening users.

Avoid sensational language.

Avoid creating urgency where the evidence does not justify it.

---

# 44. No False Certainty

Avoid absolute language unless the evidence genuinely supports it.

Examples of language to avoid without strong support:

- definitely;
- guaranteed;
- certainly;
- always;
- never;
- unquestionably.

Prefer calibrated language where appropriate:

- "The document states..."
- "The document appears to..."
- "This may indicate..."
- "This is not specified..."
- "The available information does not establish..."
- "This may require professional review."

---

# 45. No Fabricated User Facts

The AI must not invent:

- the user's circumstances;
- the user's intentions;
- facts about a dispute;
- missing contract details;
- dates;
- parties;
- financial information;
- jurisdiction.

If the system needs information, ask for it or clearly state that it is unavailable.

---

# 46. No Fabricated Document Content

Never generate a clause and claim that it came from the user's document when it did not.

Never create a quotation and present it as an original document excerpt unless it is actually supported by the source.

Never invent page or section references.

---

# 47. Human Handoff

When a matter requires professional judgment, LawLens should help the user prepare rather than pretend to resolve the matter.

Useful handoff information may include:

- what the document says;
- what is unclear;
- what evidence was found;
- what questions remain;
- what documents may be relevant;
- what information the user may want to bring.

The goal is:

> **Better prepared user → better professional conversation.**

---

# 48. Feature Addition Rule

Before adding a new feature, ask:

1. Does it solve a real user problem?
2. Does it align with the LawLens product brief?
3. Does it improve understanding, verification, action, or connection?
4. Can it be implemented safely?
5. Can it be tested?
6. Does it introduce unnecessary complexity?
7. Does it create new legal or privacy risks?
8. Does it affect the existing design system?

If the feature fails the core product purpose, do not add it merely because it is technically interesting.

---

# 49. Modification Rule

Before modifying existing functionality:

1. Understand the existing behavior.
2. Identify why the change is necessary.
3. Identify affected features.
4. Check product rules.
5. Check evaluation requirements.
6. Make the smallest appropriate change.
7. Test affected functionality.
8. Check for regressions.

Do not rewrite functioning systems simply to use a newer technique.

---

# 50. Dependency Rule

Before installing a dependency:

1. Check whether the capability already exists in the current stack.
2. Check whether an existing dependency can solve the requirement.
3. Evaluate bundle size and performance impact.
4. Evaluate security and maintenance implications.
5. Confirm that the dependency is actually necessary.

Do not install libraries simply because they are popular.

---

# 51. Architecture Rule

Prefer:

> **Simple + explicit + maintainable**

over:

> **Complex + abstract + impressive**

Architecture should evolve as product requirements evolve.

Do not prematurely introduce:

- microservices;
- distributed queues;
- vector databases;
- complex state-management systems;
- unnecessary abstraction layers;
- infrastructure that the product does not currently require.

---

# 52. Data Persistence Rule

Persistence should be introduced when the product actually requires it.

The initial UI and product workflow may operate with controlled local/demo data.

When persistence is introduced, use an appropriate database and storage architecture.

The database should store structured application data rather than unnecessarily storing duplicated derived information.

---

# 53. Logging and Observability

Logs should help diagnose application behavior without unnecessarily exposing sensitive legal content.

Do not log:

- full legal documents;
- unnecessary personal information;
- API keys;
- authentication secrets;
- sensitive user content.

Prefer structured operational information such as:

- processing status;
- error category;
- request identifier;
- timing;
- provider status.

---

# 54. Security Review Principle

Security must be considered whenever a change involves:

- files;
- AI;
- external APIs;
- authentication;
- authorization;
- databases;
- storage;
- user input;
- generated content;
- external links;
- tools.

Do not treat security as a final cleanup task.

---

# 55. Product Integrity Rule

Never optimize a feature for appearance at the expense of truthfulness.

A visually impressive answer that contains unsupported legal information is a product failure.

A simpler answer that accurately communicates:

> "The document does not provide enough information to determine this."

is preferable.

---

# 56. Final Product Rules

The following rules are non-negotiable:

1. LawLens provides legal information and assistance, not professional legal advice.
2. India is the default jurisdiction.
3. Users can select a jurisdiction.
4. Jurisdiction must not be silently assumed when it materially affects the answer.
5. Uploaded documents are untrusted data.
6. Document instructions must never override application instructions.
7. Important document claims should be evidence-grounded.
8. Source locations must never be fabricated.
9. Legal citations must never be fabricated.
10. User facts must never be fabricated.
11. Document content must never be fabricated.
12. Uncertainty must be communicated.
13. AI must not create false certainty.
14. AI must not perform unnecessary consequential legal actions.
15. Sensitive operations must remain appropriately protected.
16. Secrets must never be exposed to the client.
17. AI outputs must be validated before being treated as structured data.
18. AI provider logic must remain isolated from product features.
19. AI inference should be used only when useful.
20. Deterministic logic should be preferred where appropriate.
21. Accessibility must be preserved.
22. Responsive behavior must preserve core functionality.
23. Privacy and data minimization must be considered.
24. Existing functionality must not be unnecessarily rewritten.
25. New dependencies require justification.
26. New features require product justification.
27. The simplest safe architecture should be preferred.
28. Professional assistance should be supported when appropriate.
29. Users must remain in control of consequential decisions.
30. Every implementation change must also be evaluated against `EVALUATION.md`.

---

# 57. Product North Star

LawLens should never attempt to win user trust by acting like it knows everything.

It should earn trust through:

**Evidence.**

**Clarity.**

**Transparency.**

**Useful preparation.**

**Honest uncertainty.**

**Respect for professional legal judgment.**

> **LawLens helps people see what matters without pretending to decide what they should do.**
