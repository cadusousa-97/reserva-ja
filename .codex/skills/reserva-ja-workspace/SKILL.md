---
name: reserva-ja-workspace
description: Workspace rules + mentorship guidelines for the Reserva Ja scheduling SaaS (Next.js/React, NestJS, Prisma/Postgres, Jest, AWS). Use when reviewing or changing code in this repo and prioritize teaching, TypeScript best practices, clean architecture, RESTful API design, validation/DTO conventions, Prisma schema/query guidance, testing strategy, performance awareness, and security mindset.
---

# Reserva Ja Workspace

## Overview

Use this skill to keep assistance consistent across Reserva Ja: explain the "why", give maintainable TypeScript/NestJS/Next.js guidance, and proactively surface correctness, security, and performance risks while pairing on changes.

## Stack Snapshot

- Front-end: Next.js (React), TypeScript, Tailwind, Zustand, TanStack Query, Zod
- Back-end: Node.js, NestJS, TypeScript, Passport, Argon2
- Database: PostgreSQL, Prisma
- Testing: Jest
- Deploy: AWS

## Collaboration Style

- Teach-first: explain decisions and trade-offs; break complex topics into digestible steps.
- Be documentation-driven: prefer official docs and accepted best practices; quote sparingly and include pointers when helpful.
- Keep the user moving: propose the smallest safe change; avoid big refactors unless asked or necessary for correctness.
- Ask only substantial questions: if a decision is risky or has non-obvious consequences, pause and confirm assumptions.

## What To Optimize For (In Order)

- Correctness: behavior, edge cases, data integrity.
- Security: authz/authn, input validation, secrets, OWASP-style risks.
- Maintainability: clear boundaries, naming, small functions, SRP.
- Type safety: strict types, avoid `any`, leverage inference/generics.
- Performance: avoid N+1 queries, unnecessary re-renders, chatty APIs.
- Developer experience: consistent patterns, readable diffs, tests.

## Backend Guidelines (NestJS + Prisma)

- DTOs: validate inputs at the boundary; keep DTOs aligned to API contracts; avoid leaking Prisma models directly to clients.
- Controllers: thin; delegate to services; use consistent status codes and error shapes.
- Services: hold business rules; keep functions small; favor clear interfaces.
- Errors: map expected domain errors to appropriate HTTP responses; avoid throwing raw Prisma errors to clients.
- Prisma: model relations explicitly; avoid N+1; use transactions when invariants span multiple writes; be mindful of unique constraints.
- Auth: prefer explicit guards/strategies; treat authorization separately from authentication; never trust client-provided identifiers without checks.

## Frontend Guidelines (Next.js + React)

- Data fetching: TanStack Query for server-state; keep cache keys stable and typed.
- Client state: Zustand for UI/local state only; avoid duplicating server-state.
- Forms: use Zod schemas for client validation; keep error messages user-facing and consistent.
- Performance: avoid unnecessary renders and derived-state bugs; keep components focused by concern.

## Testing Guidelines (Jest)

- Prefer tests around business logic and critical flows (appointments, availability, auth).
- Favor unit tests for pure rules and integration tests for Prisma/service boundaries when valuable.
- Keep tests deterministic: control time, random values, and external side effects.

## Commit Guidelines

- Always use standard commit prefixes (`feat:`, `fix:`, `chore:`, etc.).
- Review and split commits by relevant modifications.
- Keep commit titles at 80 characters maximum.
- Before any commit, run the full lint suite of the application.
- Before any commit, run the full application test suite (currently backend only).
- Never begin the commit process before:
  - verifying code/tests for the intended scope, and
  - receiving explicit user permission to commit.

## Review Checklist (Quick)

- Is input validated at the boundary?
- Are auth and authorization correct for multi-tenant/white-label usage?
- Are database writes safe (transactions, constraints, race conditions)?
- Are types strict and expressive (no `any`, no unsafe casts)?
- Is the change small, readable, and consistent with existing patterns?
- Is there a test (or a clear reason not to add one)?
