# RedBook Pro — MVP Execution Plan
## From Architecture to First Real Valuation

---

## 1. MVP Prioritisation

### What Gets Built

| # | Feature | Why |
|--|--------|-----|
| 1 | Case creation (minimal fields) | Container for everything |
| 2 | Property data entry form | Subject property anchor |
| 3 | Comparable entry + grid | Core product |
| 4 | Adjustment workflow | Core analytical value |
| 5 | Adopted rate + valuation calc | Output |
| 6 | Report generation (10 sections) | Deliverable |
| 7 | Section review/edit | Human-in-loop |
| 8 | Validation (errors only) | Prevent broken reports |
| 9 | DOCX export | What gets sent |
| 10 | Basic auth (single firm) | Minimal access |

---

### What Gets Cut (V1)

- ❌ Document parsing
- ❌ AI extraction
- ❌ Comparable database
- ❌ Multi-user workflows
- ❌ PDF export (DOCX only)
- ❌ Progress panel
- ❌ Confidence indicators
- ❌ Custom templates

👉 **Rule: The cut list is longer than the build list**

---

## 2. Core Product Definition

### 🔥 The One Feature That Matters

> Comparable evidence grid with live adjustments

User must be able to:

1. Enter 4–5 comparables  
2. See €/sqm auto-calculated  
3. Apply adjustments  
4. See adjusted rate live  
5. Set adopted rate  

---

### ⏱️ The 30-Minute Test

A surveyor should be able to:

- Create case (2 min)
- Enter property (5 min)
- Add comparables (10–15 min)
- Adjust + set rate (5 min)
- Generate + export (5 min)

👉 Output = full valuation in ~30 minutes

---

## 3. Build Order

---

### Phase 0 — Foundation (Days 1–5)

**Goal:** Basic working system

- Next.js app
- Supabase setup
- Case creation
- Property form
- Dashboard

---

### Phase 1 — Comparable Grid (Days 6–15) ⭐ MOST IMPORTANT

#### Features:

- Comparable form
- Grid view
- Auto calculations:
  - €/sqm
  - €/sqft
- Adjustment system:
  - factor
  - % change
  - rationale
- Real-time updates

#### Output:

- Range
- Average
- Adopted rate

---

### Phase 2 — Report Generation (Days 16–25)

Sections:

- Cover page (template)
- Terms (template)
- Property description (AI)
- Market commentary (AI)
- Comparables (data-driven)
- Valuation (data-driven)
- Assumptions (template)
- Compliance (locked)
- Final valuation

---

### Phase 3 — Validation & Export (Days 26–32)

Validation checks:

- Missing sections
- Missing values
- No comparables
- No valuation
- Area mismatch

Export:

- DOCX (docx-js)
- Proper formatting
- Versioning

---

### Phase 4 — User Testing (Days 33–35)

- Test with real surveyor
- Observe usage
- Fix top 3 issues only

---

## 4. Simplifications

| Original | MVP |
|--------|-----|
| AI parsing | ❌ removed |
| Complex validation | simplified |
| Multi-user | ❌ removed |
| Audit logs | simplified |
| Workflow steps | UI-based only |

---

## 5. Risks

### 🔴 High Risk

- DOCX formatting quality
- Comparable grid UX
- Scope creep

### 🟡 Medium Risk

- AI output quality
- User adoption

---

## 6. First User Test

### Setup

- Real surveyor
- Real valuation
- 3–5 comparables

---

### What to watch

- Can they use it without help?
- Is grid faster than Excel?
- Does report look professional?

---

### Success Criteria

Minimum:
- completes workflow
- output is usable

Strong:
- <30 minutes
- prefers over Excel
- minimal edits needed

---

## 7. Core Principle

> The product is NOT report generation

> The product IS the comparable analysis workflow

---

## Final Rule

- Build less
- Ship faster
- Test with real users