# Repository Guidelines

## Project Structure & Module Organization

- `server/`: NestJS (TypeScript) backend.
- `server/src/`: application code, organized by feature modules (e.g. `auth/`, `schedule/`, `service/`, `appointment/`).
- `server/src/**/dto/`: request/response DTOs (`*.dto.ts`) with `class-validator` rules.
- `server/prisma/schema.prisma`: Prisma schema (PostgreSQL) and enums/models.
- `server/prisma/migrations/`: database migrations (some may be SQL-only).
- `server/test/`: e2e tests + Jest e2e config.
- `docker-compose.yaml`: local production-like stack (server + Postgres).

## Build, Test, and Development Commands

Run these from `server/`:

```bash
npm install            # install dependencies
npm run start:dev      # run API with watch mode
npm run build          # compile to server/dist/
npm test               # unit tests (Jest, *.spec.ts under src/)
npm run test:e2e       # e2e tests (server/test/)
npm run lint           # ESLint (auto-fix enabled)
npm run format         # Prettier formatting
```

Docker (repo root):

```bash
docker compose up --build
```

## Coding Style & Naming Conventions

- TypeScript + NestJS patterns: `*.module.ts`, `*.controller.ts`, `*.service.ts`.
- Prettier config is minimal but enforced: single quotes + trailing commas (`server/.prettierrc`).
- Prefer DTO validation via `class-validator` and keep business checks in services.

## Testing Guidelines

- Unit tests: Jest, colocated in `server/src/**` as `*.spec.ts`.
- e2e tests: `server/test/app.e2e-spec.ts` with `server/test/jest-e2e.json`.
- New features should include at least one "happy path" and one "failure/edge" test.

## Commit & Pull Request Guidelines

- Git history uses a conventional style: `feat(scope): ...`, `fix: ...`, `refactor: ...`, `chore: ...`, `test: ...`.
- Always run test suites before committing changes.
- Keep the commit subject to a maximum of 80 characters.
- Separate commits by coherent/consistent changes (do not mix refactor + feature + infrastructure adjustments in the same commit).
- Do not start the commit process without the user having reviewed the code and authorized proceeding.
- Do not use `"&&"` when suggesting commands. Prefer commands on separate lines.

For PRs:

- Describe behavior changes and how to verify (commands + expected output).
- Call out Prisma schema/migration changes explicitly.
- If an API contract changed, mention affected routes/DTOs.

## Security & Configuration Tips

- Runtime config is via environment variables (notably `DATABASE_URL`).
- Avoid trusting `companyId` from request bodies; scope by JWT context or derive from relations.
- Do not commit secrets; local DB password is mounted via `server/db/password.txt` in Docker.
