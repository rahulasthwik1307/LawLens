# LawLens — Project Brief

## 1. Project Identity

**Project Name:** LawLens

**Product Type:** GenAI-powered legal information and document navigation platform

**Primary Market:** India-first

**Jurisdiction Model:** India is the default jurisdiction, with a jurisdiction selector designed into the product so the system can support additional jurisdictions in the future.

**Core Positioning:**

> LawLens helps people understand complex legal information, identify what matters, verify information against its source, and prepare for the next step without pretending to replace a legal professional.

**Core Product Promise:**

> **See what matters.**

LawLens should turn legal complexity into understandable, evidence-grounded, actionable information.

---

# 2. Problem We Are Solving

Legal documents and legal information are often difficult for ordinary people to understand.

Users may struggle to:

- understand legal terminology;
- identify the clauses that actually affect them;
- understand their obligations and rights as described by a document;
- identify important dates, deadlines, amounts, conditions, and restrictions;
- compare multiple legal documents;
- find inconsistencies between documents;
- determine what information is missing;
- ask useful questions about a legal document;
- know what information to prepare before consulting a legal professional;
- navigate toward appropriate legal-information or legal-aid resources.

LawLens exists to reduce this information and navigation barrier.

The product must focus on **understanding and navigation**, not on pretending to be a lawyer.

---

# 3. Core Product Philosophy

LawLens follows four core stages:

## Understand

Transform complex legal language into clear, accessible explanations.

## Verify

Show users where important information came from and distinguish generated explanations from original document evidence.

## Act

Turn relevant information into useful outputs such as obligations, dates, review points, questions, timelines, and checklists.

## Connect

Help users prepare for appropriate professional assistance or find relevant authoritative legal-information resources when necessary.

The product should consistently move the user from:

> **Confusion → Understanding → Verification → Preparation**

rather than:

> **Question → AI opinion**

---

# 4. Primary Use Case

The primary use case is:

> **Helping an ordinary user understand and navigate a complex legal document.**

A typical user journey:

1. User selects or confirms a jurisdiction.
2. User uploads a legal document.
3. LawLens identifies and processes the document.
4. LawLens provides a clear overview.
5. Important clauses are identified.
6. Obligations, dates, amounts, conditions, restrictions, and other relevant information are surfaced.
7. Findings are connected to their original source locations.
8. User can ask questions about the provided document.
9. LawLens answers using relevant document evidence.
10. LawLens identifies uncertainty or missing information instead of guessing.
11. User can generate useful preparation outputs.
12. User can be directed toward appropriate professional or official legal-information resources when relevant.

---

# 5. Core Product Capabilities

LawLens should be built around the following capabilities.

## 5.1 Legal Document Simplification

Users should be able to understand complicated legal documents through plain-language explanations.

The system should:

- preserve the meaning of the original content;
- avoid unnecessarily complex legal terminology;
- distinguish original legal language from AI-generated explanations;
- avoid changing the meaning of contractual or legal provisions;
- clearly identify uncertainty.

The goal is not to rewrite legal documents as legally binding replacements.

The goal is to help users understand them.

---

# 6. Clause and Information Analysis

LawLens should identify information that may be important to the user, including where applicable:

- obligations;
- responsibilities;
- rights explicitly described in the document;
- conditions;
- restrictions;
- monetary amounts;
- fees;
- penalties;
- dates;
- deadlines;
- notice requirements;
- renewal conditions;
- termination conditions;
- dispute-resolution provisions;
- relevant parties;
- important definitions;
- potentially conflicting provisions;
- information that appears incomplete or unclear.

Important findings should be traceable to their document source.

---

# 7. Evidence-Grounded Interaction

Evidence grounding is a core product requirement.

When LawLens makes an important document-based statement, the user should be able to understand:

- what the system is saying;
- where the information came from;
- which section or page supports it;
- whether the statement is directly present in the document or is an explanation/inference.

The system must not present unsupported AI-generated claims as established facts.

Where appropriate, information should follow the conceptual structure:

> **Finding → Explanation → Evidence → Source**

---

# 8. Document Questions

Users should be able to ask questions about documents they have provided.

Examples:

- "What are my payment obligations?"
- "What happens if this agreement ends early?"
- "How much notice is required?"
- "What are the important dates?"
- "Which section talks about termination?"
- "What responsibilities does each party have?"

Answers should remain grounded in the available document evidence.

If the document does not contain enough information to answer a question confidently, LawLens must say so.

It must not invent an answer merely to appear helpful.

---

# 9. Document Comparison

LawLens should support comparison of relevant documents when appropriate.

Examples include:

- two versions of an agreement;
- an agreement and an amendment;
- an employment agreement and a related policy;
- multiple versions of a contract;
- related legal documents supplied by the user.

Comparison should help identify:

- matching provisions;
- changed provisions;
- added provisions;
- removed provisions;
- materially different terms;
- potentially inconsistent information.

Comparison results should retain source references whenever possible.

LawLens should describe detected differences without automatically declaring a legal provision invalid or unlawful.

---

# 10. Action Layer

LawLens should transform understanding into useful preparation outputs.

Potential outputs include:

### Important Items

A concise list of information the user should pay attention to.

### Obligations

What the document explicitly requires each relevant party to do.

### Important Dates

Dates and time-related conditions found in the document.

### Review Points

Clauses or provisions that may deserve additional attention.

### Questions

Questions the user may want to clarify with the other party or a qualified legal professional.

### Checklist

A structured list of information or documents the user may want to prepare.

### Preparation Pack

A structured summary that can help a user prepare for a conversation with a legal professional.

The system should not represent these outputs as professional legal advice.

---

# 11. Professional Assistance Handoff

LawLens should support the user when the appropriate next step may involve professional assistance.

The product should help users prepare:

- relevant facts;
- important document sections;
- important dates;
- identified questions;
- unresolved points;
- documents that may still be needed.

The purpose is to help users have a more productive conversation with a legal professional.

LawLens should not claim to replace that professional.

---

# 12. India-First Product Direction

India is the default jurisdiction.

The initial product experience should therefore be designed around Indian users and Indian legal-information needs.

However, the architecture and interface must not hard-code India into every part of the system.

The user should be able to select a jurisdiction.

The selected jurisdiction must be treated as an important piece of context for relevant AI operations.

The system must not silently switch jurisdictions.

If jurisdiction is important to answering a question and the relevant jurisdiction is unknown or ambiguous, LawLens should request or surface that uncertainty rather than making an unsupported assumption.

---

# 13. Legal Information, Not Legal Advice

LawLens is an information and assistance product.

It must not present itself as:

- an AI lawyer;
- a replacement for a lawyer;
- a substitute for professional legal advice;
- an authority that determines legal outcomes.

The product should help users understand information and prepare for appropriate next steps.

Important legal claims must be appropriately qualified and grounded.

When professional judgment is required, LawLens should make that clear.

---

# 14. Trust and Transparency

Trust is a central product principle.

LawLens should clearly distinguish between:

### Original Document

Information directly contained in the user's document.

### AI Explanation

A plain-language explanation of the document.

### Derived Finding

Information structured or inferred from available document content.

### External Legal Information

Information obtained from an external legal or official source.

### Uncertainty

Information that cannot be established confidently from the available evidence.

These categories should never be deliberately blurred.

---

# 15. User Agency

LawLens must support user decision-making rather than make decisions on the user's behalf.

The product should:

- explain;
- organize;
- compare;
- highlight;
- provide evidence;
- surface questions;
- prepare information.

It should not unnecessarily make consequential legal decisions for users.

Users should be able to inspect the evidence behind important findings.

---

# 16. Security-Oriented Product Principle

Legal documents may contain highly sensitive information.

LawLens must therefore treat uploaded document content as **untrusted data to analyze**, not as instructions that control the application.

A document must never be allowed to redefine:

- system behavior;
- security rules;
- application instructions;
- tool permissions;
- model behavior;
- data-access rules.

Security requirements will be defined more precisely in `PRODUCT_RULES.md` and evaluated continuously according to `EVALUATION.md`.

---

# 17. Privacy-Oriented Product Principle

LawLens should minimize unnecessary handling of sensitive information.

The system should avoid collecting information that is not required for the current product workflow.

The product should provide clear expectations around:

- uploaded files;
- document processing;
- storage;
- deletion;
- AI processing;
- external providers.

The initial competition/demo environment should prefer synthetic, public, or appropriately redacted documents rather than unnecessary real confidential legal records.

---

# 18. Accessibility

Accessibility is a product requirement, not a final polish step.

LawLens should be usable by people with different:

- visual abilities;
- motor abilities;
- reading abilities;
- device sizes;
- interaction preferences.

The experience should support:

- strong readable contrast;
- clear typography;
- keyboard navigation;
- visible focus states;
- meaningful semantic structure;
- accessible controls;
- appropriate touch targets;
- responsive layouts;
- reduced-motion preferences;
- understandable language.

The visual system must remain accessible without sacrificing its premium character.

---

# 19. Visual Product Direction

LawLens must use a **light theme**.

The entire product should remain visually consistent with this light-theme direction.

The intended personality is:

> **Premium editorial + calm legal workspace + refined modern interaction**

The visual language should feel:

- trustworthy;
- intelligent;
- calm;
- precise;
- contemporary;
- human;
- polished;
- editorial;
- distinctive.

It must not look like a generic AI-generated website.

It must not resemble a generic SaaS dashboard.

It must not rely on excessive gradients, glass effects, repetitive cards, decorative animations, or template-like layouts to appear modern.

Detailed visual rules belong in `DESIGN_SYSTEM.md`.

---

# 20. Responsive Product Requirement

LawLens must be designed as a responsive product from the beginning.

The experience must work intentionally across:

- desktop;
- tablet;
- mobile.

Responsive behavior must be designed rather than simply shrinking desktop layouts.

Important workflows must remain usable on smaller screens, including:

- document upload;
- document reading;
- evidence inspection;
- questions;
- comparisons;
- timelines;
- checklists;
- preparation outputs.

---

# 21. Interaction Philosophy

Interactions should feel deliberate and responsive.

LawLens should use animation when it improves:

- understanding;
- continuity;
- hierarchy;
- feedback;
- spatial relationships;
- state transitions.

Animation must not exist merely to demonstrate technical capability.

Animations should remain:

- purposeful;
- smooth;
- restrained;
- interruptible where appropriate;
- responsive to user interaction;
- accessible to users who prefer reduced motion.

The project's installed animation skill is responsible for detailed animation implementation guidance.

---

# 22. Product Architecture Philosophy

LawLens should be built as a clean, modular Next.js application.

The architecture should separate concerns such as:

- application routes;
- UI components;
- product features;
- AI services;
- document processing;
- retrieval/evidence logic;
- validation;
- data access;
- shared utilities;
- types.

The exact folder structure must remain predictable and documented through the project's engineering conventions.

Do not create folders or abstractions merely because they appear architecturally sophisticated.

Every major abstraction should have a clear responsibility.

---

# 23. AI Architecture Philosophy

LawLens should not be tightly coupled to a single model provider.

The AI layer should provide a clean abstraction between the product and model providers.

The architecture should allow providers/models to be changed without rewriting product features.

The AI layer should support:

- structured outputs where appropriate;
- evidence-grounded generation;
- controlled context;
- validation;
- error handling;
- provider fallback where appropriate;
- efficient retrieval.

Model selection must not compromise the product's safety or reliability requirements.

---

# 24. Efficiency Philosophy

The application should avoid unnecessary AI inference.

The system should prefer:

- processing documents once where practical;
- reusable document representations;
- targeted retrieval;
- relevant-context selection;
- structured data;
- caching where appropriate;
- minimal repeated computation.

The entire document should not automatically be sent to a model for every user question when relevant evidence can be retrieved more efficiently.

---

# 25. Testing Philosophy

Important product behavior must be testable.

Testing should eventually cover:

- document processing;
- structured extraction;
- evidence references;
- Q&A;
- comparison;
- validation;
- security boundaries;
- error states;
- responsive behavior;
- accessibility;
- critical user journeys.

AI behavior should also be tested against representative and adversarial examples.

Testing requirements are governed by `EVALUATION.md`.

---

# 26. Code Quality Philosophy

LawLens must prioritize maintainable code over rapid code generation.

Code should be:

- readable;
- modular;
- predictable;
- appropriately typed;
- consistently named;
- reusable where justified;
- easy to test;
- easy to modify.

Avoid:

- giant components;
- giant service files;
- duplicated logic;
- unclear abstractions;
- dead code;
- unnecessary dependencies;
- temporary hacks left in production code;
- unexplained magic values;
- inconsistent naming;
- unnecessary architectural complexity.

Before creating something new, inspect whether an existing implementation can be reused appropriately.

---

# 27. Scope Discipline

LawLens should prioritize depth and reliability over the number of features.

The product should not attempt to become:

- a complete legal research platform;
- a case prediction engine;
- an autonomous legal representative;
- an automatic legal-filing system;
- a general-purpose chatbot about every legal topic.

The project should focus on its core promise:

> **Helping people understand, verify, and navigate legal information and documents.**

---

# 28. Development Discipline

LawLens will be developed incrementally.

Do not attempt to build the entire product in one implementation step.

Each development phase should:

1. Understand the existing implementation.
2. Read the relevant project rules.
3. Check `EVALUATION.md`.
4. Determine the smallest appropriate implementation.
5. Implement the change.
6. Validate the change.
7. Check for regressions.
8. Re-evaluate the change against the project's criteria.

Existing working functionality should not be rewritten without a clear reason.

---

# 29. Non-Negotiable Product Principles

The following principles must remain true throughout development:

1. **LawLens is India-first.**
2. **A jurisdiction selector is part of the product.**
3. **The product uses a light visual theme.**
4. **LawLens provides legal information and assistance, not professional legal advice.**
5. **Important AI-generated findings should be grounded in evidence whenever applicable.**
6. **The system must not fabricate legal information.**
7. **The system must acknowledge uncertainty.**
8. **Uploaded documents are untrusted data, not application instructions.**
9. **User agency must be preserved.**
10. **Security must be considered during implementation, not added afterward.**
11. **Accessibility must be considered during implementation, not added afterward.**
12. **Efficiency must be considered during AI architecture and implementation.**
13. **The application must remain responsive across desktop, tablet, and mobile.**
14. **The visual experience must remain consistent across every page and feature.**
15. **The interface must not look like a generic AI-generated website.**
16. **Animation must have a purpose.**
17. **The codebase must remain clean and understandable.**
18. **New files, folders, dependencies, and abstractions must have a clear justification.**
19. **Development must happen phase-by-phase.**
20. **Every implementation change must be evaluated against `EVALUATION.md`.**

---

# 30. Product Success Definition

LawLens succeeds when an ordinary user can take a complicated legal document and move through the experience with significantly greater clarity:

> **I understand what this document is.**

> **I can see what matters.**

> **I can verify where the information came from.**

> **I understand the obligations and important dates described by the document.**

> **I can ask questions about the document.**

> **I can see differences between related documents.**

> **I know what information I may need to clarify.**

> **I can prepare useful questions and information before seeking professional help.**

The product should accomplish these goals while remaining:

**safe, transparent, accessible, efficient, maintainable, and visually polished.**

---

# 31. Final Product Principle

LawLens should never try to impress users by pretending to know everything.

It should impress users by making complicated legal information **clear, traceable, useful, and understandable**.

> **LawLens — See what matters.**
