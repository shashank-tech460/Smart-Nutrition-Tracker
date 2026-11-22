# 9. Setup and Installation

This guide explains how to run Smart Nutrition Tracker on a development machine. The commands come from the repository's `package.json` scripts. **They were not executed** while this documentation was written, so treat any build or run result as unverified until you try it.

## 9.1 Prerequisites

| Tool | Requirement | Why |
|---|---|---|
| Node.js | 20.19+ or 22.12+ | Vite 7 requires these versions. The backend declares no `engines` field. |
| npm | Comes with Node.js | Both folders use npm scripts. The frontend also has a `yarn.lock`; pick one package manager. |
| MongoDB | A local MongoDB server or a MongoDB Atlas cluster | `MONGO_URI` |
| Git | Any recent version | To clone the repository |
| Gmail account with an App Password | Optional, but needed for OTP registration | `EMAIL_USER`, `EMAIL_PASS` |
| Twilio account | Optional | SMS reminders; without it the app logs "[MOCK]" messages |
| Edamam Recipe API app | Optional | Only for `POST /generateMeal` |
| RapidAPI and Spoonacular keys | Currently hardcoded in the frontend | See the note in 9.5 |

## 9.2 Clone

```bash
git clone https://github.com/shashank-tech460/Smart-Nutrition-Tracker.git
cd Smart-Nutrition-Tracker
```

## 9.3 Backend

```bash
cd backend
npm install
```

Create `backend/.env`. It is ignored by Git and must never be committed. The values below are **placeholders**:

```dotenv
MONGO_URI=mongodb://localhost:27017/nutrify
PORT=8000
TIMEZONE=Asia/Kolkata
EMAIL_USER=your.address@gmail.com
EMAIL_PASS=your-gmail-app-password
# Optional
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
EDAMAM_APP_ID=
EDAMAM_APP_KEY=
ADMIN_EMAILS=admin@example.com
```

Every variable is explained in [Environment configuration](10-environment-configuration.md).

Start the server:

```bash
npm start      # = nodemon index.js (restarts on file changes)
```

What to expect in the console, from the log statements in the code:
- `Server is up and running on port 8000`
- `Database connection successful`, or the connection error if `MONGO_URI` is wrong (the server keeps running)
- `Mailer is configured and ready to send messages.`, or `Mailer verification failed...`
- `Twilio credentials not provided. sendMessageToAllUsers will be a no-op.` if Twilio is not configured

Quick check: open `http://localhost:8000/health`. It should return `{"status":"ok", ...}`.

> **Dependency note:** `backend/index.js` uses `axios`, which is not listed in `backend/package.json`. It is currently installed because `twilio` depends on it. If `require('axios')` ever fails with "Cannot find module", that is the cause.

## 9.4 Frontend

```bash
cd frontend
npm install
npm run dev        # starts the Vite dev server (by default on http://localhost:5173)
```

Other scripts:

| Command | Action |
|---|---|
| `npm run build` | Production build into `frontend/dist` |
| `npm run preview` | Serve the built `dist` folder locally |
| `npm run lint` | Run ESLint |

## 9.5 Connecting the frontend to your local backend

The frontend does **not** read the API URL from configuration. The deployed Render URL is written directly in 13 component files (26 occurrences). As a result:

- **Talks to the deployed server:** a local frontend talks to the deployed Render backend, not to `localhost:8000`.
- **Manual edit required:** to use a local backend you currently have to replace the URL in those files yourself (search for `onrender.com`).
- **Recommended improvement (not implemented):** add `VITE_API_URL` to a `frontend/.env` file and read it through `import.meta.env.VITE_API_URL` in one shared API module.

The RapidAPI, Spoonacular and Edamam keys used by the browser are also hardcoded. If they have been revoked, the food search, workout, advice, calories-burned and recipe pages will fail. See [SECURITY.md](../SECURITY.md#s-02-api-keys-in-frontend-code).

## 9.6 Useful script: report dry run

`backend/scripts/dry_run_report.js` runs the daily report against your database but **prints** the emails instead of sending them:

```bash
cd backend
node scripts/dry_run_report.js              # report for yesterday
node scripts/dry_run_report.js 2026-11-21   # report for a given ISO date
```

It reads `MONGO_URI` (default `mongodb://localhost:27017/nutrify`). It does not write to the database, but it does read every user, so point it at a development database.

## 9.7 First-run checklist

1. Register through the UI. The OTP arrives by email, and it is also printed in the backend console.
2. Log in.
3. Open **Profile → Profile** (`/userinfo`), fill in the form and submit. This creates your profile, BMI and calorie goal.
4. Track a food on **Track**.
5. Check **Profile** for calories and water.

Remember the [known limitations](12-known-limitations.md): the Diet page and the Profile chart may show no data because of the date-format bug.

## 9.8 Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Port 8000 is already in use` | Another process uses the port; set `PORT` |
| OTP email never arrives | Wrong `EMAIL_USER`/`EMAIL_PASS` (Gmail needs an App Password); check the console for "Mailer verification failed" |
| Login says "Incorrect password" for a new account | Registration was not completed with `verify-otp`, so no password is stored |
| Profile save returns "Something went wrong" | Gender "Other" was selected (see [Known limitations](12-known-limitations.md)) |
| Meal plan page shows "Failed to fetch user data" | Known bug: the request has no token |
| Slot booking always shows an error | The backend has no slot endpoints (UI only) |

Next: [Environment configuration](10-environment-configuration.md)
