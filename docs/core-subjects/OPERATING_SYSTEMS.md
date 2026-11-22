# Operating Systems (OS) Concepts in Smart Nutrition Tracker

**Strength of mapping: moderate.** A web application does not implement OS internals, but the Node.js backend depends on several OS-level ideas: processes, an event loop over asynchronous I/O, environment variables, signals and exit codes, memory buffers, scheduling and time zones.

## 1. Concepts used

### 1.1 Process
The backend runs as **one Node.js process** (`node index.js`, or `nodemon index.js` through `npm start`). That one process serves HTTP requests **and** runs the cron jobs. Nodemon is itself a parent process that restarts the child when files change.

### 1.2 Event loop and non-blocking I/O
Node.js runs JavaScript on a single thread. Slow I/O (database queries, SMTP, HTTP calls to Twilio or Edamam) is handed to the operating system and to libuv's thread pool. The event loop continues with other work and runs the callback or resumes the `await` when the result is ready.

```js
// backend/index.js:614-622 — two awaits; the thread serves other requests while waiting
const existing = await WaterModel.findOne({ userId, date });
...
await existing.save();
```
This is why one thread can serve many users at once. It is **concurrency**, not parallelism.

### 1.3 Blocking vs non-blocking, and CPU-bound work
- **CPU-heavy work** blocks the event loop. Hashing passwords is CPU-heavy; bcryptjs's async functions (`bcrypt.hash(..., callback)`, `await bcrypt.hash(...)`) split the work into chunks so other events can run in between.
- **In-memory shuffle:** `GET /posts` loads every post (including base64 images) and shuffles in memory, which is CPU and memory work on the main thread. It grows with data size.

### 1.4 Environment variables
Values come from the process environment through `process.env` (`MONGO_URI`, `PORT`, `EMAIL_USER`, `TIMEZONE`, ...). `dotenv` copies `backend/.env` into `process.env` at start-up (`index.js:3`). Environment variables are an OS feature: every process inherits an environment block from its parent.

### 1.5 Signals, exit codes and process-level error handling
```js
// backend/index.js:727-752
server.on('error', (err) => { if (err.code === 'EADDRINUSE') { ...; process.exit(1); } ... });
process.on('uncaughtException', (err) => { console.error(...); });
process.on('unhandledRejection', (reason, p) => { console.error(...); });
```
- **Exit codes:** `process.exit(1)` ends the process with a non-zero exit code, which tells the parent (nodemon, Render) that it failed.
- **Crash handlers:** the handlers stop the process from crashing on unexpected errors. Continuing after an `uncaughtException` can leave the process in an unknown state; the safer approach is to log and restart.

### 1.6 Ports and sockets
`app.listen(PORT)` asks the OS to bind a TCP socket to a port. `EADDRINUSE` is the OS error returned when another process already holds that port (`index.js:728`).

### 1.7 Memory management (buffers)
```js
// backend/index.js:68-69
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
```
Uploaded files are held in RAM as `Buffer` objects, then converted to base64 strings, which roughly doubles the memory needed for a moment. The 10 MB limit protects against very large files, but many concurrent uploads could still put pressure on the process memory.

### 1.8 Scheduling (time-based jobs)
`node-cron` provides cron-style scheduling inside the process:
```js
cron.schedule('0 22 * * *', async () => { await generateDailyReport(); }, { timezone: timeZone });
```
Cron syntax comes from the Unix `cron` daemon (fields: minute, hour, day of month, month, day of week). Here it is implemented with timers inside Node, not by the OS daemon, so jobs only run while the process is alive.

### 1.9 System clock and time zones
- **Cron jobs** use the `TIMEZONE` variable (default `Asia/Kolkata`).
- **`new Date()`** uses the server's **local** time zone, which on cloud servers is often UTC. That is why `eatenDate` defaults and the report's "yesterday" can be off by a day for Indian users ([Known limitations](../12-known-limitations.md), B-14).
- **Browser clock:** the frontend uses the browser's clock, and `toISOString()` (always UTC) for water dates.

### 1.10 Sequential vs concurrent execution
`sendMessageToAllUsers` and `generateDailyReport` `await` each send inside a `for` loop, so messages go out **one at a time**. That is simple and gentle on rate limits, but slow for many users. `Track.jsx` does the opposite and uses `Promise.all` to run many HTTP requests **concurrently**.

## 2. Concepts not implemented

| Concept | Status | Where it could apply |
|---|---|---|
| Multi-threading (`worker_threads`) | Not used | Offload heavy work (for example image resizing) |
| Multi-process (`cluster`, PM2) | Not used | Use all CPU cores; cron jobs would then need a single-leader design |
| Inter-process communication / message queues | Not used | Move email and SMS jobs to a queue and worker process |
| File system storage | Not used; uploads go to memory and then the database | Disk or object storage for images |
| Locks / semaphores / mutual exclusion | Not used | The water race condition is an example of a missing critical section (solved in the database with `$inc`) |
| Graceful shutdown (handling `SIGTERM`) | Not implemented | Close the HTTP server and DB connection when the platform stops the service |
| Resource limits / back-pressure | Only upload size limits | Limit concurrent sends; stream large responses |

## 3. Interview questions

**Q1. Node.js is single-threaded. How does it handle many users?**
JavaScript runs on one thread, but I/O is non-blocking. When a handler awaits a MongoDB query, the request is parked, and the event loop serves other requests. When the database replies, the handler continues. libuv uses OS async I/O and a small thread pool behind the scenes. CPU-heavy work would block everyone, which is why bcrypt is used asynchronously.

**Q2. What is the difference between concurrency and parallelism? Give examples from the project.**
Concurrency means making progress on many tasks by interleaving them; parallelism means running them at the same moment on several cores. The backend is concurrent (one thread, many in-flight requests). `Promise.all` in `Track.jsx` issues several HTTP requests concurrently. The project has no CPU parallelism (no workers or cluster).

**Q3. What happens if the process crashes?**
The handlers at `index.js:744-752` log the error and keep running. If the process does exit, the hosting platform (or nodemon in development) restarts it. While it is down, scheduled jobs are missed, because they live only in memory.

**Q4. Why can the cron jobs be unreliable in production?**
They are timers inside the web process. If the platform stops idle services, the timers are gone. If two instances run, both fire. Platform-level schedulers or a job queue with a single worker solve this.

**Q5. What is an environment variable, and why use it for secrets?**
A key-value pair that a process inherits from its parent. Secrets in environment variables stay out of source code and Git and can differ per environment. The project does this for MongoDB, Gmail and Twilio, but not for the JWT secret.

**Q6. What does `EADDRINUSE` mean?**
The OS refused to bind the socket because another process is already listening on that port. The code logs a hint and exits with code 1.

**Q7. Where is a race condition in this project, and how would an OS course describe it?**
In `POST /water_intake`, two requests can interleave between the read and the write. In OS terms the read-modify-write is a **critical section** without mutual exclusion. Here the fix is an atomic database operation (`$inc` with upsert) rather than a lock in the application.

**Q8. How are uploaded files stored temporarily?**
Multer's memory storage keeps them as a `Buffer` in the process's heap. The code converts the buffer to base64 and saves it to MongoDB. Nothing is written to disk.

**Q9. What is graceful shutdown, and does the app do it?**
On `SIGTERM` (sent by hosting platforms before stopping a service), a graceful shutdown stops accepting new connections, finishes in-flight requests, and closes the database connection. The app does not handle `SIGTERM`.
