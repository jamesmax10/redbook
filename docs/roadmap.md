# RedBook Pro — Product Roadmap

## 1. Vision (North Star)

RedBook Pro is a professional valuation workflow platform that allows chartered surveyors to:

- Manage valuation cases
- Analyse comparable evidence in a structured way
- Apply adjustments and derive an adopted rate
- Generate Red Book-compliant valuation reports
- Store and reuse valuation knowledge over time

This is NOT an AI writing tool.

This is a structured, professional system for valuation workflows.

---

## 2. Core Product Concept

The product has three layers:

### Layer 1 — Data & Structure
- Cases
- Subject property
- Comparable evidence

### Layer 2 — Valuation Engine
- Comparable grid
- Adjustments
- Adjusted rates
- Adopted rate
- Valuation calculation

### Layer 3 — Output & Workflow
- Report generation
- Section editing
- Validation
- Export

---

## 3. Current Phase

### Phase 0 — Foundation

Goal:
Create a working system to manage valuation cases and subject property data.

Completed:
- Case creation
- Case list (dashboard)
- Case detail page
- Navigation between screens

In progress:
- Edit case
- Subject property form (create + edit)

Definition of done:
- Create case
- Edit case
- Add/edit subject property
- Data persists correctly in Supabase

---

## 4. Next Phase

### Phase 1 — Comparable Engine (CORE PRODUCT)

Goal:
Build the comparable analysis workflow (this is the product).

Features:
- Add comparable
- Comparable grid (table)
- Auto calculation:
  - €/sqm
  - €/sqft
- Adjustment system:
  - factor
  - percentage
  - rationale
- Real-time recalculation
- Adjusted rate per comparable
- Include/exclude comparables
- Summary:
  - range
  - average
  - adopted rate

Success criteria:
- Surveyor can analyse 4–5 comparables easily
- Adjustments feel intuitive
- Output is clearer than Excel

---

## 5. Future Phases

### Phase 2 — Report Generation

- Report page
- Section structure:
  - Cover page
  - Terms of engagement
  - Property description
  - Market commentary
  - Comparable evidence
  - Valuation
  - Assumptions
  - Compliance
- Combine:
  - structured data
  - templates
  - generated text

---

### Phase 3 — Validation & Export

- Validation checks:
  - missing data
  - missing sections
  - inconsistent values
- DOCX export
- Formatting and structure
- Versioning

---

### Phase 4 — Intelligence Layer

- Comparable reuse across cases
- Historical case database
- Stored assumptions
- Pattern recognition
- Optional AI assistance

---

## 6. What We Are NOT Building Yet

- Document parsing (PDF, leases)
- Complex AI extraction
- Multi-user collaboration
- Advanced permissions
- Custom templates
- Fancy UI features
- Over-engineered validation systems

Rule:
If it does not directly improve the valuation workflow, it is postponed.

---

## 7. Daily Build Rule

Every feature must answer:

> Does this move us closer to the Red Book valuation workflow system?

If yes → build  
If no → defer  

---

## 8. Build Philosophy

- Keep it simple
- Build one feature at a time
- Test with real usage (your dad)
- Prioritise usability over cleverness
- Do not overbuild early

---

## 9. Current Focus (Right Now)

You are here:

→ Phase 0 finishing

Next steps:
1. Add edit case
2. Complete subject property form
3. Confirm full data flow works

Then:
→ Move immediately to Comparable Engine

---

## 10. Product Definition

RedBook Pro is:

> A structured valuation workflow platform that replaces Excel + Word with a single professional system.

Not:
- a chatbot
- a generic AI tool
- a document generator

---

## Final Reminder

The product is NOT the report.

The product IS the comparable analysis workflow that produces the report.