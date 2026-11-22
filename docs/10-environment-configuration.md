# 10. Environment Configuration

The backend reads its configuration from environment variables, loaded from `backend/.env` by `dotenv` (`index.js:3`, `services/mailService.js:2`). The frontend reads **no** environment variables.

No `.env.example` file exists in the repository yet. The table below is the complete list, found by searching the source for `process.env`.

## 10.1 Backend variables

| Variable | Required? | Default | Used in | Purpose |
|---|---|---|---|---|
| `MONGO_URI` | **Yes** | none (the server starts but every DB call fails) | `index.js:29` | MongoDB connection string |
| `PORT` | No | `8000` | `index.js:722` | HTTP port. Hosting platforms such as Render set this automatically. |
| `TIMEZONE` | No | `Asia/Kolkata` | `index.js:35` | Time zone for all four cron jobs |
| `EMAIL_USER` | Yes, for OTP and reports | none | `mailService.js:7,23,34` | Gmail address used to send email (also the "from" address) |
| `EMAIL_PASS` | Yes, for OTP and reports | none | `mailService.js:8` | Gmail **App Password** (not the normal account password) |
| `TWILIO_ACCOUNT_SID` | No | none | `sendMessage.js:6` | Twilio account ID |
| `TWILIO_AUTH_TOKEN` | No | none | `sendMessage.js:7` | Twilio secret token |
| `TWILIO_PHONE_NUMBER` | With Twilio | none | `sendMessage.js:8` | Sender phone number |
| `EDAMAM_APP_ID` | Only for `/generateMeal` | none | `index.js:682` | Edamam Recipe API app ID |
| `EDAMAM_APP_KEY` | Only for `/generateMeal` | none | `index.js:683` | Edamam Recipe API key |
| `ADMIN_EMAILS` | No | empty | `index.js:119` | Comma-separated emails allowed to use `POST /admin/send-daily-report/:userId` |

## 10.2 Behaviour when variables are missing

| Missing | Effect |
|---|---|
| `MONGO_URI` | The connection error is logged; requests that touch the database fail or hang until the driver times out |
| `EMAIL_USER` / `EMAIL_PASS` | "Mailer verification failed" is logged at startup; `generate-otp` returns `{ success: false, message: <SMTP error> }`, so **nobody can register** |
| Twilio variables | The SMS function logs `[MOCK] Would send to ...` instead of sending |
| Edamam variables | `POST /generateMeal` returns 500 "Server misconfiguration: Edamam keys missing" |
| `TIMEZONE` | Crons use `Asia/Kolkata` |

## 10.3 Values that should be variables but are not

These values are currently **hardcoded** in the source. The actual values are deliberately not repeated here.

| Value | Location | Suggested variable |
|---|---|---|
| JWT signing secret | `backend/index.js:221`, `backend/verifyToken.js:12` | `JWT_SECRET` |
| Backend base URL | 13 frontend components | `VITE_API_URL` |
| RapidAPI keys (3) | `Track.jsx`, `GenerateWorkoutPlan.jsx`, `NutritionAdvice.jsx`, `TrackBurnedCalories.jsx` | Move to backend env and proxy |
| Spoonacular key | `Ingredients.jsx` | Move to backend env and proxy |
| Edamam Recipe app ID and key | `MealPlanGenerator.jsx` | Already supported by the backend as `EDAMAM_APP_ID` / `EDAMAM_APP_KEY` |
| SMS country code `+91` | `sendMessage.js:27` | `SMS_DEFAULT_COUNTRY_CODE` |
| Upload and body size limits (10 MB) | `index.js:69,73-74` | optional |

## 10.4 Handling secrets safely

- **Never commit `.env`.** It is already ignored by `backend/.gitignore`. Note that the frontend `.gitignore` ignores `*.local` files (such as `.env.local`) but not `.env` itself.
- **Use the hosting platform's secret settings** in production (for example, Render's Environment tab).
- **Prefer a Gmail App Password** (requires 2-step verification) or a transactional email provider.
- **Rotate keys exposed in Git history.** Removing them from the latest commit does not remove them from earlier commits.
- **Do not put secrets in `VITE_*` variables.** Anything with that prefix is embedded in the public JavaScript bundle. Only the public API base URL belongs there.

## 10.5 Suggested `.env.example` (to create in a later phase)

```dotenv
# backend/.env.example — copy to .env and fill in
MONGO_URI=
PORT=8000
TIMEZONE=Asia/Kolkata
EMAIL_USER=
EMAIL_PASS=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
EDAMAM_APP_ID=
EDAMAM_APP_KEY=
ADMIN_EMAILS=
# Not read by the code yet (recommended):
# JWT_SECRET=
```

Next: [Deployment guide](11-deployment-guide.md)
