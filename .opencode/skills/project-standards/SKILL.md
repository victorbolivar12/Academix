---
name: project-standards
description: Coding standards and conventions for the Academix Site Admin project (Next.js fullstack, TailwindCSS, MySQL, monthly profits admin system). Use when writing, editing, or reviewing any code, styles, database queries, or user-facing text in this repository.
---

# Academix Site Admin — Project Standards

Administrative system to track monthly profits (control de ganancias mensuales).

## Stack

- Next.js (App Router) — front and back live in THIS same project. Never create a separate backend server or repo.
- Frontend pages/components in `src/app/` (and `src/components/` if needed).
- Backend logic in Next.js route handlers: `src/app/api/**/route.ts`.
- Database: MySQL. Connection code goes in a shared module (e.g. `src/lib/db.ts`); never inline connection strings in components or routes.
- Styling: TailwindCSS only. No CSS modules, no inline `style={}` objects, no external UI CSS frameworks.

## Language rules

- All code (variables, functions, files, folders, comments, commits) is written in **English**.
- All user-facing text (UI labels, buttons, headings, notifications, validation/error messages shown to the user, API messages meant for display) is written in **Spanish**.
- Example: `const monthlyProfit = ...` but `<button>Guardar</button>` and `throw new Error("Error al guardar los datos")` for messages the user will read.

## Structure

- Frontend and backend coexist: pages in `src/app/<page>/page.tsx`, API endpoints in `src/app/api/<endpoint>/route.ts`.
- Shared logic (db access, helpers, types) in `src/lib/`.
- Types in TypeScript everywhere; strict typing for DB rows and API request/response payloads.

## Verification

- Run `npm run lint` and `npm run build` after meaningful changes.
