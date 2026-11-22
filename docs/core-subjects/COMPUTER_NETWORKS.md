# Computer Networks (CN) Concepts in Smart Nutrition Tracker

**Strength of mapping: strong.** The project is a distributed system made of a browser, an API server, a database and several third-party services, all talking over the network. It uses HTTP/HTTPS, REST, headers, CORS, two body formats, SMTP for email and HTTPS REST APIs for SMS and food data.

## 1. Concepts used

### 1.1 Client–server model
- **Client:** the React app running in the browser.
- **Server:** the Express API on Render.
- **Further servers:** the API server is itself a *client* of MongoDB, Gmail's SMTP server, Twilio and Edamam.

See the [system diagram](../diagrams/svg/01-system-architecture.svg).

### 1.2 Protocol stack in practice
| Layer (TCP/IP model) | In this project |
|---|---|
| Application | HTTP/1.1 over TLS (HTTPS) to the API and third-party APIs; SMTP (nodemailer → Gmail); MongoDB wire protocol (Mongoose → MongoDB) |
| Transport | TCP (`app.listen(PORT)` binds a TCP port; all protocols above run on TCP) |
| Internet | IP; domain names such as `smart-nutrition-tracker-f9e0.onrender.com` and `api.edamam.com` are resolved by DNS |
| Link | Handled by the hosting platform and the user's network |

### 1.3 HTTP methods and REST
| Method | Meaning | Example |
|---|---|---|
| GET | Read | `GET /userinfo/:userId`, `GET /posts` |
| POST | Create or action | `POST /track`, `POST /login`, `POST /register/generate-otp` |
| DELETE | Remove | `DELETE /posts/:id` |

The API is **mostly RESTful**:
- **Resource-style routes:** `/posts`, `/posts/:id`, `/user/:userId/posts`.
- **Action-style routes:** `/send-messages`, `/generateMeal`, `/admin/test-email`.
- **No PUT or PATCH:** updates use POST with upsert (for example `POST /userinfo`).

### 1.4 HTTP status codes used
| Code | Meaning | Where |
|---|---|---|
| 200 OK | Success | most routes |
| 201 Created | Resource created | `POST /track`, legacy `POST /register`, first `POST /water_intake` |
| 400 Bad Request | Invalid input | missing fields, malformed auth header, invalid date |
| 401 Unauthorized | Missing or invalid token | `verifyToken.js` |
| 403 Forbidden | Not allowed | wrong password at login (strictly, 401 would fit better), admin check |
| 404 Not Found | No such resource | unknown user, post or photo |
| 500 Internal Server Error | Server failure | catch blocks, central handler |
| 502 Bad Gateway | The upstream service failed | `POST /generateMeal` when Edamam returns an error |

The auth router returns **200 even for failures** (`{ success: false }`), which goes against HTTP semantics.

### 1.5 Headers
- `Content-Type: application/json` for JSON bodies (`Register.jsx`, `Login.jsx`, `Track.jsx`).
- `Authorization: Bearer <JWT>` carries the token (`verifyToken.js:6-10`).
- `X-RapidAPI-Key` and `X-RapidAPI-Host` authenticate RapidAPI calls (`Track.jsx`).
- CORS response headers are added by `cors()`.

### 1.6 Body formats (content types)
| Format | Used for | Parsed by |
|---|---|---|
| `application/json` | Most API calls | `express.json({ limit: '10mb' })` |
| `application/x-www-form-urlencoded` | Supported, not used by the UI | `express.urlencoded(...)` |
| `multipart/form-data` | Image uploads (`FormData` in `PostCreate.jsx`, `Profile.jsx`) | `multer.single('image')` |

### 1.7 Same-origin policy and CORS
The browser blocks a page from reading responses from another origin unless the server allows it. The frontend and API run on different origins, so the server must send `Access-Control-Allow-Origin`. `app.use(cors())` allows `*` (every origin). For JSON requests with an `Authorization` header, browsers first send an **OPTIONS pre-flight** request, which `cors()` answers automatically.

### 1.8 Stateless authentication over HTTP
HTTP is stateless. The server identifies the user from the JWT sent with each request, not from a server-side session. That makes horizontal scaling simple, because any instance can verify the token, but it also means a token cannot be revoked without extra machinery.

### 1.9 SMTP (email)
`nodemailer.createTransport({ service: 'gmail', auth })` connects to Gmail's SMTP server over TLS and sends the OTP and report messages. SMTP is the application-layer protocol for *sending* mail.

### 1.10 Third-party REST APIs and the proxy pattern
- **Direct from browser:** RapidAPI (Edamam Food DB, Workout Planner, Calories Burned), Spoonacular. Keys travel with every request from the browser, so they are exposed.
- **Through the server:** `POST /generateMeal` makes the server a **proxy**. The browser calls the server, and the server calls Edamam with secret keys. This hides credentials and avoids CORS problems, and is the recommended pattern.
- **Twilio** is called from the server with HTTP Basic authentication handled by the SDK.

### 1.11 Query strings and URL encoding
- **Query strings:** `URLSearchParams` builds the Edamam query safely (`index.js:695-703`). `Ingredients.jsx` uses `encodeURIComponent`.
- **Unencoded interpolation:** `MealPlanGenerator.jsx` interpolates values into the URL without encoding, so special characters could break the request.

### 1.12 Latency and round trips
One food search costs 1 + N HTTP requests (auto-complete, then a parser call per suggestion), run concurrently with `Promise.all`. Concurrency reduces total time, but quota use and the number of round trips stay high.

## 2. Concepts not implemented

| Concept | Status | How it could be used |
|---|---|---|
| WebSockets / real-time | Not used | Live community feed or chat (the "Chat" button exists but has no route) |
| HTTP caching (`Cache-Control`, `ETag`) | Not configured | Cache food search results and static data |
| Rate limiting / throttling | Not implemented | Protect login, OTP and SMS endpoints |
| Security headers (`helmet`) | Not used | HSTS, CSP, X-Frame-Options |
| Restricted CORS origin list | Not configured | Allow only the frontend's origin |
| Compression (gzip / brotli) | Not enabled in Express | Smaller JSON and base64 payloads |
| Request timeouts and retries | Not configured (Axios has no timeout by default) | Avoid hanging on slow third parties |
| Self-managed TLS / certificates | Handled by the hosting platform | — |
| API versioning (`/api/v1`) | Not used | Safer future changes |

## 3. Interview questions

**Q1. What happens when a user clicks "Track"?**
1. The browser resolves the API's domain with DNS, opens a TCP connection, and completes a TLS handshake (HTTPS).
2. It sends `POST /track` with JSON and the `Authorization` header (after a CORS pre-flight `OPTIONS` request).
3. On the server, Express parses the body, verifies the JWT, writes to MongoDB over the database's own TCP connection, and responds `201` with JSON.

**Q2. What is CORS, and why did you need it?**
The frontend and backend are on different origins, so the browser's same-origin policy would block reading the API's responses. The `cors` middleware adds `Access-Control-Allow-Origin` headers and answers pre-flight requests. Mine allows every origin; in production I would allow only the frontend domain.

**Q3. 401 vs 403?**
401 means "not authenticated": no valid credentials. 403 means "authenticated but not allowed". My `verifyToken` correctly returns 401. The login route returns 403 for a wrong password, where 401 would be more accurate.

**Q4. Why send the token in the `Authorization` header and not in the URL?**
URLs get logged by servers, proxies and browser history, and can leak through the `Referer` header. Headers are not logged as widely. The `Bearer` scheme is the standard for OAuth 2.0 and JWT.

**Q5. What is `multipart/form-data`, and why is it used for images?**
It splits the body into parts separated by a boundary, and each part has its own headers. Binary files can then travel alongside text fields without base64 encoding. Multer parses the parts on the server.

**Q6. Explain the proxy pattern in your backend.**
`POST /generateMeal` receives a request from the browser, adds secret Edamam credentials from server environment variables, calls Edamam, and returns the results. The browser never sees the keys, and there is no CORS issue because server-to-server calls are not subject to browser rules.

**Q7. Which protocol sends the OTP email?**
SMTP. nodemailer opens a TLS-secured connection to Gmail's SMTP server, authenticates with the App Password, and submits the message. Gmail then delivers it to the recipient's mail server.

**Q8. Is your API stateless? Why does it matter?**
Yes. Each request carries a JWT and the server keeps no session memory. So any server instance can handle any request, which makes load balancing easy. The cost is that tokens cannot be revoked easily, which is why short expiry times matter.

**Q9. Why is 502 returned in one place?**
`/generateMeal` returns 502 Bad Gateway when the upstream Edamam API responds with an error. The server acted as a gateway and received a bad response from the upstream server, which is exactly what 502 means.

**Q10. How would you reduce network calls in food search?**
Debounce the input, cache recent results on the server, limit the number of parser calls (for example, only the top 5 suggestions), or use one search endpoint that returns nutrients directly.
