# LawLens — Design System

## 1. Purpose

This document is the visual and interaction authority for the LawLens application.

It defines how LawLens should look, feel, and behave across every page, feature, component, and responsive breakpoint.

Every new UI implementation, redesign, component, page, animation, interaction, or visual modification must follow this document.

The goal is to create a product that feels deliberately designed by a strong product-design team rather than generated from a generic AI website template.

---

# 2. Design Identity

## Product

**LawLens**

## Visual Theme

**Light theme only.**

Do not introduce a dark theme unless explicitly requested in a future product decision.

## Visual Personality

LawLens should feel:

- intelligent;

- trustworthy;

- calm;

- editorial;

- precise;

- modern;

- human;

- refined;

- premium;

- approachable.

The interface should communicate confidence without looking aggressive or overly corporate.

---

# 3. Core Visual Direction

LawLens uses a:

> **Premium Editorial Legal Workspace**

visual language.

The design combines:

- editorial typography;

- strong information hierarchy;

- restrained Apple-inspired interaction principles;

- controlled asymmetry;

- subtle Swiss-inspired structure;

- carefully selected brutalist influences;

- generous whitespace;

- precise alignment;

- purposeful motion;

- light tactile surfaces.

The design must not become a literal copy of any existing brand or product.

The goal is to apply design principles, not imitate another company's interface.

---

# 4. What LawLens Must NOT Look Like

Avoid generic AI-generated visual patterns.

The following patterns are prohibited unless there is a specific documented reason:

- purple-to-blue AI gradients;

- excessive glowing effects;

- futuristic neon interfaces;

- generic glassmorphism;

- excessive backdrop blur;

- repeated rounded cards everywhere;

- identical card grids across every section;

- excessive floating cards;

- excessive drop shadows;

- random decorative blobs;

- arbitrary gradient text;

- generic AI sparkle icons;

- oversized meaningless hero typography;

- stock-looking illustrations with no product purpose;

- excessive icons;

- random emoji used as interface elements;

- excessive pill-shaped controls;

- unnecessarily rounded containers;

- excessive borders;

- inconsistent corner radii;

- inconsistent spacing;

- arbitrary font changes;

- animation applied to every element;

- scroll-triggered animation without purpose;

- excessive parallax;

- bouncing buttons;

- fake loading animations;

- excessive hover transformations;

- visual effects that compete with legal content.

A component must not exist merely because it makes the interface look more "AI-like."

---

# 5. Light Theme Foundation

LawLens is a light-theme application.

The visual foundation should resemble a refined editorial workspace rather than a bright marketing landing page.

Use a restrained palette built around:

### Primary Background

Warm, slightly softened off-white / paper-like light surface.

Avoid a pure #FFFFFF-only interface everywhere.

### Primary Text

Deep ink / near-black.

Text must remain highly readable.

### Secondary Text

Muted slate/gray.

Used for metadata, supporting descriptions, timestamps, labels, and secondary information.

### Structural Dark Tone

Deep navy/slate may be used selectively for:

- navigation;

- major structural elements;

- important controls;

- selected states;

- high-contrast information areas.

### Primary Accent

Use one restrained legal/product accent such as a refined cobalt or deep blue.

The accent should identify interaction and hierarchy rather than decorate the entire interface.

### Semantic Colors

Use semantic colors only when they communicate meaning:

- green → positive / confirmed / clear;

- amber → attention / review;

- red → conflict / critical issue;

- neutral → informational.

Semantic colors must never become decorative gradients.

---

# 6. Color Discipline

Do not introduce new colors casually.

Before adding a color:

1. Check whether an existing design token already represents the intended meaning.

2. Reuse an existing token when appropriate.

3. Introduce a new token only when it has a clear semantic or structural purpose.

4. Ensure sufficient contrast.

5. Check the color's behavior across desktop, tablet, and mobile.

Do not solve visual problems by adding more colors.

Visual hierarchy should primarily come from:

- typography;

- spacing;

- scale;

- alignment;

- weight;

- structure;

- contrast.

---

# 7. Typography Philosophy

Typography is one of the primary visual tools of LawLens.

The interface must not rely on decorative fonts to appear premium.

Typography should create hierarchy through:

- size;

- weight;

- line height;

- tracking;

- contrast;

- spacing;

- placement.

The system should use a small, intentional type family rather than many unrelated fonts.

Typography must remain highly readable because users will interact with potentially dense legal information.

---

# 8. Typography Hierarchy

Use a consistent hierarchy:

## Display

Used sparingly for major product moments and page introductions.

Display typography should have strong editorial character without becoming oversized for decoration.

## Page Heading

Communicates the primary purpose of the current page.

## Section Heading

Separates meaningful product sections.

## Subheading

Supports section hierarchy.

## Body

Used for explanations, descriptions, and normal content.

## Legal Text

Used when displaying original document content.

Original legal text should be visually distinguishable from AI-generated explanations.

## Metadata

Used for:

- document type;

- page;

- section;

- source;

- timestamp;

- jurisdiction;

- status.

## Evidence Text

Used for source references and supporting information.

Typography should make the distinction between:

**Original document**

and

**AI explanation**

obvious without relying only on color.

---

# 9. Typography Rules

Never randomly change fonts between pages.

Never use a different heading style simply to make a section look different.

Never use extremely thin text for important information.

Never use excessively tight line height for legal text.

Never create long paragraphs with poor readability.

Legal content should receive generous line height and comfortable reading width.

Text hierarchy must remain consistent throughout the application.

---

# 10. Layout Philosophy

LawLens should use composition rather than repetitive card grids.

Layouts should combine:

- editorial sections;

- document surfaces;

- split views;

- evidence panels;

- side panels;

- drawers;

- timelines;

- comparison regions;

- structured lists;

- contextual controls;

- open whitespace.

Not every section should be enclosed in a card.

---

# 11. Controlled Asymmetry

LawLens may use controlled asymmetry to avoid a generic template appearance.

Examples:

- asymmetric hero composition;

- offset document previews;

- variable-width information regions;

- editorial side notes;

- evidence panels anchored to content;

- intentional whitespace;

- varying section proportions.

Asymmetry must remain deliberate.

It must never reduce:

- readability;

- navigation;

- accessibility;

- responsiveness;

- information hierarchy.

---

# 12. Grid and Alignment

The interface should use a consistent underlying grid.

Elements may visually break the grid when the design intentionally calls for it, but alignment should remain coherent.

Repeated sections should share:

- common left alignment;

- predictable content width;

- consistent spacing;

- consistent vertical rhythm.

Avoid arbitrary positioning.

Do not use excessive absolute positioning for normal page layout.

Prefer responsive layout systems such as:

- CSS Grid;

- Flexbox;

- responsive containers.

---

# 13. Spacing System

Spacing should follow a consistent rhythm.

Use a small set of spacing values rather than arbitrary pixel values throughout the codebase.

Spacing should communicate hierarchy.

Use larger spacing:

- between major sections;

- before major headings;

- around important product transitions.

Use smaller spacing:

- within related content;

- between labels and values;

- within compact controls.

Avoid both extremes:

- cramped interfaces;

- unnecessarily huge empty spaces.

---

# 14. Surfaces and Containers

LawLens may use multiple surface types.

### Editorial Surface

Open content with minimal container treatment.

### Document Surface

A paper/document-inspired area for legal content.

### Information Surface

A subtle background or border grouping related information.

### Evidence Surface

A visually distinct region for source-backed information.

### Action Surface

A clear region for user actions or preparation outputs.

### Contextual Surface

Drawers, popovers, or side panels for supporting information.

These surfaces should not all use identical styling.

---

# 15. Cards

Cards are allowed but must be used intentionally.

A card should represent a meaningful conceptual boundary.

Good reasons for a card:

- independent finding;

- document summary;

- preparation item;

- important clause;

- comparison result;

- action item.

Bad reason:

> "Everything on the page needs to be inside a card."

Avoid card-grid repetition.

---

# 16. Borders

Borders should be subtle and purposeful.

Use borders to communicate:

- separation;

- grouping;

- hierarchy;

- document boundaries;

- selected states.

Do not outline every element.

Avoid heavy borders unless intentionally used for a strong editorial/brutalist accent.

---

# 17. Corner Radius

Use a restrained radius system.

Not every element should have a large rounded radius.

Use smaller or sharper geometry where the interface benefits from editorial precision.

Use stronger rounding primarily for:

- interactive controls;

- contextual surfaces;

- appropriate mobile elements.

The radius should communicate component hierarchy.

---

# 18. Shadows

Shadows should be subtle.

Prefer:

- natural depth;

- border separation;

- tonal contrast;

- surface layering.

Avoid:

- large blurry shadows;

- heavy floating-card shadows;

- excessive glow;

- artificial depth everywhere.

If an element can communicate hierarchy without a shadow, prefer the shadow-free solution.

---

# 19. Buttons

Buttons should have clear hierarchy.

### Primary Action

Used for the most important action in the current context.

### Secondary Action

Used for supporting actions.

### Tertiary Action

Used for low-emphasis actions.

### Destructive Action

Used only when the action is actually destructive.

Button labels should be explicit.

Avoid vague labels such as:

- "Magic";

- "AI it";

- "Go";

- "Do it."

Prefer:

- "Analyze document";

- "Compare documents";

- "View evidence";

- "Prepare questions";

- "Continue."

---

# 20. Forms and Inputs

Forms should feel calm and trustworthy.

Inputs must have:

- visible labels;

- clear focus states;

- useful validation;

- understandable errors;

- appropriate input types;

- accessible names.

Do not rely on placeholders as the only labels.

Error messages must explain what the user can do to correct the issue.

---

# 21. Document Interface

The document interface is one of the most important surfaces in LawLens.

It should visually distinguish:

### Original Document Content

What the user provided.

### AI Explanation

LawLens's plain-language interpretation.

### Evidence

The specific source supporting a finding.

### User Action

What the user can do next.

These should never look like the same type of information.

---

# 22. Evidence Interaction

Evidence should feel trustworthy and inspectable.

When a finding is connected to source content:

- make the relationship visually obvious;

- allow the user to inspect the relevant source;

- maintain spatial continuity where practical;

- avoid unnecessary modal interruptions;

- provide useful source metadata.

When appropriate, selecting a finding can:

1. highlight the relevant source;

2. move or scroll the document to the source;

3. visually connect the finding and source;

4. preserve the user's context.

This interaction should feel smooth and intentional.

---

# 23. Comparison Interface

Document comparison should prioritize comprehension.

Use visual hierarchy to distinguish:

- unchanged content;

- added content;

- removed content;

- changed content;

- potentially conflicting content.

Do not rely exclusively on red/green coloring.

Meaning should remain understandable through:

- labels;

- structure;

- icons where appropriate;

- typography;

- contextual explanation.

---

# 24. Timeline Interface

Timelines should feel editorial rather than like generic dashboard charts.

Use:

- clear dates;

- meaningful labels;

- concise explanations;

- source references;

- appropriate spacing.

Do not add decorative timeline animations that make important dates harder to understand.

---

# 25. Navigation

Navigation should be:

- predictable;

- minimal;

- easy to understand;

- responsive;

- consistent across pages.

Do not create unnecessary navigation items.

The navigation should reflect actual product workflows.

Potential primary areas may include:

- Home;

- Documents;

- Compare;

- Preparation;

- Settings.

Only include navigation items that are actually implemented and useful.

---

# 26. Responsive Design

Responsive behavior is a first-class design requirement.

## Desktop

Use the available horizontal space to support:

- document viewing;

- evidence panels;

- comparison;

- contextual navigation.

Avoid unnecessarily stretching reading content across the entire screen.

## Tablet

Prioritize:

- readable document width;

- flexible panels;

- simplified multi-column layouts;

- comfortable touch interaction.

## Mobile

Do not simply shrink desktop layouts.

Instead:

- stack content intentionally;

- convert side panels into drawers or sheets when appropriate;

- preserve reading width;

- keep primary actions accessible;

- use comfortable touch targets;

- avoid horizontal overflow;

- simplify complex comparison layouts where necessary.

---

# 27. Mobile Navigation

Mobile navigation must be designed intentionally.

Do not rely on desktop navigation simply wrapping onto multiple lines.

Use an appropriate mobile navigation pattern that preserves access to important product areas.

---

# 28. Touch Interaction

Touch targets must be comfortable.

Avoid placing small interactive controls too close together.

Do not depend on hover to reveal critical functionality.

Every important interaction available on desktop must have an appropriate mobile equivalent.

---

# 29. Motion Philosophy

Animation must support understanding and interaction.

Animation should be used for:

- state transitions;

- spatial continuity;

- hierarchy;

- feedback;

- document/evidence relationships;

- contextual panels;

- meaningful loading states.

Animation should not be used simply because an animation library is available.

The dedicated animation skill is responsible for implementation-level animation guidance.

---

# 30. Motion Constraints

Avoid:

- excessive bounce;

- constant floating;

- random parallax;

- decorative particle systems;

- excessive blur transitions;

- long blocking animations;

- animations that delay user actions;

- animation on every element;

- distracting scroll-triggered effects.

Motion should feel:

- smooth;

- deliberate;

- responsive;

- restrained;

- physically coherent.

---

# 31. Reduced Motion

LawLens must respect user preferences for reduced motion.

When reduced motion is enabled:

- preserve essential state feedback;

- reduce movement;

- avoid unnecessary transitions;

- avoid large spatial transformations;

- avoid decorative animation.

Do not simply remove all feedback.

Replace motion-dependent communication with appropriate visual state changes.

---

# 32. Loading States

Never use fake progress merely to make an AI operation look active.

Loading states should communicate real application states where possible:

- uploading;

- parsing;

- analyzing;

- retrieving evidence;

- generating;

- completed;

- failed.

Loading UI should reassure the user without becoming visually distracting.

---

# 33. Empty States

Empty states should explain:

1. What is currently empty.

2. Why it may be empty.

3. What the user can do next.

Avoid generic:

> "Nothing here."

Use helpful language appropriate to the current workflow.

---

# 34. Error States

Errors should be:

- understandable;

- actionable;

- calm;

- specific when safe to reveal details.

Do not expose sensitive internal errors to users.

Avoid technical jargon unless the user needs it.

---

# 35. AI States

AI processing should have clear state communication.

Potential states:

```text

Ready

Uploading

Processing

Analyzing

Finding evidence

Generating explanation

Complete

Needs clarification

Unable to determine

Error

```

The interface should never imply that the AI has certainty when the underlying system does not.

---

# 36. Icons

Icons should support comprehension.

Use a consistent icon library and style.

Do not mix unrelated icon families.

Do not use icons purely as decoration when they don't add meaning.

Icons should not replace necessary text for important actions.

---

# 37. Illustrations and Decorative Graphics

Illustrations should be used sparingly.

Any visual should support:

- comprehension;

- product identity;

- navigation;

- emotional tone;

- storytelling.

Avoid generic AI-generated legal imagery such as:

- glowing scales of justice;

- robotic lawyers;

- courthouse holograms;

- generic AI brains;

- stock gavel imagery.

LawLens should establish its own visual identity.

---

# 38. Content Density

LawLens handles information-dense material.

The interface must therefore balance:

**clarity**

with

**information density**.

Do not turn every page into a sparse marketing page.

Do not turn every page into a dense dashboard.

Density should follow the user's task.

Document analysis can be information-rich.

Landing and onboarding can be more spacious.

---

# 39. Visual Hierarchy

Every page should have a clear hierarchy:

### Primary

What the user needs to understand or do now.

### Secondary

Supporting information.

### Tertiary

Metadata and contextual details.

If everything is visually emphasized, nothing is emphasized.

---

# 40. Interaction Consistency

The same interaction should behave consistently throughout LawLens.

Examples:

- buttons should share interaction behavior;

- drawers should behave consistently;

- evidence links should behave consistently;

- document references should behave consistently;

- error states should follow a common pattern;

- loading states should follow a common language.

Do not invent a new interaction pattern for every page.

---

# 41. Component Reuse

Before creating a new component:

1. Search for an existing component.

2. Determine whether it already satisfies the requirement.

3. Extend it if extension is appropriate.

4. Create a new component only when the behavior or visual responsibility is meaningfully different.

Avoid duplicate components with slightly different names.

Examples of undesirable duplication:

```text

PrimaryButton

MainButton

ActionButton

BlueButton

SubmitButton

```

when they all perform the same role.

---

# 42. Component Boundaries

Components should have clear responsibilities.

Avoid giant components that contain:

- layout;

- data fetching;

- AI logic;

- business logic;

- validation;

- animations;

- multiple unrelated UI sections.

Separate responsibilities appropriately.

However, do not create excessive abstraction merely for the sake of abstraction.

---

# 43. Page Consistency

Every LawLens page must feel like part of the same product.

Consistency must exist across:

- typography;

- spacing;

- colors;

- controls;

- navigation;

- surfaces;

- motion;

- responsive behavior;

- error handling;

- loading behavior.

A new page must not introduce an independent visual style.

---

# 44. Design Decision Rule

When choosing between two visual solutions:

Prefer the solution that:

1. improves comprehension;

2. preserves accessibility;

3. supports the user's task;

4. maintains consistency;

5. reduces unnecessary visual noise;

6. requires fewer arbitrary design exceptions.

Visual novelty is not a sufficient reason to introduce complexity.

---

# 45. Anti-Slop Review

Before considering a page visually complete, check:

- Does it look like a generic AI dashboard?

- Are there too many cards?

- Are there unnecessary gradients?

- Are there unnecessary shadows?

- Are there too many rounded surfaces?

- Is typography doing enough of the hierarchy work?

- Is there excessive animation?

- Are there decorative elements with no purpose?

- Does the page have a clear visual composition?

- Does it look consistent with the rest of LawLens?

- Does the mobile layout feel intentionally designed?

- Does the interface remain readable with real legal content?

If any answer indicates unnecessary visual complexity, simplify it.

---

# 46. Quality Bar

A LawLens interface should feel like the result of deliberate product design.

Before shipping a UI change, evaluate:

### Hierarchy

Can the user immediately understand what matters?

### Typography

Is the information easy to read?

### Spacing

Does the page breathe without wasting space?

### Composition

Does the layout feel intentionally designed?

### Interaction

Do controls behave predictably?

### Motion

Does animation improve the experience?

### Accessibility

Can diverse users interact with it?

### Responsiveness

Does it remain polished on desktop, tablet, and mobile?

### Consistency

Does it belong to LawLens?

### Restraint

Would removing something make the interface better?

---

# 47. Design Authority

When implementing UI, use the following authority order:

1. **LawLens product requirements**

2. **This DESIGN_SYSTEM.md**

3. **Relevant project evaluation requirements**

4. **Taste Skill for visual composition and anti-slop direction**

5. **Apple Design Skill for interaction, typography, responsive behavior, and accessibility**

6. **Animate skill for specific animation implementation**

7. **Normal implementation judgment**

Skills must not override explicit LawLens product requirements.

If a skill recommendation conflicts with this design system, preserve the LawLens design system.

---

# 48. Final Visual Principle

LawLens should not look impressive because it contains many effects.

It should look impressive because every visual decision feels intentional.

The desired experience is:

> **Calm enough to trust.**

>

> **Clear enough to understand.**

>

> **Distinctive enough to remember.**

>

> **Polished enough to feel premium.**

>

> **Simple enough to use.**

## LawLens Visual North Star

> **A modern editorial lens for seeing what matters in complex legal information.**
