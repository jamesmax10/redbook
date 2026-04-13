@AGENTS.md
# RedBook Pro — Claude Instructions

## Product Overview

RedBook Pro is a structured valuation workflow platform for Irish commercial property (RICS Red Book aligned).

The goal is to help chartered surveyors complete valuations more efficiently and with greater confidence.

This is NOT:
- a chatbot
- a generic AI tool
- a report generator

This IS:
- a structured decision system
- a professional workflow tool
- a valuation workflow platform

---

## Core Workflow

Create case → Add comparables → Analyse → Validate → Generate report → Export

Every feature must support this workflow.

---

## Current Product State

The core workflow is fully implemented:

- Case management
- Subject property input
- Comparable analysis
- Adjustment system
- Valuation calculation
- Validation system
- Report generation
- DOCX export
- Step-based workflow UI

The product is functional.

We are now focused on improving usability and reducing friction.

---

## Current Priorities

1. Comparable capture (highest priority)
   - reduce manual entry
   - enable paste → auto-fill workflow

2. Workflow UX refinement
3. Reliability and consistency
4. Real user validation

---

## Core Principle

> Does this reduce friction in the valuation workflow?

If not, do not build it.

---

## Implementation Rules

When implementing features:

- Keep changes minimal and focused
- Do not refactor unrelated parts of the codebase
- Follow existing patterns in the repo
- Avoid introducing unnecessary abstractions
- Prefer simple solutions over complex ones

---

## Code Structure Rules

- Keep business logic separate from UI where practical
- Use shared helper functions for:
  - valuation calculations
  - adjustment logic
  - status determination
- Do not duplicate logic across multiple files
- Keep data structures consistent

---

## Validation & Data Rules

- Always validate critical inputs server-side
- Prevent invalid states (e.g. division by zero)
- Ensure calculations are deterministic and explainable

---

## Agent-Readiness Rules

The system must remain fully usable without AI.

Future AI should assist, not replace the workflow.

- Prefer structured data over free text
- Keep workflow steps explicit
- Keep report sections modular
- Avoid embedding logic only in UI components

Do NOT:
- add chat interfaces
- build autonomous agents
- introduce black-box logic

---

## Code Review Mode

When reviewing code:

1. Identify what works well
2. Identify risks or weaknesses
3. Separate:
   - fix now
   - fix later
4. Suggest only high-impact improvements
5. Avoid over-engineering

---

## Bug Fix Mode

When fixing bugs:

- Identify root cause first
- Do not patch blindly
- Keep fixes minimal and safe
- Do not introduce new complexity

---

## Feature Implementation Mode

When building features:

- Focus on improving workflow efficiency
- Do not add features that are not directly useful
- Keep UX simple and clear
- Ensure consistency with existing workflow

---

## Final Rule

This product is built for real professionals.

Every change should move the product closer to:

> a fast, reliable, and defensible valuation workflow