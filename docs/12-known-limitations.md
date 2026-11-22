# 12. Known Limitations

This is the single list of bugs, gaps and technical debt found in the code at commit `aa8f5a8`. **None of these has been fixed.** Security risks are summarised here and explained in [SECURITY.md](../SECURITY.md).

Severity: **High** = breaks a main feature or exposes data · **Medium** = wrong results or poor behaviour in common cases · **Low** = cosmetic or rare.

## 12.1 Functional bugs

| ID | Severity | Problem | Evidence | Effect |
|---|---|---|---|---|
| B-01 | High | Diet and Profile send dates as `M-D-YYYY`; the backend reads `D-M-YYYY` | `Diet.jsx:27`, `Profile.jsx:112`, `index.js:360-379` | History and calorie progress are empty (day > 12) or show a different day (day ≤ 12) |
| B-02 | High | Meal plan generator cannot work | `MealPlanGenerator.jsx:22,43-53` | No token (401); uses fields not in the profile; `NaN` calories |
| B-03 | High | `/food` page crashes | `App.jsx:44`, `Food.jsx:13-19` | The component receives no `food` prop and reads a property of `undefined` |
| B-04 | High | Slot booking calls endpoints that do not exist | `SlotBooking.jsx:13,31,56` | The page always shows an error |
| B-05 | Medium | First calorie calculation adds 500 kcal | `UserInfo.jsx:91-97` | Uses the old `formData.bmi`; an empty string counts as "< 18.5" |
| B-06 | Medium | Gender is not stored | `UserInfo.jsx:14`, `index.js:574-576` | Must be re-selected each time; the calorie formula depends on it |
| B-07 | Medium | Gender "Other" breaks profile save | `UserInfo.jsx:60-62` | A text value is sent as `dailyCalorieRequirement` → CastError → 500 |
| B-08 | Medium | `fitnessGoal` option `"Maintain Weight"` is not in the enum, and the goal is ignored in calculations | `UserInfo.jsx:273`, `UserInfoModel.js:61` | Invalid value stored; goal has no effect |
| B-09 | Medium | Community shows only 5 random posts | `index.js:659-676` | Not a real feed; search filters only the 5 |
| B-10 | Medium | Post creation requires an image, but the UI marks it optional | `index.js:443`, `PostCreate.jsx:173-177` | Text-only posts fail with 400 and a misleading message |
| B-11 | Medium | Water: the UI caps intake at the goal, the server does not; dates use UTC | `Profile.jsx:153-163` | Display and stored total can differ; wrong date early in the morning (IST) |
| B-12 | Medium | Water upsert is not atomic | `index.js:614-622` | Concurrent clicks can create duplicate records |
| B-13 | Medium | SMS loop stops at the first failure | `sendMessage.js:17-43` | Remaining users get no reminder |
| B-14 | Medium | Server-clock dates for `eatenDate` and the report | `trackingModel.js:30-36`, `reportController.js:42-47` | Off-by-one day on UTC servers |
| B-15 | Low | Report lines always say "Meal" | `reportController.js:28` | Uses `mealType`, which does not exist in the schema |
| B-16 | Low | Reports go to unverified users | `reportController.js:49` | `User.find()` has no filter |
| B-17 | Low | Dead navigation targets `/userpost`, `/chat` | `Community.jsx:29`, `Home.jsx:37`, `Profile.jsx:20` | NotFound page |
| B-18 | Low | Track gives no success or error feedback | `Track.jsx:129-143` | Users cannot tell whether an item was saved |
| B-19 | Low | Login error message is overwritten | `Login.jsx:35-63` | After a 404 or 403, the next `.then` reads `data.token` of `undefined` and the catch shows a generic message |
| B-20 | Low | BMI exactly 18.5 or 25 shows no badge | `UserInfo.jsx:184-186` | Missing feedback |
| B-21 | Low | Legacy `/register` never responds if hashing fails | `index.js:185-203` | Request hangs |
| B-22 | Low | `GET /foods/random` can return fewer items than requested | `index.js:272-274` | Random skip near the end |
| B-23 | Low | Diet page has a fixed 800 px width | `Diet.jsx:81` | Breaks on phones |

## 12.2 Security risks (summary)

The summary has 16 items. Full details, locations and fixes: [SECURITY.md](../SECURITY.md).

- **Critical:** password hashes exposed by an unauthenticated route; API keys in frontend code.
- **High:**
  - hardcoded JWT secret with no expiry;
  - no ownership checks (IDOR);
  - unauthenticated delete, SMS-broadcast and upload routes;
  - OTP bypass;
  - no rate limiting.
- **Medium:**
  - weak OTP generation and logging;
  - open CORS;
  - regex injection;
  - unrestricted uploads;
  - error leakage;
  - token in `localStorage`;
  - password capped at 8 characters.
- **Low:** validators bypassed; weak admin checks.

## 12.3 Missing features

- Chat, "My Posts" page, video-call booking backend, Google login (dependencies only), password reset screen, account deletion, admin UI, pagination, editing posts, editing or deleting tracked food entries.

## 12.4 Technical debt

| Area | Debt |
|---|---|
| Structure | 850-line `backend/index.js` containing almost all routes; about 100 lines of commented-out code |
| Duplication | Date normaliser written twice; `timeAgo()` copied into three components; the logout function written twice |
| Configuration | API base URL hardcoded 26 times; JWT secret and third-party keys hardcoded |
| Dependencies | Undeclared `axios` (backend); unused `bcrypt`, `cron`, `mongoose-dateonly` (backend); unused `pg`, `passport`, `passport-google-oauth20`, `google-auth-library`, `express`, `cors`, `react-tooltip` and a self-reference (frontend); `nodemon` used in production |
| Lockfiles | Backend lockfile git-ignored; frontend has both npm and Yarn lockfiles |
| Database | Missing indexes; dates stored as text in two formats; base64 images; validators skipped; unused `physical` model with a wrong ref |
| Repository hygiene | Malformed `backend/.gitignore`; merge-conflict markers in `frontend/README.md`; about 15 MB of unrelated PDFs and an MP3 in `frontend/src/assets`; empty `scripts/create_test_user.js` |
| Naming | Three product names (see [Project overview](01-project-overview.md#14-naming)); browser title "Vite + React" |
| Quality | No tests, no CI, no backend linting; about 55 `console.log` statements |
| Documentation (before this set) | `backend/README_EDAMAM.md` wrongly says `/generateMeal` requires a token |

## 12.5 Things that could not be verified

| Item | Reason |
|---|---|
| Whether the deployed backend is running and which plan it uses | Not in the repository |
| Frontend hosting provider and URL | Not in the repository |
| Whether the hardcoded third-party keys are still valid | They were not tested, deliberately |
| Twilio account type (trial or paid) | External account |
| Botpress bot content | Configured on Botpress |
| Whether `npm run build` and `npm run lint` pass | Not executed during documentation (no dependencies installed) |
| Whether the `foods` collection contains data | No seed script exists; the database was not queried |

Next: [Core CS subject mapping](13-core-cs-subject-mapping.md)
