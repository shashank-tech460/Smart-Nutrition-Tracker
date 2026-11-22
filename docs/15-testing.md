# 15. Testing

## 15.1 Current state

| Item | Status | Evidence |
|---|---|---|
| Backend unit or integration tests | **None** | No test files; `backend/package.json` → `"test": "echo \"Error: no test specified\" && exit 1"` |
| Frontend tests | **None** | No `test` script; no testing library in `frontend/package.json` |
| End-to-end tests | **None** | — |
| Continuous integration | **None** | No `.github/workflows` or other CI configuration |
| Linting | Frontend only | `frontend/eslint.config.js`, run with `npm run lint` (not executed during documentation) |
| Manual helper scripts | 1 working, 1 empty | `backend/scripts/dry_run_report.js`; `backend/scripts/create_test_user.js` is 0 bytes |

No claims are made in this documentation that any feature has been tested.

## 15.2 Existing manual tools

### `backend/scripts/dry_run_report.js`
- **What it does:** replaces `mailService.sendReportEmail` with a function that prints the email, connects to `MONGO_URI` (or `mongodb://localhost:27017/nutrify`), and runs `generateDailyReport()`.
- **How to run it:** `node scripts/dry_run_report.js [ISO-date]` from `backend/`.
- **Database safety:** it only **reads** from the database.
- **Deprecated options:** it passes `useNewUrlParser` and `useUnifiedTopology`, which have no effect in Mongoose 8.

### Health and admin endpoints
- `GET /health`: a liveness check.
- `POST /admin/test-email` (token required): checks the SMTP configuration and sends a test email.
- `POST /admin/send-daily-report/:userId` (admin email required): sends one user's report.

## 15.3 Recommended test strategy (not implemented)

| Level | Tooling | What to cover |
|---|---|---|
| Unit (backend) | Jest | Date normaliser, OTP generator range, report totals and percentage, SMS phone formatting |
| Unit (frontend logic) | Vitest | `calculateBMI`, `suggestCalories`, nutrient scaling, water goal. These first need to be moved into pure functions. |
| API integration | Jest + Supertest + mongodb-memory-server | Every endpoint in [API reference](07-api-reference.md): status codes, auth, validation |
| Component | Vitest + React Testing Library | Register two-step flow, Login error messages, Private redirect, Diet totals |
| End-to-end | Playwright or Cypress | Register → login → profile → track → see the entry on Diet |
| External services | Mocks (nock, jest mocks) | Gmail, Twilio, Edamam, RapidAPI; never call real services in tests |

## 15.4 High-value test cases (each would catch a known bug)

| Test | Expected | Catches |
|---|---|---|
| Track an item today, then call `GET /track/:id/<date as the Diet page sends it>` | The item is returned | B-01 date-format bug |
| `suggestCalories` for a new user with BMI 22 | No +500 adjustment | B-05 stale BMI |
| Submit a profile with gender "Other" | Saved, or a clear 400 error | B-07 |
| `GET /track/:id/:date` response | No `password` or `otp` fields | S-01 |
| `DELETE /posts/:id` without a token, or by another user | 401 / 403 | S-05 |
| `GET /userinfo/:otherUserId` with my token | 403 | S-04 IDOR |
| `POST /login` for an unverified user | Rejected | S-06 |
| Two parallel `POST /water_intake` for a new day | One record, total = sum | B-12 |
| `POST /posts` without an image | 201 (if images are meant to be optional) | B-10 |
| Render `/food` | No crash | B-03 |

## 15.5 Suggested CI pipeline (not implemented)

1. Install with a lockfile (`npm ci`) in `backend/` and `frontend/`.
2. `npm run lint` (frontend) and an ESLint configuration for the backend.
3. Backend tests with mongodb-memory-server.
4. Frontend tests and `npm run build`.
5. Optionally a secret scanner (for example gitleaks), which would have flagged the hardcoded keys.

Next: [External integrations](16-external-integrations.md)
