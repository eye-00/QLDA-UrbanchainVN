# Contributing Guide

## Branch model
- `main`: stable branch for releases/demo.
- `develop`: integration branch for ongoing work.
- Feature branches: `feature/<short-name>` from `develop`.
- Bugfix branches: `fix/<short-name>` from `develop`.

## Commit convention
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `refactor:` internal refactor, no behavior change
- `test:` test updates
- `chore:` maintenance/config changes

Example:
`feat(auth): add mock vneid login endpoint`

## Pull requests
- Fill in `.github/pull_request_template.md`.
- Link backlog ID (for example `US-014`).
- Include verification steps and results.
