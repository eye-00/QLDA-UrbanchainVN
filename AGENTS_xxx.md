# AGENTS.md

## Project
UrbanChain-VN is an MVP for blockchain-assisted land registration, registration review, search, transfer registration, OCR-assisted document checking, and officer dashboards.

## Read first
Before making any non-trivial change, read:
- docs/01-project-overview.md
- docs/04-backlog-mvp.md
- docs/05-workflow-land-law.md
- docs/06-smart-contract-spec.md
- docs/07-api-contract.md
- docs/08-definition-of-done.md

## Repository layout
- `contracts/`: Solidity + Hardhat project
- `backend/`: Express + TypeScript + Prisma/integration layer
- `frontend/`: React + Vite + TypeScript UI
- `docs/`: product, workflow, contract, API and acceptance docs
- `codex/skills/`: reusable skills for subagents
- `prompts/`: coordination notes and agent prompts

## Core principles
1. Human PMs decide. AI agents execute.
2. Workflow and land-law notes are the source of truth for business flow.
3. Blockchain is a support layer, not the legal workflow authority.
4. Sensitive personal data must stay off-chain.
5. Every code change must map to a backlog item or explicit bugfix.
6. Every behavior-changing patch must have tests or a clear reason why tests cannot be added now.

## Non-negotiable constraints
- Never store PII on-chain.
- On-chain data is limited to record identifiers, CIDs/hashes, tx references, status references, and integrity/tracing metadata.
- Do not change legal/business workflow without explicit PM approval.
- Do not change API shape or contract ABI silently.
- Do not invent workflow states not documented in the project docs.
- Do not mark AI OCR output as legally authoritative. AI only assists.

## Required working style
- Plan first for any multi-file or ambiguous task.
- Keep patches small and explain assumptions.
- Prefer the minimum change that preserves consistency.
- When docs and code disagree, flag the mismatch and propose a fix path.
- Always identify affected modules before editing.

## Verification checklist
Before claiming a task is done:
- Run or update relevant unit tests.
- Run build/type/lint checks when the affected module supports them.
- Check that enums/state labels stay consistent across backend, frontend, docs, and contracts.
- Check that role boundaries remain correct.
- Check that audit logging or state history is preserved where required.

## Role map for agents
Use these skills/subagents when appropriate:
- system-architect
- smart-contract-dev
- smart-contract-audit
- backend-api-dev
- auth-role-dev
- db-ipfs-dev
- citizen-ui-dev
- admin-ui-dev
- ui-ux-review
- ocr-workflow
- unit-test-writer
- e2e-test-writer
- devops-deploy
- tech-writer
- compliance-review

## When to spawn subagents
Use specialized subagents when:
- A task spans different technical boundaries.
- Contract, backend, and frontend need parallel reasoning.
- You need an independent review pass.
- You need docs/tests produced from an implemented patch.

Typical split:
- Planning/design: `system-architect`
- Contract work: `smart-contract-dev` + `smart-contract-audit`
- Backend/API work: `backend-api-dev` + `auth-role-dev` or `db-ipfs-dev`
- Frontend work: `citizen-ui-dev` or `admin-ui-dev` + `ui-ux-review`
- OCR work: `ocr-workflow`
- Quality: `unit-test-writer` and/or `e2e-test-writer`
- Delivery/docs: `devops-deploy`, `tech-writer`, `compliance-review`

## State consistency rule
If you touch registration or transfer status logic, verify consistency in all of:
- backend state handling
- frontend labels/actions
- docs/05-workflow-land-law.md
- docs/07-api-contract.md
- docs/06-smart-contract-spec.md if on-chain status mapping is affected

## Documentation update rule
If you change any of the following, update docs in the same task or create a clear follow-up note:
- API endpoints or response shapes
- contract events/functions/errors
- workflow states or action permissions
- setup/run instructions
- dashboard metrics or officer actions

## Output expectations
Every substantial task response should include:
- files changed
- summary of what changed
- tests added/updated
- assumptions
- risks or follow-up items

## Demo/MVP focus
Prioritize:
1. registration first submission flow
2. review / request-for-supplement / approve flow
3. land search
4. transfer registration flow
5. OCR support warnings
6. dashboard/report essentials

De-prioritize anything outside MVP unless explicitly requested.

## Stop and ask for PM decision when
- A workflow rule is ambiguous
- A state transition is not documented
- A role boundary is unclear
- A patch would require cross-cutting schema/API/ABI changes
- A legal/compliance assumption materially affects behavior
