# RedBook Pro — Security Roadmap

## Security goal

Build RedBook Pro so it is safe to handle professional valuation workflows, case data, comparable evidence, user accounts, and future uploaded documents.

## Security principles

* Least privilege by default
* Server-only handling for privileged operations
* Explicit authorization rules for all user data
* Sensitive data never committed to git
* Clear audit trail for important actions
* Production security hardened before real-user rollout

## Current state

* Early prototype
* Local development
* Supabase in use
* RLS not yet fully implemented
* No production auth model yet

## Security Phase A — immediate

* Keep `.env.local` out of git
* Never expose Supabase service-role keys to the client
* Review Cursor / plugin permissions and reduce unnecessary access
* Confirm destructive actions require confirmation
* Validate all numeric and text inputs on server actions

## Security Phase B — before auth / multi-user

* Enable RLS on all user-facing tables
* Add explicit RLS policies per table
* Add authentication and per-user / per-firm access model
* Review all server actions for authorization checks
* Ensure users can only access their own cases, properties, comparables, and valuations

## Security Phase C — before production / sensitive user data

* Add Content Security Policy and secure response headers
* Add rate limiting on write actions
* Add audit logging for important changes
* Secure file upload and storage access rules
* Add logging / monitoring for failures and suspicious activity
* Review backups, recovery, and incident handling

## Security standards to align with

* OWASP ASVS 5.0
* OWASP Top 10:2025
* Supabase production checklist
* Next.js security guidance

## Product-specific risks

* Broken access control between firms/users
* Misconfigured Supabase tables or storage buckets
* Secrets leakage
* Unsafe server actions
* Unvalidated file uploads
* Missing audit trail for valuation changes

## Rule

No production launch until:

* auth exists
* RLS exists
* storage rules exist
* validation and audit logging exist
* security review is complete
