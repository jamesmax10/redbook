---
name: redbook-design-enforcer
description: Use when redesigning or implementing RedBook Pro UI. Prevents weak form-based admin layouts and forces design lock before coding.
---

# RedBook Design Enforcer

## Purpose
Force RedBook Pro UI work to follow product-quality layout decisions instead of incremental cosmetic changes.

## Hard rules
- Do not start coding until the target layout is explicitly defined.
- Do not preserve weak page composition for continuity.
- Do not use stacked cards/forms as the primary case workspace pattern.
- Do not place case-level navigation in the global sidebar.
- Keep business logic, server actions, and data flows intact unless explicitly told otherwise.

## Required workflow
1. Critique current UI
2. Identify why it still feels form-based/admin-like
3. Propose replacement layout
4. Lock navigation, hierarchy, and edit model
5. Define implementation scope
6. Only then code

## Red flags
If the proposed UI contains any of the following, challenge it:
- settings-style sidebar for case work
- stacked editable cards as the main page
- persistent large forms
- validation mixed with report generation state
- restyled old layouts with no structural change

## Preferred direction
- one valuation workspace
- horizontal in-workspace case navigation
- summary-first overview
- evidence/comparables as the strongest analytical screen
- analysis as a decision workspace
- report as draft output
- validation agent as separate state/action