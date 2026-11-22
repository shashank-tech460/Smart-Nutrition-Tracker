# 2. Features and Implementation Status

Each feature was checked against the actual source code. Status labels are defined in the [documentation index](README.md#status-labels-used-everywhere). "Implemented" means the code paths connect correctly when read. It does **not** mean the feature was run or tested.

## 2.1 Summary

| # | Feature | Status |
|---|---|---|
| F1 | Email OTP registration | ✅ Implemented |
| F2 | Legacy direct registration (no OTP) | ✅ Implemented (unintended bypass) |
| F3 | Password hashing | ✅ Implemented |
| F4 | Login and JWT | ✅ Implemented (weak configuration) |
| F5 | Frontend route guard | ⚠️ Partially implemented |
| F6 | Food search and meal logging | ✅ Implemented |
| F7 | Nutrient scaling and daily totals | ✅ Implemented |
| F8 | Nutrition history (Diet page) | ⚠️ Partially implemented |
| F9 | Profile dashboard | ⚠️ Partially implemented |
| F10 | BMI calculation | ✅ Implemented |
| F11 | Daily calorie requirement | ✅ Implemented (with calculation bugs) |
| F12 | Health and fitness goals | ⚠️ Partially implemented |
| F13 | Water intake tracking | ✅ Implemented (minor bugs) |
| F14 | Community feed | ⚠️ Partially implemented |
| F15 | Create, view and delete posts | ✅ Implemented |
| F16 | Profile photo upload | ✅ Implemented |
| F17 | Nightly email report (cron) | ✅ Implemented |
| F18 | SMS meal reminders (cron, Twilio) | ✅ Implemented · ❔ delivery depends on the Twilio account |
| F19 | Admin report and test-email triggers | ✅ Implemented (weak authorization) |
| F20 | Workout plan generator | ✅ Implemented (third-party) |
| F21 | Nutrition advice | ✅ Implemented (third-party) |
| F22 | Calories burned calculator | ✅ Implemented (third-party, no navigation link) |
| F23 | Recipes by ingredients | ✅ Implemented (third-party, no navigation link) |
| F24 | Chatbot | ❔ Third-party embed, configuration unable to verify |
| F25 | Weekly meal plan generator | ❌ Non-functional |
| F26 | Server-side Edamam meal proxy | ✅ Implemented backend · not used by any UI |
| F27 | Local food database page (`/food`) | ❌ Non-functional |
| F28 | Video-call slot booking | 🎨 UI only |
| F29 | Chat | ⛔ Not implemented |
| F30 | "View My Posts" page | ⛔ Not implemented (backend endpoint exists) |
| F31 | Google OAuth login | ⛔ Not implemented |
| F32 | Physical info (height, weight, BMI) | ⛔ Not implemented (dead model) |
| F33 | Health check endpoint | ✅ Implemented |

## 2.2 Details and evidence

### F1: Email OTP registration ✅
- **Frontend:** `Register.jsx` makes a two-step request: `generate-otp`, then `verify-otp`.
- **Backend:** `routes/auth.js:14-63`.
- **OTP rules:** 6 digits, valid for 5 minutes. Sent with nodemailer through Gmail (`services/mailService.js:21-30`).
- **Limitations:**
  - Errors return HTTP 200 with `success: false`.
  - The OTP is also logged to the console.
  - After success the UI shows a message but does not redirect to login.

See [Authentication and OTP flow](08-authentication-and-otp-flow.md).

### F2: Legacy direct registration ✅ (unintended)
`POST /register` (`index.js:181-207`) still hashes the password and creates a user **without** an OTP. It is reachable because the auth router mounted at `/register` has no handler for the root path, so the request falls through to this route.

### F3: Password hashing ✅
bcryptjs with cost factor 10:
- `routes/auth.js:51`: `bcrypt.hash(password, 10)`
- `index.js:185-188`: `genSalt(10)` + `hash`

### F4: Login and JWT ✅ (weak)
`POST /login` (`index.js:209-250`) compares the password with bcrypt and signs a JWT whose payload is `{ email }`.
- **Weaknesses:**
  - The secret is a hardcoded string.
  - There is no expiry.
  - `isVerified` is not checked.
- **Logout** only clears `localStorage` (`Header.jsx:11-17`).

### F5: Frontend route guard ⚠️
`Private.jsx` renders the page only if a user object exists in context (loaded from `localStorage`). It does not check whether the token is valid or expired.
- **Unguarded routes:** six routes are not wrapped: `/generateWorkout`, `/advice`, `/trackburn`, `/videomeet`, `/posts/:postId`, `/ingredients`.

### F6: Food search and meal logging ✅
`Track.jsx`:
1. Calls the RapidAPI Edamam auto-complete endpoint, then the parser endpoint once per suggestion (in parallel with `Promise.all`).
2. Removes duplicates with a `Map`.
3. Shows nutrients per 100 g.
4. On "Track", sends `POST /track` with the scaled values.

The backend stores the entry with today's date in `DD-MM-YYYY` format (`index.js:306-347`). The UI shows no success or error message; the result only goes to the browser console.

### F7: Nutrient scaling and daily totals ✅
- **Scaling:** `value × grams / 100` (`Track.jsx:118-122`).
- **Daily totals:** a simple sum over the day's entries (`Diet.jsx:50-73`, `Profile.jsx:91-108`, `reportController.js:21-31`).

See [Interview preparation](14-interview-preparation.md) and [DSA](core-subjects/DSA.md).

### F8: Nutrition history (Diet page) ⚠️
`Diet.jsx:27` builds the URL date as `month-day-year`, for example `11-22-2026`. The backend's normaliser (`index.js:360-379`) reads the first number as the **day**. The result:
- if the day is greater than 12, nothing is found;
- if the day is 12 or less, entries from a different date (with day and month swapped) are returned.

The email report is not affected because it builds the date itself.

The page also uses a fixed `width: 800px` (`Diet.jsx:81`), which does not fit phones.

### F9: Profile dashboard ⚠️
`Profile.jsx` shows calories eaten against the goal, a Chart.js pie chart of macronutrients, the water tracker and the profile photo.
- **Shared date bug:** it has the same date bug as F8 (`Profile.jsx:112`).
- **Dead link:** the "Chat" button goes to `/chat`, which has no route, so the NotFound page appears.

### F10: BMI calculation ✅
`BMI = weight(kg) / (height(m))²` in `UserInfo.jsx:44-48`.
- **Badge bands:** above 25 is "above normal", between 18.5 and 25 is "normal", below 18.5 is "below normal" (`UserInfo.jsx:184-186`).
- **Edge cases:** exactly 18.5 or 25 shows no badge.
- **Calculated client-side only:** the server stores whatever value it receives.

### F11: Daily calorie requirement ✅ (with bugs)
Mifflin-St Jeor BMR × activity multiplier, then ±500 kcal based on BMI (`UserInfo.jsx:51-98`). Known bugs:
1. **Stale BMI:** the ±500 rule reads `formData.bmi`, which still holds the value from **before** the current submit. For a new user it is an empty string, and `'' < 18.5` is `true` in JavaScript, so **every first submission adds 500 kcal**.
2. **Gender is never saved:** `gender` is not in the schema or the backend's allowed-field list. It must be chosen again each time.
3. **"Other" gender breaks the save:** choosing "Other" makes the function return a text message instead of a number. Mongoose cannot store text in a Number field, so `POST /userinfo` returns 500.

See the [BMI and calorie flowchart](diagrams/svg/06-bmi-calorie-flowchart.svg).

### F12: Health and fitness goals ⚠️
`fitnessGoal`, `activityLevel`, `dietaryPreferences`, `allergies` and `healthConditions` are stored. Only `activityLevel` affects any calculation; `fitnessGoal` is ignored.
- **Mismatched value:** the UI option `"Maintain Weight"` does not match the schema enum value `"Maintain Current Weight"`. It is saved anyway because validators do not run on this update (`index.js:591-595`).

### F13: Water intake tracking ✅ (minor bugs)
- **Goal:** `weight × 0.03` litres (`Profile.jsx:57`). Each click adds 0.2 L (`Profile.jsx:153-185`).
- **Backend:** adds to the existing record for that user and date (`index.js:609-623`).
- **Bugs:**
  - The UI caps the displayed value at the goal, but the server keeps adding.
  - The date comes from `toISOString()`, which is UTC; in India, before 05:30 the previous day is used.
  - The read-then-write update can create duplicate records if two requests arrive together.
  - `handleWaterIntakeChange` is never used.

### F14: Community feed ⚠️
`Community.jsx` and `Home.jsx` call `GET /posts`, which returns **up to 5 random posts**, not all posts (`index.js:659-676`). The search box filters only those 5. The "View My Posts" button navigates to `/userpost`, which has no route.

### F15: Create, view and delete posts ✅
`PostCreate.jsx` lists the user's own posts (`GET /user/:userId/posts`), creates posts with multipart form data (`POST /posts`) and deletes posts (`DELETE /posts/:id`). `ViewPost.jsx` shows one post.
- **Image required:** the backend **requires an image** (`index.js:443`), while the form marks it optional. A post without an image fails with a 400 error and the message "User ID and image are required!".
- **No ownership check:** the server does not check who owns a post before deleting it.

### F16: Profile photo upload ✅
`Profile.jsx:188-211` uploads with `FormData`. The backend stores the image as base64 in `profilephotos`, updating it if one exists (`index.js:473-515`), and serves it from `GET /upload_profile_photo/:userId`. There is no file-type check and no authentication.

### F17: Nightly email report ✅
The cron expression `0 22 * * *` in the `TIMEZONE` time zone (default `Asia/Kolkata`) runs `generateDailyReport()` (`index.js:38-46`). For every user, it sums yesterday's tracked nutrients, works out the percentage of the daily requirement, and emails a plain-text summary (`Controllers/reportController.js`). Limitations:
- **Every line says "Meal":** each meal line prints `activity.mealType`, a field that does not exist.
- **Unverified users included:** unverified users also receive reports.
- **Server time:** "yesterday" is calculated with the server's clock.
- **Wrong comment:** the comment above the cron says "runs every minute", which is not true.

### F18: SMS meal reminders ✅ ❔
Three crons (08:00, 12:00, 19:00) call `sendMessageToAllUsers()` (`index.js:49-63`, `sendMessage.js`). It reads every profile with a contact number, keeps the digits, adds `+91`, and sends through Twilio. Without Twilio credentials it only logs "[MOCK]".
- **One failure stops the batch:** one `try/catch` wraps the whole loop, so one failed send stops all remaining sends.
- **Unable to verify:** whether messages are actually delivered depends on the Twilio account (a trial account only sends to verified numbers).

### F19: Admin triggers ✅ (weak)
- `POST /admin/send-daily-report` and `POST /admin/test-email` accept any valid token.
- `POST /admin/send-daily-report/:userId` requires the caller's email to be in `ADMIN_EMAILS`.

There is no admin UI.

### F20–F23: Third-party helper tools ✅
These call RapidAPI or Spoonacular **directly from the browser** with keys written in the code:

| Feature | Component | API |
|---|---|---|
| Workout plan | `GenerateWorkoutPlan.jsx` | RapidAPI AI Workout Planner `/generateWorkoutPlan` |
| Nutrition advice | `NutritionAdvice.jsx` | Same provider, `/nutritionAdvice` |
| Calories burned | `TrackBurnedCalories.jsx` | RapidAPI API-Ninjas Calories Burned; total = kcal per hour ÷ 60 × minutes |
| Recipes by ingredients | `Ingredients.jsx` | Spoonacular `findByIngredients`; "likes" change only on screen |

- **Navigation:** workout and nutrition are linked in the header. `/trackburn` and `/ingredients` are reachable only by typing the URL.
- **Error handling:** errors are mostly only logged to the console.

### F24: Chatbot ❔
`Home.jsx:93-109` injects two Botpress webchat scripts. The bot's behaviour is configured on Botpress's side and cannot be checked from this repository.

### F25: Weekly meal plan generator ❌
`MealPlanGenerator.jsx` cannot work as written:
1. **401:** it calls `GET /userinfo/:userId` **without** an `Authorization` header, but that route requires a token.
2. **Missing fields:** it reads `gender`, `numOfMeals`, `dietPreference` and `healthSpec`, none of which exist in the stored profile.
3. **NaN result:** it multiplies the BMR by `activityLevel`, which is text such as "Sedentary", so the result is `NaN`.
4. **Bypasses the proxy:** it calls Edamam directly with hardcoded keys instead of the backend proxy (F26).

### F26: Server-side Edamam proxy ✅ (unused)
`POST /generateMeal` (`index.js:679-720`) builds an Edamam Recipe Search request from server environment variables and returns `{ hits }`. No frontend code calls it. `backend/README_EDAMAM.md` says this route requires a token, but it does not.

### F27: Local food database page ❌
The `/food` route renders `<Food />` without the `food` prop that the component expects (`App.jsx:44`, `Food.jsx:13-19`). The effect sets the state to `undefined`, and the render then reads `food.imageUrl`, which throws. The backend `GET /foods` endpoints work, but no UI calls them, and nothing seeds the `foods` collection.

### F28: Video-call slot booking 🎨
`SlotBooking.jsx` calls `/api/slots`, `/api/book-slot/:id` and `/api/unblock-slot/:id`. **None of these exist** in the backend, so the page always shows "Unable to load slots". There is no video-call code.

### F29–F32: Not implemented ⛔
- **Chat:** only a button that navigates to the missing `/chat` route.
- **View My Posts:** the button goes to `/userpost`, which has no route. The backend endpoint `GET /user/:userId/posts` exists and is used by `PostCreate.jsx`.
- **Google OAuth:** `passport`, `passport-google-oauth20` and `google-auth-library` are installed in the **frontend** and `index.html` loads Google's `platform.js`, but no code uses them.
- **Physical info:** `PhysicalModel.js` exists; its routes are commented out (`index.js:753-780`).

### F33: Health check ✅
`GET /health` returns `{ status: "ok", timestamp }` (`index.js:146`).

Next: [System architecture](03-system-architecture.md)
