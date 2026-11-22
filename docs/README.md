# Smart Nutrition Tracker: Documentation

This folder documents the Smart Nutrition Tracker codebase **as it currently exists** (commit `aa8f5a8`). Everything was checked against the source code during a read-only audit. Where something could not be confirmed from the repository (for example, where the frontend is hosted), the documents say so.

## Status labels used everywhere

| Label | Meaning |
|---|---|
| ✅ **Implemented** | Frontend and backend code exist and connect correctly, based on reading the code |
| ⚠️ **Partially implemented** | Works in part, or has a bug that breaks a common case |
| 🎨 **UI only** | Screen exists but there is no backend behind it |
| ❌ **Non-functional** | Code exists but cannot work as written |
| ⛔ **Not implemented** | Only referenced (a button, a dependency, a comment) |
| ❔ **Unable to verify** | Depends on external configuration not in the repository |

"Implemented" is based on static code reading. The application was **not run** while writing this documentation.

## Suggested reading order

1. [Project overview](01-project-overview.md): what the project is and who it is for
2. [Features and implementation status](02-features-and-status.md): what actually works
3. [System architecture](03-system-architecture.md): the big picture
4. [Frontend architecture](04-frontend-architecture.md) and [Backend architecture](05-backend-architecture.md)
5. [Database design](06-database-design.md) and [API reference](07-api-reference.md)
6. [Authentication and OTP flow](08-authentication-and-otp-flow.md)
7. [Setup and installation](09-setup-and-installation.md), [Environment configuration](10-environment-configuration.md), [Deployment guide](11-deployment-guide.md)
8. [Known limitations](12-known-limitations.md), [Testing](15-testing.md), [External integrations](16-external-integrations.md)
9. [Core CS subject mapping](13-core-cs-subject-mapping.md) → [core-subjects/](core-subjects/README.md)
10. [Interview preparation](14-interview-preparation.md)

## Diagrams

All diagrams are listed in [diagrams/README.md](diagrams/README.md). Each one has an editable Mermaid source (`diagrams/mermaid/*.mmd`), an SVG export (`diagrams/svg/`) and a PNG export (`diagrams/png/`).

## Key numbers (used consistently in all documents)

| Item | Count | Source |
|---|---|---|
| Backend HTTP endpoints | 26 | `backend/index.js` (24) + `backend/routes/auth.js` (2) |
| Endpoints protected by `verifyToken` | 10 | see [API reference](07-api-reference.md) |
| Endpoints with no token check | 16 | see [API reference](07-api-reference.md) |
| Mongoose models | 8 (7 used) | `backend/models/` |
| Frontend route entries | 19 | `frontend/src/App.jsx:20-40` |
| Routes wrapped in `Private` | 9 | `App.jsx` |
| Frontend component files (`.jsx`) | 19 | `frontend/src/Components/` |
| Scheduled cron jobs | 4 | `backend/index.js:38-61` |
| Automated tests | 0 | — |
