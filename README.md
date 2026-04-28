# UrbanChain-VN Repository

Monorepo MVP cho dự án **Quản lý dự án phát triển giải pháp blockchain ứng dụng trong quản lý đô thị**.

## Stack
- Smart contracts: Solidity + Hardhat
- Backend: Node.js + Express + TypeScript + Prisma
- Frontend: React + Vite + TypeScript
- Database: MySQL
- File storage: IPFS

## Monorepo structure
```text
contracts/   Smart contracts, tests, deployment scripts
backend/     REST API, business workflow, Prisma schema
frontend/    Citizen portal + officer dashboard
docs/        Working rules, backlog, workflows, API/contract specs
codex/       Codex skills starter kit
prompts/     Prompts for 15 AI agents
```

## Quick start
1. Install dependencies with `npm ci` at repo root.
2. Copy `.env.example` to `.env` in each app, or use the provided local dev `.env` files.
3. Start MySQL and IPFS with Docker Compose:
   ```bash
   npm run infra:up
   ```
4. Generate Prisma client and sync the local database schema:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:push
   npm run db:seed
   ```
   Nếu dùng migration thay vì push schema:
   ```bash
   npm run db:migrate
   ```
5. Run apps:
   - `npm run dev:contracts`
   - `npm run dev:backend`
   - `npm run dev:frontend`

If Docker Desktop is not running, start it before `npm run infra:up`.

## Quality commands
- `npm run lint`
- `npm run format:check`
- `npm run build`
- `npm test`

### Sprint 2 verification commands
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm --workspace backend run test`
- `npm --workspace frontend run test`

### Sprint 2 closure evidence (local vs remote)
- Local evidence for users/org/lands/dashboard/toast:
  - `backend/test/sprint2.test.ts`
  - `backend/src/modules/users/user.routes.ts`
  - `backend/src/modules/organizations/organization.routes.ts`
  - `backend/src/modules/lands/land.routes.ts`
  - `backend/src/modules/dashboard/dashboard.routes.ts`
  - `frontend/test/sprint2-crud-flows.test.ts`
  - `frontend/test/toast-behavior.test.ts`
  - `frontend/test/api-error-envelope.test.ts`
- Remote-only gates (GitHub):
  - required checks on PR chain (`backend-ci`, `frontend-ci`, `contracts-ci`, `docs-check`),
  - branch protection on target branch,
  - secret scanning / push protection status.

### Sprint 1 verification commands
- `npm run db:generate`
- `npm --workspace backend run test`
- `npm --workspace frontend run test`
- `npm --workspace contracts run test`

### Sprint 1 auth endpoints
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/password/reset-request`
- `POST /api/v1/auth/password/reset-confirm`
- `POST /api/v1/auth/change-password`

### Sprint 1 closure evidence (local vs remote)
- Local evidence for US auth/test/audit:
  - `backend/test/auth-rbac.test.ts`
  - `backend/src/modules/auth/auth.routes.ts`
  - `backend/src/modules/audit/audit.routes.ts`
  - `.github/workflows/ci.yml`
- Remote-only gates (GitHub):
  - branch protection configuration,
  - required checks status on PR,
  - secret scanning / push protection status.

## Git workflow
- Main integration rules and commit convention are in [CONTRIBUTING.md](./CONTRIBUTING.md).
- PRs should follow [.github/pull_request_template.md](./.github/pull_request_template.md).

## Core rules
- Không lưu dữ liệu cá nhân nhạy cảm on-chain.
- Blockchain chỉ lưu `hash`, `cid`, `transactionHash`, `ownerRef`, `parcelRef`.
- Mọi thay đổi phải bám `docs/04-backlog-mvp.md`, `docs/05-workflow-land-law.md`, `docs/06-smart-contract-spec.md`, `docs/07-api-contract.md`.
- AI chỉ hỗ trợ nghiệp vụ; quyết định hành chính nằm ở xử lý off-chain.
