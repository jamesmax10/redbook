# RedBook Pro – Master Instructions

## Product

* RedBook Pro is a structured valuation workspace for Irish residential property.
* Core workflow: Case → Evidence → Analysis → Draft Report → Validation Agent → Export.
* Workflow-first, not AI-first.
* Structured data over unstructured text.
* Do not suggest random features.

---

## Core Product Direction

* This must feel like a professional valuation workspace.
* NOT an admin tool, NOT a CRUD app, NOT a form wizard.
* Preserve business logic and server actions.
* UI structure is allowed to be completely replaced if weak.

---

## UX Principles

* Data-first, NOT form-first
* No multi-step wizard flows
* No hidden context between steps
* Tables for structured data (comparables)
* Drawers/modals for editing (not full-page forms)
* Persistent workspace (no page resets)
* Always-visible context where needed

---

## Case Architecture

* Global sidebar: minimal (All Cases, New Case only)
* Case navigation: horizontal tab strip inside workspace

Tabs:

* Overview
* Evidence
* Analysis
* Draft Report

---

## Tab Intent

### Overview

* Summary + readiness + next actions
* NOT a full edit form
* Editing via inline, modal, or drawer

### Evidence (Comparables)

* Primary product surface
* Must be a data workspace
* Table is dominant
* Adjustments visible by default
* Adjusted rate visually dominant
* Add/edit via drawer (not inline form)

### Analysis

* Decision workspace (rate, rationale, assumptions)
* Must not feel like a generic form

### Draft Report

* Live document preview
* Reflects current data
* No editing here

---

## Validation Agent

* Must be clearly separate from Draft Report
* Button label must be: "Run Validation Agent"
* States:

  * Not run
  * Passed
  * Warnings
  * Failed

---

## UI Execution Standard (CRITICAL)

### Visual Benchmark

Must feel like:

* Stripe
* Linear
* Notion

If it looks like:

* basic CRUD
* internal admin tool
* form-heavy interface

→ it is incorrect

---

### Layout Rules

* Workspace > Form
* Data visible before inputs
* Tables over cards for data-heavy views
* No large persistent forms
* Editing via drawer/modal/inline only

---

### Interaction Rules

* No step-based UX
* No context switching between screens
* User must always understand:

  * property
  * evidence
  * analysis

---

### Visual Hierarchy

* Important numbers (€/m², adjusted rate) must stand out
* Supporting data must be quieter
* Use spacing + typography first, not color hacks

---

### Component Rules

* Use shadcn/ui components
* No custom raw UI if component exists
* Tables, drawers, tabs, badges are primary tools
* Avoid stacked cards for structured data

---

## Redesign Authority

* You are allowed to:

  * Replace entire layouts
  * Break existing UI structure
  * Recompose screens

* You are NOT restricted to incremental improvements

---

## Process for UI Work

Always follow this order:

1. Critique current UI
2. Explain why it feels weak/form-based
3. Define a better layout
4. Lock structure
5. Implement (file-by-file if needed)
6. Review result vs spec

---

## Failure Conditions

If the result:

* is form-heavy
* hides important data
* feels step-based
* increases friction

→ it is incorrect and must be redesigned
