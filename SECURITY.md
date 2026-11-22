# Security Policy

This document records the **current security posture** of Smart Nutrition Tracker as of commit `aa8f5a8`. Every item below is an **existing, unfixed risk** found by reading the source code. Nothing here has been remediated yet.

No secret values are reproduced in this file. Where a secret is hardcoded, only its location is given.

## Supported versions

There are no releases or version tags. Only the `main` branch exists.

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub's private vulnerability reporting ("Security" tab → "Report a vulnerability") on the repository, if the owner has enabled it, or contact the repository owner privately through GitHub.

---

## Summary of existing risks

| ID | Severity | Risk | Location |
|---|---|---|---|
| S-01 | Critical | Unauthenticated endpoint returns password hashes and OTP fields | `backend/index.js:352-386` |
| S-02 | Critical | Third-party API keys hardcoded in frontend source and Git history | 6 frontend components (see below) |
| S-03 | High | JWT secret is a hardcoded string, and tokens never expire | `backend/index.js:221`, `backend/verifyToken.js:12` |
| S-04 | High | No object-level authorization (IDOR) | `backend/index.js` (userinfo, water, track, posts, photos) |
| S-05 | High | Unauthenticated destructive or costly endpoints | `backend/index.js:149`, `:165`, `:473`, `:679` |
| S-06 | High | OTP can be bypassed; login ignores `isVerified` | `backend/index.js:181`, `:209` |
| S-07 | High | No rate limiting (OTP and password brute force) | whole API |
| S-08 | Medium | OTP generated with `Math.random`, stored in plaintext, written to logs | `backend/routes/auth.js:9-11`, `:23`, `:28` |
| S-09 | Medium | CORS allows every origin | `backend/index.js:75` |
| S-10 | Medium | User input used directly as a regular expression | `backend/index.js:285` |
| S-11 | Medium | Unrestricted uploads held in memory and stored as base64 | `backend/index.js:68-69`, `:439`, `:473` |
| S-12 | Medium | Internal error details returned to clients | `backend/index.js:101,109,417,432,469,513,568`; `routes/auth.js:34` |
| S-13 | Medium | JWT stored in `localStorage`; third-party scripts injected without integrity checks | `Login.jsx:55`, `Home.jsx:93-109` |
| S-14 | Medium | Weak password policy (UI caps passwords at 8 characters) | `frontend/src/Components/Register.jsx:83` |
| S-15 | Low | Schema validators bypassed on profile upsert | `backend/index.js:591-595` |
| S-16 | Low | Admin authorization is weak or ineffective | `backend/index.js:79`, `:93`, `:114-131` |

---

## Details

### S-01: Password hashes exposed through `populate`
`GET /track/:userid/:date` has no `verifyToken` middleware, and it calls `.populate('userId')` (`index.js:384`). The populated document is the full `User` record, which includes `password` (the bcrypt hash), `otp` and `otpExpiry`. Anyone who knows or guesses a user ID can read these fields.

**Recommended fix:** add authentication; remove the populate or use `.populate('userId', 'name')`; set `select: false` on sensitive schema fields.

### S-02: API keys in frontend code
Keys for RapidAPI (three different keys), Spoonacular and the Edamam Recipe API (app ID and key) are written directly into:
`Track.jsx:18` and `:57`, `GenerateWorkoutPlan.jsx:26`, `NutritionAdvice.jsx:22`, `TrackBurnedCalories.jsx:24`, `Ingredients.jsx:10`, `MealPlanGenerator.jsx:57-58`.

Anything in frontend code is shipped to every browser, and these keys are also in the public Git history. Deleting them from the current code does **not** remove them from history.

**Recommended fix:** revoke and rotate every key; move the calls behind backend proxy endpoints (the existing `POST /generateMeal` shows the pattern) and read keys from environment variables.

### S-03: JWT configuration
`jwt.sign({ email }, <hardcoded string>)` is called without `expiresIn`, and `verifyToken.js` verifies with the same hardcoded string. Anyone who reads the source can forge a valid token for any email, and a stolen token works forever.

**Recommended fix:** load the secret from an environment variable such as `JWT_SECRET`, set an expiry, include the user ID in the payload, and consider refresh tokens or server-side revocation.

### S-04: No object-level authorization (IDOR)
The token payload only contains `email` (`index.js:221`). Protected routes take the `userId` from the request body or URL and never compare it with the token owner:
- `POST /userinfo`, `GET /userinfo/:userId`
- `POST /water_intake`, `GET /water_intake/:userId/:date`
- `POST /track`

A logged-in user can read or overwrite another user's profile, water and meal data by changing the ID.

**Recommended fix:** put the user ID in the token and derive it on the server (`req.user.id`) instead of trusting the client.

### S-05: Unauthenticated destructive or costly endpoints
- `POST /send-messages` (`index.js:149`): anyone can send an SMS to every user. This costs money through Twilio and could be used for spam.
- `DELETE /posts/:id` (`:165`): anyone can delete any post.
- `POST /upload_profile_photo` (`:473`): anyone can replace any user's profile photo.
- `POST /generateMeal` (`:679`): anyone can spend the server's Edamam quota.
- `POST /posts` (`:439`): anyone can create a post as any user ID.

### S-06: OTP bypass and unverified logins
The legacy `POST /register` route (`index.js:181`) still creates users directly, with no OTP. `POST /login` does not check `isVerified`. Email verification can therefore be skipped completely.

### S-07: No rate limiting
There is no rate limiter anywhere. A 6-digit OTP has 900,000 possible values and stays valid for 5 minutes with unlimited attempts (`routes/auth.js:46`). Login and OTP generation (which sends email) can also be called without limit.

### S-08: OTP handling
- The OTP comes from `Math.random()`, which is not a cryptographically secure generator.
- It is stored in plaintext in the `users` collection.
- It is printed with `console.log` (`routes/auth.js:28`), so anyone with log access can read it.

### S-09: CORS
`app.use(cors())` with default options sends `Access-Control-Allow-Origin: *`. Any website can call the API from a browser.

### S-10: Regex from user input
`GET /foods/:name` passes `req.params.name` straight into `$regex` (`index.js:285`). A crafted pattern can cause slow queries (ReDoS) or match more than intended.

### S-11: Uploads
Multer uses memory storage with a 10 MB limit and no file-type filter. Images are converted to base64 (about 33% larger) and stored inside MongoDB documents. `GET /posts` loads every post, including image data, into memory before picking 5. Large or many uploads could exhaust memory.

### S-12: Error detail leakage
Several handlers return the raw `error` object or `err.message` to the client. These can reveal internal details such as database errors and stack-related information.

### S-13: Client-side token storage and third-party scripts
The JWT is stored in `localStorage` under `nutrify-user`. Any script running on the page (for example through XSS) can read it. `Home.jsx` injects two Botpress scripts at runtime without Subresource Integrity, and `index.html` loads Google's `platform.js`, which nothing uses.

### S-14: Password policy
The registration password field has `maxLength={8}`, so passwords cannot be longer than 8 characters. The server enforces no minimum length or complexity.

### S-15: Validators bypassed
`findOneAndUpdate(..., { upsert: true })` runs without `runValidators: true`. The `required`, `enum` and `match` rules in `UserInfoModel.js` are **not** enforced on this path. Invalid values (for example the UI's `"Maintain Weight"`, which is not in the enum) are saved.

### S-16: Admin endpoints
- `POST /admin/send-daily-report` and `POST /admin/test-email` accept **any** valid token. Any user can trigger emails to all users, or send a test email to any address.
- `POST /admin/send-daily-report/:userId` checks `ADMIN_EMAILS`. Its "self" check compares `req.user.userid` or `req.user.id`, which the token never contains, so only admins can use it.

---

## What is already done correctly

- Passwords are hashed with bcryptjs at cost factor 10 (`routes/auth.js:51`, `index.js:185-188`).
- `backend/.env` is listed in `.gitignore`, and no `.env` file is committed.
- MongoDB, Gmail, Twilio and the server-side Edamam credentials are read from environment variables.
- The MongoDB connection string was moved out of source code (commit `ba8110b`). The earlier value in Git history pointed to a local database without credentials.
- Twilio sending switches to a logging "mock" mode when credentials are missing (`sendMessage.js:10-15`).

## Recommended remediation order

1. Rotate every exposed third-party key and remove them from frontend code (S-02).
2. Protect `GET /track/:userid/:date` and remove sensitive fields from populate (S-01).
3. Move the JWT secret to an environment variable, add expiry, put the user ID in the token (S-03).
4. Add authentication and ownership checks to every user-specific and destructive route (S-04, S-05, S-16).
5. Remove the legacy `/register` route and require `isVerified` at login (S-06).
6. Add rate limiting (for example `express-rate-limit`) and an OTP attempt counter (S-07, S-08).
7. Restrict CORS to the real frontend origin; add `helmet`; validate input (S-09, S-10, S-12).

See also: [docs/12-known-limitations.md](docs/12-known-limitations.md) · [docs/08-authentication-and-otp-flow.md](docs/08-authentication-and-otp-flow.md)
