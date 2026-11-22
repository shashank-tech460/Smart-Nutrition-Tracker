# Core Subject Interview Questions (Combined)

Short, interview-ready answers that connect each core subject to Smart Nutrition Tracker. Longer explanations are in the individual subject documents. Project-level questions (architecture, features, security) are in [../14-interview-preparation.md](../14-interview-preparation.md).

Each answer is 2–4 sentences, the length you would actually give in an interview.

---

## Object-Oriented Programming ([details](OOPS.md))

1. **Where are classes and objects in your project?**
   Mongoose models are classes generated from schemas. `new postModel({...})` creates an object, and `save()` is an instance method. I did not write custom classes.

2. **Give an example of encapsulation.**
   `services/mailService.js` keeps the nodemailer transporter private and exports only `sendOtpEmail`, `sendReportEmail` and `verifyTransporter`.

3. **Which design patterns appear?**
   Chain of Responsibility (Express middleware), Proxy (`/generateMeal`), a wrapper/decorator (`asyncHandler`), Observer (`process.on` and `server.on` events) and Provider (React Context).

4. **Where could inheritance help?**
   A custom error hierarchy (`AppError` → `NotFoundError`, `UnauthorizedError`) carrying HTTP status codes, which the central error handler already reads.

5. **Why no class components in React?**
   Hooks give function components state and lifecycle features with less code. All 19 components are functions.

## Database Management Systems ([details](DBMS.md))

6. **SQL or NoSQL, and why?**
   NoSQL (MongoDB). The data is document-shaped, the schema evolved often, and it suits a JavaScript stack. The trade-off is weaker built-in integrity.

7. **Embedding vs referencing in your schema?**
   Nutrient `details` are embedded inside each tracking entry; `userId` references the user from five collections.

8. **What constraints do you use?**
   `required`, `unique` (email), `min` (age, quantity), `enum` (activity level, goal, blood group), `match` (phone, email) and defaults.

9. **What does `populate` do?**
   It replaces a referenced ObjectId with the referenced document by running another query, like a join done in the application.

10. **Which index is missing and matters most?**
    `{ userId: 1, eatenDate: 1 }` on trackings, used by both the Diet page and the nightly report.

11. **Explain a concurrency issue in the project.**
    Water intake is read, increased in JavaScript, then saved, so parallel requests can lose updates or insert duplicates. `$inc` with `upsert` is atomic.

12. **Why don't the schema validators work on profile updates?**
    `findOneAndUpdate` skips validators unless `runValidators: true` is passed.

## Operating Systems ([details](OPERATING_SYSTEMS.md))

13. **How does single-threaded Node serve many users?**
    The event loop and non-blocking I/O. While one request waits for MongoDB or SMTP, others are processed.

14. **Concurrency vs parallelism here?**
    The server is concurrent on one thread; `Promise.all` in `Track.jsx` runs many HTTP calls concurrently. There is no parallel CPU work (no workers or cluster).

15. **What is an environment variable, and where is it used?**
    A key-value setting inherited by a process. `MONGO_URI`, `EMAIL_USER`, `TIMEZONE` and others are read with `process.env`.

16. **What does `process.exit(1)` signal?**
    A non-zero exit code means failure to the parent process (nodemon or the host), which may restart the app.

17. **Why are in-process cron jobs risky?**
    They exist only while the process runs. A sleeping or restarted instance misses jobs, and multiple instances duplicate them.

18. **Where is memory a concern?**
    Multer memory storage keeps uploads in RAM, base64 conversion enlarges them, and `GET /posts` loads every post and image into memory.

## Computer Networks ([details](COMPUTER_NETWORKS.md))

19. **Which application-layer protocols are used?**
    HTTP over TLS (API and third-party APIs), SMTP (Gmail) and the MongoDB wire protocol, all over TCP.

20. **What is CORS, and how is it configured?**
    A browser rule that lets a page read cross-origin responses only when the server allows it. `cors()` currently allows every origin.

21. **401 vs 403?**
    401 means not authenticated; 403 means authenticated but forbidden. `verifyToken` returns 401; login uses 403 for a wrong password, where 401 would be more accurate.

22. **Why use `multipart/form-data` for uploads?**
    It carries binary file parts and text fields in one request without base64 encoding; multer parses it.

23. **What is the benefit of the `/generateMeal` proxy?**
    It keeps Edamam keys on the server and avoids CORS issues, because server-to-server calls are not subject to browser rules.

24. **Is the API stateless?**
    Yes. Every request carries a JWT and no session is stored. That eases scaling but makes revoking a token hard.

## Data Structures and Algorithms ([details](DSA.md))

25. **Which data structure removes duplicate foods?**
    A `Map` keyed by `label-image-calories`: O(1) average lookups, O(n) overall.

26. **Complexity of daily totals?**
    O(n) time and O(1) extra space: one pass with running sums.

27. **Is the random post shuffle correct?**
    No. A random comparator in `sort` gives biased permutations. Fisher–Yates or MongoDB `$sample` is correct.

28. **Why does the date parser fail?**
    `D-M-YYYY` and `M-D-YYYY` are indistinguishable when both numbers are 12 or less. The data format must be unambiguous (ISO).

29. **Hash table vs cryptographic hash?**
    `Map` is for fast lookup; bcrypt and HMAC-SHA256 are one-way functions for security. bcrypt is intentionally slow.

30. **Which algorithm could power a real meal planner?**
    A 0/1 knapsack with dynamic programming: maximise protein subject to a calorie limit.

## Software Engineering ([details](SOFTWARE_ENGINEERING.md))

31. **What architecture is used?**
    A three-tier client–server design with partial MVC on the backend. Most routes are still inline in `index.js`.

32. **Biggest technical debt?**
    The 850-line `index.js`, hardcoded URLs and secrets, duplicated code, and no tests.

33. **How would you add CI/CD?**
    GitHub Actions running install, lint, tests (mongodb-memory-server) and build, plus a secret scan, then a deploy hook on `main`.

34. **What does separation of concerns mean here?**
    Moving the BMR and calorie formulas out of `UserInfo.jsx` into a pure module, and splitting backend routes by feature.

35. **Which SDLC model did the project follow?**
    Iterative build-and-fix. A disciplined Agile process with tests and code review would have caught the known bugs earlier.

36. **What is one good engineering decision in the project?**
    Environment-based configuration for the database, mail and SMS credentials, plus a Twilio mock mode that lets development work without paid services.
