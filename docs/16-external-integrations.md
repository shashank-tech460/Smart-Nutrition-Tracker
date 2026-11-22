# 16. External Integrations

Smart Nutrition Tracker depends on several third-party services. This document lists each one: where it is called from, how it is authenticated, what it returns, and what happens when it fails. **No key values are reproduced.**

## 16.1 Overview

| Service | Called from | Credentials | Used by feature |
|---|---|---|---|
| MongoDB (Atlas) | Backend | `MONGO_URI` env | All data |
| Gmail SMTP (nodemailer) | Backend | `EMAIL_USER`, `EMAIL_PASS` env | OTP email, daily report, test email |
| Twilio SMS | Backend | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` env | Meal reminders, `/send-messages` |
| Edamam Recipe Search API | Backend **and** browser | Env (backend); **hardcoded** (browser) | `/generateMeal` proxy (unused); `MealPlanGenerator.jsx` (non-functional) |
| Edamam Food Database (via RapidAPI) | Browser | **Hardcoded** RapidAPI key | Food search on Track |
| AI Workout Planner (via RapidAPI) | Browser | **Hardcoded** RapidAPI key | Workout plan, nutrition advice |
| Calories Burned by API-Ninjas (via RapidAPI) | Browser | **Hardcoded** RapidAPI key | Calories burned |
| Spoonacular | Browser | **Hardcoded** API key (query string) | Recipes by ingredients |
| Botpress webchat | Browser | Bot configuration in a hosted script | Chatbot on Home |
| Bootstrap CDN (jsDelivr) | Browser | None (with SRI hashes) | Styles and JS |
| Google `platform.js` | Browser | None | Nothing; it is loaded but unused |
| via.placeholder.com | Browser | None | Placeholder images when a post or profile has none |

## 16.2 Backend integrations

### MongoDB
- **Client:** Mongoose ^8.0.2, `mongoose.connect(MONGO_URI)` (`index.js:29-33`).
- **Failure:** the error is logged and the server keeps running; data routes fail.

### Gmail SMTP (nodemailer)
- **Setup:** `nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })` (`services/mailService.js:4-10`).
- **Startup check:** `transporter.verify()` logs whether the configuration works.
- **Functions:**
  - `sendOtpEmail(email, otp)`: subject "Your OTP for Registration".
  - `sendReportEmail(email, content, subject)`: the default subject is "Your Daily Activity Report".
  - `verifyTransporter()`: a promise version of the startup check.
- **Message format:** plain text (no HTML templates).
- **Gmail specifics:** an App Password is needed when 2-step verification is on. Gmail has daily sending limits, which matters because the report emails every user.
- **Failure behaviour:**
  - OTP generation returns `{ success: false }` with the SMTP error message.
  - The report job logs a failure for that user and continues with the next one.

### Twilio SMS
- **Setup:** `twilio(accountSid, authToken)`, created only if both values exist (`sendMessage.js:10-15`).
- **Sending:** `client.messages.create({ body, from: TWILIO_PHONE_NUMBER, to })`, one message per profile, sent one after another.
- **Recipient format:** digits from `contactNumber`, prefixed with `+91` (India).
- **Failure behaviour:**
  - Without credentials, it logs `[MOCK] Would send to ...`.
  - One `try/catch` wraps the loop, so the first failed send stops the rest.
- **Unable to verify:** whether the account is a trial account. Trial accounts can only send to verified numbers.

### Edamam Recipe Search (server-side proxy)
- **Route:** `POST /generateMeal` (`index.js:679-720`), which calls `GET https://api.edamam.com/search?q&app_id&app_key&from&to[&calories][&health]` with Axios.
- **Keys:** `EDAMAM_APP_ID` and `EDAMAM_APP_KEY` from the environment.
- **Responses:** `{ hits }` on success; 500 if keys are missing; 502 when Edamam responds with an error.
- **Unused:** no UI calls this route. This `/search` URL is Edamam's older Recipe Search endpoint; whether it still accepts requests was not verified.
- **Background:** `backend/README_EDAMAM.md` describes this proxy, but wrongly says it requires a token.

## 16.3 Browser-side integrations (keys exposed)

All of these send their API key from the user's browser, so the keys are visible to anyone. They should be moved behind backend proxies (see [SECURITY.md](../SECURITY.md#s-02-api-keys-in-frontend-code)).

### Edamam Food Database via RapidAPI: `Track.jsx`
1. `GET https://edamam-food-and-grocery-database.p.rapidapi.com/auto-complete?q=<query>` returns an array of food names (`Track.jsx:16-23`).
2. For each name: `GET .../api/food-database/v2/parser?ingr=<name>` reads `hints[0].food` → `label`, `image`, and `nutrients.ENERC_KCAL` (energy), `PROCNT` (protein), `FAT`, `CHOCDF` (carbohydrate), `FIBTG` (fibre), all per 100 g (`Track.jsx:54-83`).

- **Request volume:** one search costs 1 + N requests (N = number of suggestions), which uses quota quickly.
- **Possible crash:** if a nutrient is missing (for example no `FIBTG`), `.toFixed` on `undefined` throws inside the `try`, so that item becomes `null` and is dropped.

### AI Workout Planner via RapidAPI: `GenerateWorkoutPlan.jsx`, `NutritionAdvice.jsx`
- **Endpoints:** `POST https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/generateWorkoutPlan?noqueue=1` and `.../nutritionAdvice?noqueue=1`.
- **Request bodies:**
  - Workout: goal, fitness level, preferences, health conditions, schedule, plan duration.
  - Advice: goal, dietary restrictions, current and target weight, activity level.
- **Responses read:** `response.data.result.exercises` and `response.data.result.meal_suggestions`.
- **Errors:** only logged to the console.

### Calories Burned (API-Ninjas) via RapidAPI: `TrackBurnedCalories.jsx`
- **Endpoint:** `GET https://calories-burned-by-api-ninjas.p.rapidapi.com/v1/caloriesburned?activity=<text>`.
- **Response:** a list of activities with `calories_per_hour`.
- **Local calculation:** `calories_per_hour / 60 × minutes`. One `duration` input value is shared by every listed activity.

### Spoonacular: `Ingredients.jsx`
- **Endpoint:** `GET https://api.spoonacular.com/recipes/findByIngredients?apiKey=<key>&ingredients=<list>`.
- **Displayed:** recipes with used and missed ingredients and like counts. Clicking "like" only changes the number on screen.

### Edamam Recipe API (direct): `MealPlanGenerator.jsx`
- **Direct call:** calls `https://api.edamam.com/search` with a hardcoded app ID and key.
- **Never reached:** the component fails earlier (see [Known limitations](12-known-limitations.md), B-02).

### Botpress webchat: `Home.jsx:93-109`
- **Script injection:** adds `https://cdn.botpress.cloud/webchat/v2.2/inject.js` and a bot-specific configuration script from `files.bpcontent.cloud` to the page on mount, and removes them on unmount.
- **Unable to verify:** the bot's behaviour, from this repository.

## 16.4 Failure-handling summary

| Integration | User-visible failure handling |
|---|---|
| Gmail (OTP) | Error text shown on the Register form |
| Gmail (report) | None (server log only) |
| Twilio | None (server log only) |
| RapidAPI food search | None; the results list stays empty (console log) |
| Workout or advice | Loading label resets; no error message |
| Calories burned | "Unable to fetch data. Please try again." |
| Spoonacular | None (console log) |
| Edamam direct (meal plan) | "Failed to fetch meal plan" (never reached because of B-02) |

## 16.5 Recommendations (not implemented)

1. Rotate all browser-side keys and route every third-party call through the backend.
2. Cache food search results on the server to save quota.
3. Add timeouts and retries for outbound calls (Axios has no timeout by default).
4. Use a transactional email provider for bulk reports, and a job queue for SMS.
5. Remove the unused Google `platform.js` script.

Back to the [documentation index](README.md).
