# 13. Core Computer Science Subject Mapping

This document maps the **actual implementation** of Smart Nutrition Tracker to six core Computer Engineering subjects. Each subject has a detailed document in [core-subjects/](core-subjects/README.md) with code examples and interview questions. This page is the overview.

The rule throughout: a concept is listed as *used* only if it appears in the source code. Concepts that a reader might expect but that are absent are listed as *not implemented*.

## 13.1 Summary matrix

| Subject | Strength of mapping | Best examples in this project | Detailed document |
|---|---|---|---|
| Object-Oriented Programming | Light | Mongoose schemas and models as classes, module encapsulation, middleware chain | [OOPS.md](core-subjects/OOPS.md) |
| Database Management Systems | Strong | 8 schemas, references and populate, unique index, upsert, denormalisation, CRUD | [DBMS.md](core-subjects/DBMS.md) |
| Operating Systems | Moderate | Event loop and async I/O, process signals, environment variables, cron scheduling, memory buffers | [OPERATING_SYSTEMS.md](core-subjects/OPERATING_SYSTEMS.md) |
| Computer Networks | Strong | HTTP/REST, status codes, headers, CORS, JSON and multipart, SMTP, third-party REST APIs, proxy | [COMPUTER_NETWORKS.md](core-subjects/COMPUTER_NETWORKS.md) |
| Data Structures and Algorithms | Light to moderate | Hash map de-duplication, linear aggregation, string parsing, random sampling, hashing | [DSA.md](core-subjects/DSA.md) |
| Software Engineering | Moderate (with useful counter-examples) | Three-tier architecture, modules, Git, ESLint, environment config; missing tests and CI | [SOFTWARE_ENGINEERING.md](core-subjects/SOFTWARE_ENGINEERING.md) |

## 13.2 Highlights per subject

### OOP
- **Used:**
  - `new mongoose.Schema(...)` and `mongoose.model(...)` create model classes, and `new postModel({...}).save()` creates and saves an object (`index.js:449-457`).
  - `mailService.js` hides the transporter and exposes three functions (encapsulation).
  - Express middleware forms a chain where each step decides whether to call `next()`.
- **Not implemented:** custom classes, inheritance, polymorphism, interfaces. React components are functions, not classes.

### DBMS
- **Used:**
  - Document schemas with constraints (`required`, `enum`, `match`, `min`, `unique`) and references (`ref: 'User'`).
  - `populate()` works like a join, and `findOneAndUpdate` with `upsert`.
  - Timestamps; an embedded sub-document (`details`); deliberate denormalisation (nutrients copied into each tracking entry).
- **Not implemented:** transactions, aggregation pipeline, compound indexes, referential integrity, pagination.

### Operating Systems
- **Used:**
  - Node's single-threaded event loop with non-blocking I/O (every DB, SMTP and HTTP call is asynchronous).
  - `process.on('uncaughtException')`, `process.exit(1)`, `process.env`.
  - Time-based job scheduling (`node-cron`) and time zones.
  - In-memory buffers (`multer.memoryStorage()`); port binding and `EADDRINUSE`.
- **Not implemented:** worker threads, clustering, file-system storage, explicit synchronisation.

### Computer Networks
- **Used:**
  - Client–server over HTTPS; REST methods (GET, POST, DELETE) and status codes (200, 201, 400, 401, 403, 404, 500, 502).
  - The `Authorization: Bearer` header; CORS.
  - `application/json` and `multipart/form-data`; SMTP through Gmail.
  - Calls to Twilio and Edamam REST APIs; a server-side API proxy (`/generateMeal`).
- **Not implemented:** WebSockets, caching headers, rate limiting, self-managed TLS.

### DSA
- **Used:**
  - Arrays with `map`, `filter` and `forEach`; a `Map` for O(1) duplicate detection (`Track.jsx:32-42`).
  - O(n) summation of nutrients; string splitting and parsing for dates.
  - Regex search; random selection (a biased shuffle); hashing (bcrypt) and HMAC signatures (JWT).
- **Not implemented:** custom data structures, hand-written sorting or searching algorithms, trees or graphs.

### Software Engineering
- **Used:**
  - Three-tier client–server architecture; partial separation into models, routes, services and a controller.
  - Environment-based configuration; Git with a remote; ESLint on the frontend; cloud deployment.
- **Missing:** automated tests, CI/CD, an API specification, consistent modularisation, versioning or releases, code review history.

## 13.3 How to use these documents

- **For exams:** use the "Concepts used" tables as real-world examples of textbook concepts.
- **For interviews:** each subject file ends with questions and answers tied to this code. A combined list is in [CORE_SUBJECT_INTERVIEW_QUESTIONS.md](core-subjects/CORE_SUBJECT_INTERVIEW_QUESTIONS.md).
- **Be honest about gaps:** interviewers value candidates who can say what is *missing* and how they would add it.

Next: [Interview preparation](14-interview-preparation.md)
