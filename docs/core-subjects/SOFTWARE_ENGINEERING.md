# Software Engineering (SE) in Smart Nutrition Tracker

**Strength of mapping: moderate.** The project shows several sound engineering practices (layered architecture, environment-based configuration, version control, linting). It also has clear gaps (testing, CI/CD, modularity, documentation accuracy), which make good "lessons learned" examples.

## 1. Concepts used

### 1.1 Architecture
- **Three-tier client–server architecture:** presentation (React), application (Express), data (MongoDB). See [System architecture](../03-system-architecture.md).
- **Partial MVC on the backend:**
  - **Model:** `backend/models/` holds 8 Mongoose schemas.
  - **Controller:** `Controllers/reportController.js` (only one).
  - **Routes:** `routes/auth.js`; every other route is defined inline in `index.js`.
  - **Service layer:** `services/mailService.js`, `sendMessage.js`.
  - **View:** handled by React; the backend returns JSON.
- **Component-based UI:** 19 React components with a shared `Header` and `Footer`.

### 1.2 Modularity, cohesion and coupling
- **Good cohesion:** `mailService.js` only sends mail; `verifyToken.js` only checks tokens.
- **Low cohesion:** `index.js` mixes database connection, cron scheduling, middleware, 24 routes and error handling (a "god file").
- **Tight coupling:**
  - The frontend repeats the backend base URL 26 times.
  - The calorie formulas live inside a React component instead of a reusable, testable module.

### 1.3 Configuration management
- **Externalised configuration:** environment variables hold the database, mail, SMS, Edamam, time-zone and admin settings (the Twelve-Factor App "config" principle).
- **Not externalised:** the JWT secret and frontend API keys, which counts as a configuration-management defect.

### 1.4 Version control
- **Git with a GitHub remote** and one `main` branch.
- **4 commits, all on one day:** the history was squashed or uploaded as a snapshot, so the development history is lost.
- **Weak commit messages:** messages such as "fixed error" do not say what changed. Conventional commit messages (`fix(frontend): ...`) would help.

### 1.5 Code quality tooling
- **Linting:** ESLint 9 for the frontend (`eslint.config.js`) with React, hooks and refresh rules. There is no linter for the backend.
- **No formatter:** no Prettier configuration; the indentation is inconsistent.

### 1.6 Error handling strategy
- **Central error middleware** plus an `asyncHandler` wrapper (`index.js:67`, `737`): a reusable approach for the newer routes.
- **Inconsistent elsewhere:** older routes use ad-hoc `try/catch` with different response formats.

### 1.7 Defensive programming examples
- **Graceful degradation:** Twilio "mock mode" when credentials are missing (`sendMessage.js:10-15`, `29-32`).
- **Configuration check:** `/generateMeal` checks that keys exist before calling Edamam and returns a clear 500 message.
- **Safe percentage:** the report avoids division by zero (`reportController.js:31`).
- **Field whitelisting:** `POST /userinfo` copies only allowed fields (`index.js:574-589`).

### 1.8 Software development life cycle (as seen in the repository)
| Phase | Evidence |
|---|---|
| Requirements | Implied by features; no written specification in the repository |
| Design | No design documents before this documentation set |
| Implementation | The codebase |
| Testing | **None automated**; one dry-run script |
| Deployment | Render backend; commit `33886ea` switched the URLs to production |
| Maintenance | A "fixed error" commit; dead code left in place |

The project resembles an **iterative / build-and-fix** model typical of student projects, not a planned Waterfall or a disciplined Agile process.

## 2. Practices not implemented

| Practice | Status | Recommendation |
|---|---|---|
| Automated testing (unit, integration, end-to-end) | None | See [Testing](../15-testing.md) |
| CI/CD | None | GitHub Actions: lint, test, build on every push |
| Code review / pull requests | No PR history | Feature branches and PRs |
| API specification | None before this documentation | OpenAPI/Swagger from [API reference](../07-api-reference.md) |
| Input validation layer | None | `zod`, `joi` or `express-validator` |
| Logging strategy | `console.log` only | Structured logging (pino, winston) with levels |
| Dependency hygiene | Unused and undeclared packages; mixed lockfiles | Clean up, commit lockfiles, `npm audit` |
| Semantic versioning / releases | `0.0.0` and `1.0.0` placeholders, no tags | Tag releases; keep `CHANGELOG.md` updated |
| Secret scanning | None | gitleaks or GitHub secret scanning |
| Coding standards / formatter | Partial | Prettier and a shared ESLint config for both apps |
| Separation of business logic from UI | Calculations inside components | `utils/nutrition.js` with pure, tested functions |

## 3. Code smells found (useful for "refactoring" questions)

| Smell | Example |
|---|---|
| God object / large file | `backend/index.js` (850 lines) |
| Duplicated code | Date normaliser written twice (`index.js:317` and `:360`); `timeAgo` copied into 3 components |
| Dead code | About 100 commented lines; unused `PhysicalModel`; `handleWaterIntakeChange`; Home's unused `handleCreatePost` and `handleViewMyPosts` |
| Magic numbers / strings | `+91`, `0.03`, `0.2`, `500`, hardcoded URLs |
| Inconsistent naming | `nutrify` / `nutriquest`; `totalCaloreis` typo (`Profile.jsx:38`); `caloriePercenatge` |
| Misleading comments and messages | "runs every minute" cron comment; post creation returns "Profile photo uploaded successfully!" |
| Copy-paste errors | `POST /posts` reuses the profile-photo messages and variable names |

## 4. Interview questions

**Q1. Which architecture does your project follow?**
A three-tier client–server architecture: React for presentation, Express for application logic, MongoDB for data. The backend is partly MVC (models, one controller, one router), but most routes are still inline in `index.js`. I would refactor into `routes/`, `controllers/` and `services/` for each feature.

**Q2. What would you refactor first and why?**
Split `index.js` by feature (auth, tracking, profile, water, posts, admin), extract the shared date utility, and move the nutrition formulas into a pure module. That improves cohesion and testability, and it makes the security fixes (consistent auth middleware) easier to apply.

**Q3. How do you manage configuration and secrets?**
Through environment variables loaded by `dotenv`, with `.env` git-ignored. That works for the database, mail and SMS settings. The JWT secret and some frontend API keys are hardcoded, which I would move into environment variables or behind backend proxies.

**Q4. How did you ensure quality without tests?**
Mainly manual testing and ESLint on the frontend, plus a dry-run script for the email report. That was not enough: the date-format mismatch and the gender bug would have been caught by simple tests. Next steps: Jest and Supertest for the API, Vitest for the calculation functions, and a CI pipeline.

**Q5. What is technical debt? Give examples from your project.**
The future cost of shortcuts taken now. Examples: hardcoded URLs (26 places to change), duplicated code, dead code, a single large file, and missing indexes. Each makes later changes slower or riskier.

**Q6. Which SDLC model did you follow?**
Mostly iterative build-and-fix: I added features one by one and fixed issues as they appeared. If I did it again, I would use short Agile iterations with a backlog, write acceptance criteria for each feature, and add tests and CI from the start.

**Q7. How would you introduce CI/CD?**
A GitHub Actions workflow on every push and pull request:
1. `npm ci` in both folders.
2. Lint.
3. Run backend tests against mongodb-memory-server.
4. Run frontend tests and `vite build`.
5. Run a secret scan.

On merge to `main`, trigger the Render deploy hook.

**Q8. What does "separation of concerns" mean, and where does the project violate it?**
Each module should have one responsibility. `UserInfo.jsx` both renders the form and holds the BMR and calorie formulas. `index.js` handles server setup, scheduling and every route. Extracting `utils/nutrition.js` and per-feature routers fixes both.
