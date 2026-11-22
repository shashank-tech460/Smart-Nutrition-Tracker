# 14. Interview Preparation

Questions an interviewer is likely to ask about Smart Nutrition Tracker, with answers grounded in the actual code. The answers are written in the first person, as the developer would say them. They admit weaknesses honestly and explain how each could be improved, which is usually what interviewers want to hear.

Subject-specific questions (OOP, DBMS, OS, CN, DSA, SE) are in [core-subjects/CORE_SUBJECT_INTERVIEW_QUESTIONS.md](core-subjects/CORE_SUBJECT_INTERVIEW_QUESTIONS.md).

---

## A. Project overview

**Q1. Describe your project in two minutes.**
Smart Nutrition Tracker is a MERN web app for tracking food and health goals. Users register with an email OTP and log in with a JWT. On the tracking page they search foods through the Edamam Food Database on RapidAPI, enter how many grams they ate, and the app scales the per-100-gram nutrients and stores the entry in MongoDB. The profile form calculates BMI and a daily calorie target using the Mifflin-St Jeor equation. The profile page shows progress against that target, a macronutrient pie chart, and a water tracker. There is also a community section where users post text with an image. On the backend, `node-cron` sends a nightly email summary through Gmail and meal-time SMS reminders through Twilio. The frontend is React with Vite, and the backend is Express with Mongoose, deployed on Render.

**Q2. Why did you choose the MERN stack?**
It uses one language, JavaScript, across the whole stack, which made development faster. MongoDB's flexible documents fit data such as a tracked meal with an embedded nutrients object. Express is minimal and easy to extend with middleware. React's component model fit the many separate screens. The trade-off is that MongoDB does not enforce relationships, so integrity has to be handled in code, and I did not fully do that.

**Q3. What was the most challenging part?**
Dates. Meals are stored with a text date in `DD-MM-YYYY` format, and I wrote a normaliser on the server (`index.js:317-333`) that accepts several formats. The challenge is that a date like `11-05-2026` is ambiguous. In fact, the Diet page sends month-day-year while the server assumes day-month-year, which is a real bug I found during the audit. The lesson: use one unambiguous format (ISO `YYYY-MM-DD`) or store real `Date` values in UTC and convert only for display.

**Q4. What would you improve first?**
Security. I would move the JWT secret into an environment variable with token expiry, put the user ID in the token and stop trusting `userId` from the client, add authentication to the routes that lack it (especially delete-post, SMS broadcast and the tracking read that exposes password hashes), rotate and proxy the third-party API keys, and add rate limiting. After that: fix the date bug, add tests, and split `index.js` into route and controller modules.

---

## B. Authentication and security

**Q5. Explain your registration flow.**
It has two steps. First, the frontend sends the email to `POST /register/generate-otp`. The server creates a user document if needed, generates a 6-digit OTP with `Math.floor(100000 + Math.random() * 900000)`, stores it with a 5-minute expiry, and emails it with nodemailer. Second, the user submits the OTP with their name, password and age to `POST /register/verify-otp`. The server checks that the OTP matches and has not expired, hashes the password with bcrypt, marks the user verified, and clears the OTP fields.

**Q6. Is your OTP secure?**
Partly. The 5-minute expiry and the one-time clearing are good. The weaknesses are that `Math.random()` is not a cryptographically secure generator (I should use `crypto.randomInt`), that the OTP is stored in plaintext and also printed to the server log, and that there is no limit on attempts. With 900,000 possibilities and no rate limit, guessing within 5 minutes is not impossible. I would hash the OTP, cap attempts at about 5, and add rate limiting.

**Q7. How do you store passwords?**
With bcryptjs at cost factor 10. bcrypt generates a random salt, combines it with the password, and runs a deliberately slow key-derivation function. The salt is stored inside the hash string. At login, `bcrypt.compare` re-hashes the typed password with that salt and compares the results. Salting defeats rainbow tables, and the cost factor slows brute force.

**Q8. How does your JWT authentication work?**
At login I call `jwt.sign({ email }, secret)` and return the token. The frontend stores it in `localStorage` and sends it in the `Authorization: Bearer` header. The `verifyToken` middleware splits the header, verifies the HMAC-SHA256 signature, and puts the decoded payload on `req.user`. A JWT is stateless: the server does not store sessions, it only checks the signature.

**Q9. What is wrong with your JWT implementation?**
Three things. The secret is a hardcoded string, so anyone with the source can forge tokens. There is no expiry, so a stolen token works forever. And the payload only has the email, so routes cannot check that the `userId` in a request belongs to the caller. The fix is `JWT_SECRET` from the environment, `expiresIn`, a `sub` claim with the user ID, and ownership checks that use it.

**Q10. What is IDOR, and does your project have it?**
Insecure Direct Object Reference means a user can access another user's record just by changing an ID in the request. Yes: for example, `GET /userinfo/:userId` only checks that *some* valid token is present, so a logged-in user can read anyone's profile by changing the ID. The fix is to ignore client-supplied IDs for user-owned data and use the ID from the verified token.

**Q11. Why is `localStorage` a risk for tokens?**
Any JavaScript running on the page can read `localStorage`, so an XSS bug (or a malicious third-party script) could steal the token. An `httpOnly` cookie cannot be read by JavaScript. With cookies you then need CSRF protection, such as `SameSite` cookies or CSRF tokens.

**Q12. You have API keys in the frontend. Why is that a problem, and how would you fix it?**
Everything in a frontend bundle is downloaded by every visitor, so the keys are public. Anyone can use my quota or run up costs. They are also in the Git history. The fix is to revoke and rotate them, store them as server environment variables, and call the third-party APIs through backend proxy routes. I already have one example of this pattern: `POST /generateMeal` reads the Edamam keys from the environment.

**Q13. What does CORS do, and how is it configured here?**
CORS is a browser mechanism. A page on one origin can only read responses from another origin if that server sends `Access-Control-Allow-Origin` headers allowing it. I use `app.use(cors())` with defaults, which allows every origin. That is convenient for development but should be restricted to the real frontend origin in production. CORS does not protect against non-browser clients such as curl; it only controls browsers.

---

## C. Backend

**Q14. Walk me through what happens when the frontend calls `POST /track`.**
1. The request first passes through `express.json` (body parsing), then `cors`, then `morgan` (logging).
2. It reaches the route: `verifyToken` checks the JWT.
3. The handler, wrapped in `asyncHandler`, normalises the date to `DD-MM-YYYY` (defaulting to today), merges it into the body, and calls `trackingModel.create`. Mongoose casts the numeric strings to numbers and validates required fields.
4. It responds 201 with the document.
5. If anything throws, `asyncHandler` passes the error to the central error handler, which responds with a JSON message.

**Q15. What is middleware in Express?**
A function `(req, res, next)` that runs in order for matching requests. It can modify `req` or `res`, end the response, or call `next()` to continue. Error-handling middleware has four arguments `(err, req, res, next)`. In this project: `express.json`, `express.urlencoded`, `cors`, `morgan`, the route-level `verifyToken` and `multer`, and the error handler at `index.js:737`.

**Q16. What is `asyncHandler` and why do you need it?**
Express 4 does not catch rejected promises from async handlers. An error inside an `async` route would become an unhandled rejection instead of reaching the error middleware. `asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)` forwards those errors to `next`. (Express 5 does this automatically.)

**Q17. How do the scheduled jobs work?**
I use `node-cron` with cron expressions. `0 22 * * *` runs the daily report at 22:00, and `0 8 * * *`, `0 12 * * *` and `0 19 * * *` send SMS reminders, all in the `TIMEZONE` time zone. The five cron fields are minute, hour, day of month, month and day of week. The report job loads all users, sums yesterday's tracked nutrients, works out the percentage of each user's calorie target, and emails a text summary. A limitation is that the jobs live in the web process: if the host puts the service to sleep they will not run, and if I scaled to two instances they would run twice.

**Q18. How are images handled?**
Multer parses `multipart/form-data` with memory storage and a 10 MB limit. The buffer is converted to base64 and stored as a string inside the MongoDB document. The frontend shows it with a `data:image/jpeg;base64,...` URL. It is simple, but base64 is about 33% larger, documents have a 16 MB limit, and `GET /posts` loads every image into memory. A better design is object storage (S3, Cloudinary) with only the URL in MongoDB, plus file-type validation.

**Q19. How do you send emails and SMS?**
Email uses nodemailer with the Gmail service preset and credentials from `EMAIL_USER` and `EMAIL_PASS` (a Gmail App Password); it speaks SMTP. SMS uses the Twilio Node SDK, which calls Twilio's REST API over HTTPS. If the Twilio credentials are missing, the function logs "[MOCK]" messages instead, which helps in development.

---

## D. Database

**Q20. Describe your database schema.**
There are eight Mongoose models; seven are used.
- `users` holds account, OTP and verification fields, with a unique email.
- `userinfos` holds the profile, BMI and calorie requirement, referencing the user.
- `trackings` holds one food entry each, with an embedded nutrients object and a text date.
- `waterintakes` holds one record per user per day.
- `posts` and `profilephotos` hold base64 images.
- `foods` is a local food catalogue that the UI does not use.

Relationships are references by `ObjectId`, so they are not enforced.

**Q21. Why copy nutrients into each tracking entry instead of referencing a food?**
The foods come from an external API, not my own catalogue, so there is nothing stable to reference. Copying the scaled values is also a deliberate denormalisation: the history never changes even if the source data changes, and reading a day's log needs no join. The cost is duplicated data.

**Q22. What does `populate` do?**
It replaces an `ObjectId` reference with the referenced document by running an extra query, similar to a join. In `GET /track/:userid/:date` I populate `userId`. That actually exposes the user's password hash because I populate the whole document. It should either select only the name or not populate at all.

**Q23. What indexes do you have, and what would you add?**
Only the default `_id` and a unique index on `users.email`. I would add a compound index `{ userId: 1, eatenDate: 1 }` on trackings (used by the daily log and the report), a unique `{ userId: 1, date: 1 }` on water, and a unique `{ userId: 1 }` on userinfos and profilephotos. Without them, those queries scan the whole collection.

**Q24. What is an upsert, and where do you use it?**
An update that inserts the document if no match exists. `POST /userinfo` uses `findOneAndUpdate({ userId }, { $set }, { upsert: true, new: true })`. One catch: validators do not run on updates unless you pass `runValidators: true`, so my schema's enum and required rules are not enforced on this path.

**Q25. Your water endpoint reads then writes. What is the problem?**
It is a race condition. Two requests at the same time can both see "no record" and both insert, creating duplicates, or both read the same value and lose an increment. The atomic version is `updateOne({ userId, date }, { $inc: { waterConsumed: amount } }, { upsert: true })`, ideally with a unique index on `{ userId, date }`.

---

## E. Frontend

**Q26. How is the frontend structured?**
There is one route table in `App.jsx` with 19 entries using React Router v6. Login state lives in a React Context initialised from `localStorage`. Each page component manages its own state with `useState` and loads data in `useEffect`. A `Private` component wraps nine routes and redirects to `/login` when no user is stored. Charts use Chart.js through react-chartjs-2, and the home carousel uses React-Bootstrap.

**Q27. Why use Context instead of Redux?**
The only shared state is the logged-in user (token, ID and name). Context handles that with no extra library. Redux or Zustand would make sense if more state were shared, such as a cached food log across pages.

**Q28. Is `Private.jsx` a security feature?**
No, it is a user-experience feature. It only hides pages in the browser, and anyone can bypass it. Real protection must happen on the server for every request.

**Q29. How do you avoid duplicate search results?**
The parser API sometimes returns the same food for different suggestions. I build a `Map` keyed by `label-image-calories` and keep only the first item per key, then take `Array.from(map.values())`. `Map` lookups are O(1) on average, so de-duplication is O(n).

---

## F. Algorithms and calculations

**Q30. How do you calculate BMI?**
`BMI = weight(kg) / height(m)²`. Height is entered in centimetres, so I divide by 100 first, then round to 2 decimals (`UserInfo.jsx:44-48`). The UI shows "below normal" under 18.5, "normal" from 18.5 to 25, and "above normal" over 25.

**Q31. How do you calculate the daily calorie requirement?**
1. Basal metabolic rate with Mifflin-St Jeor: men `10W + 6.25H − 5A + 5`, women `10W + 6.25H − 5A − 161` (W in kg, H in cm, A in years).
2. Multiply by an activity factor (1.2 sedentary, 1.375 lightly active, 1.55 moderately active, 1.725 very active) to get total daily energy expenditure.
3. Add 500 kcal if BMI is below 18.5, subtract 500 if it is above 24.9, then round.

I would admit two bugs:
- **Stale BMI:** the BMI used for the ±500 is the value from before the current submit, so a first submission always adds 500.
- **No goal adjustment:** the user's chosen fitness goal is ignored. It would be better to adjust by goal rather than BMI.

**Q32. How do you scale nutrients for the quantity eaten?**
The API gives values per 100 g, so `consumed = value × grams / 100`, done for calories, protein, carbohydrates, fat and fibre (`Track.jsx:118-122`). If no quantity is entered, 100 g is used.

**Q33. How is the daily percentage in the email report calculated?**
`percentage = totalCalories / dailyCalorieRequirement × 100`, shown with 2 decimals. If the requirement is missing or 0, the percentage is 0, which avoids division by zero.

**Q34. How do you choose 5 random posts? Is it a fair shuffle?**
I use `posts.sort(() => 0.5 - Math.random()).slice(0, 5)`. It is **not** a uniform shuffle: a random comparator gives sort algorithms inconsistent comparisons, and some orders become more likely than others. It also loads every post. Better options are a Fisher–Yates shuffle (O(n), uniform) or MongoDB's `$sample` aggregation stage, which picks random documents in the database.

**Q35. How is the water goal calculated?**
`goal (litres) = weight(kg) × 0.03`, about 30 ml per kg (`Profile.jsx:57`). Each button press adds 0.2 L (one glass).

---

## G. Testing, deployment and process

**Q36. How did you test the project?**
Honestly, there are no automated tests. The backend `npm test` script is the default placeholder, and there is a dry-run script for the email report that prints emails instead of sending them. Testing was manual. I would add Jest and Supertest for the API against an in-memory MongoDB (mongodb-memory-server), unit tests for the calculations, and Vitest with React Testing Library for components. The test plan is in [Testing](15-testing.md).

**Q37. How is it deployed?**
The backend runs on Render as a Node web service, with environment variables for MongoDB, Gmail and Twilio. The frontend's API URL points to that Render service. The frontend host is not recorded in the repository. I would add a `render.yaml`, a backend lockfile, a `VITE_API_URL` variable and a CI pipeline.

**Q38. What did you learn from this project?**
Practical lessons:
- Keep secrets out of code, and remember that Git history keeps everything.
- Authentication is not authorization.
- Pick one date format and time zone policy early.
- Background jobs are a deployment concern, not just code.
- Splitting code into modules early avoids a single huge file.
- Tests would have caught the date-format and gender bugs quickly.

**Q39. If you had to scale this to 100,000 users, what would change?**
- **Data and indexes:** add the missing indexes and paginate posts.
- **Images:** move them to object storage behind a CDN.
- **Background work:** move cron and bulk email or SMS to a job queue (for example BullMQ with Redis) running in a separate worker, so the work can be retried and spread out.
- **Platform:** add rate limiting and caching; run several stateless API instances behind a load balancer (JWT makes that easy).
- **Operations:** add monitoring and structured logging.

**Q40. What would you say is good about the code?**
The stack is simple and consistent. Passwords are properly hashed. Most secrets are in environment variables. There is a central error handler with an `asyncHandler` wrapper. Twilio falls back to a mock mode for development. The `/generateMeal` route shows the correct proxy pattern for third-party APIs. The data model is easy to understand.
