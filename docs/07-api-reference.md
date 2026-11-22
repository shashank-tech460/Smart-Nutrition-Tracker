# 7. API Reference

This is the complete list of the **26 HTTP endpoints** that exist in the backend: 24 in `backend/index.js` and 2 in `backend/routes/auth.js`. No other endpoints exist.

- **Base URL (deployed):** `https://smart-nutrition-tracker-f9e0.onrender.com` (as hardcoded in the frontend). Locally: `http://localhost:8000`.
- **Auth "Token"** means the route uses `verifyToken`: send `Authorization: Bearer <JWT>`. It checks the signature only. **No route checks that the `userId` in the request belongs to the token owner.**
- **Request and response examples** come from reading the source code. They were not captured from a running server, and they contain placeholder values only.

## 7.1 Endpoint index

| # | Method | Path | Auth | Handler location | Purpose |
|---|---|---|---|---|---|
| 1 | POST | `/register/generate-otp` | None | `routes/auth.js:14` | Create or update a user and email an OTP |
| 2 | POST | `/register/verify-otp` | None | `routes/auth.js:39` | Verify the OTP and complete registration |
| 3 | POST | `/register` | None | `index.js:181` | Legacy direct registration (no OTP) |
| 4 | POST | `/login` | None | `index.js:209` | Log in and receive a JWT |
| 5 | GET | `/health` | None | `index.js:146` | Health check |
| 6 | POST | `/admin/send-daily-report` | Token | `index.js:79` | Send the daily report to all users |
| 7 | POST | `/admin/test-email` | Token | `index.js:93` | Send a test email |
| 8 | POST | `/admin/send-daily-report/:userId` | Token + admin | `index.js:114` | Send the report to one user |
| 9 | POST | `/send-messages` | **None** | `index.js:149` | SMS broadcast to all users |
| 10 | GET | `/foods` | Token | `index.js:254` | List local food items |
| 11 | GET | `/foods/random` | None | `index.js:269` | Random local food items |
| 12 | GET | `/foods/:name` | Token | `index.js:281` | Search local food items by name |
| 13 | POST | `/track` | Token | `index.js:306` | Log a food item |
| 14 | GET | `/track/:userid/:date` | **None** | `index.js:352` | A user's food log for a date |
| 15 | GET | `/user/:userId/posts` | None | `index.js:405` | A user's posts |
| 16 | GET | `/posts/:postId` | None | `index.js:421` | One post |
| 17 | POST | `/posts` | **None** | `index.js:439` | Create a post with an image |
| 18 | POST | `/upload_profile_photo` | **None** | `index.js:473` | Upload or replace a profile photo |
| 19 | GET | `/upload_profile_photo/:userId` | None | `index.js:550` | Get a profile photo |
| 20 | POST | `/userinfo` | Token | `index.js:572` | Create or update the profile |
| 21 | POST | `/water_intake` | Token | `index.js:609` | Add water for a date |
| 22 | GET | `/water_intake/:userId/:date` | Token | `index.js:626` | Water total for a date |
| 23 | GET | `/userinfo/:userId` | Token | `index.js:636` | Get the profile |
| 24 | GET | `/posts` | None | `index.js:659` | Up to 5 random posts |
| 25 | POST | `/generateMeal` | **None** | `index.js:679` | Edamam recipe search proxy |
| 26 | DELETE | `/posts/:id` | **None** | `index.js:165` | Delete a post |

**Totals:** 10 endpoints use `verifyToken`; 16 do not. Of those 16, five are public by nature (#1–#5).

**Called by the frontend but not existing in the backend:** `GET /api/slots`, `POST /api/book-slot/:id`, `POST /api/unblock-slot/:id` (`SlotBooking.jsx`).

---

## 7.2 Authentication

### 1. `POST /register/generate-otp`
Creates the user document if it does not exist, sets a new 6-digit OTP valid for 5 minutes, saves it and emails it.

```http
POST /register/generate-otp
Content-Type: application/json

{ "email": "user@example.com" }
```
| Case | Status | Body |
|---|---|---|
| Success | 200 | `{ "success": true, "message": "OTP generated & sent" }` |
| No email | 200 | `{ "success": false, "message": "Email is required" }` |
| Error (for example, email sending failed) | 200 | `{ "success": false, "message": "<error message>" }` |

### 2. `POST /register/verify-otp`
```http
POST /register/verify-otp
Content-Type: application/json

{ "name": "Asha", "email": "user@example.com", "password": "<password>", "age": 21, "otp": "123456" }
```
| Case | Status | Body |
|---|---|---|
| Success | 200 | `{ "success": true, "message": "User registered successfully" }` |
| Unknown email | 200 | `{ "success": false, "message": "User not found" }` |
| Wrong or expired OTP | 200 | `{ "success": false, "message": "Invalid or expired OTP" }` |
| Error | 200 | `{ "success": false, "message": "Server error" }` |

On success the password is hashed (bcrypt, cost 10), `isVerified` becomes `true`, and the OTP fields are cleared.

### 3. `POST /register` (legacy)
Body: the user fields (`name`, `email`, `password`, `age`). The whole body is passed to `userModel.create`.
| Case | Status | Body |
|---|---|---|
| Success | 201 | `{ "message": "User Registered" }` |
| DB error (for example, duplicate email) | 500 | `{ "message": "Some Problem" }` |
| Hashing error (for example, missing password) | **no response** (the request hangs) | — |

The frontend does not use this route. It allows registration without OTP verification.

### 4. `POST /login`
```http
POST /login
Content-Type: application/json

{ "email": "user@example.com", "password": "<password>" }
```
| Case | Status | Body |
|---|---|---|
| Success | 200 | `{ "message": "Login Success", "token": "<JWT>", "userid": "<ObjectId>", "name": "Asha" }` |
| Wrong password (also an unverified user with no password) | 403 | `{ "message": "Incorrect password" }` |
| Unknown email | 404 | `{ "message": "User not found" }` |
| DB error | 500 | `{ "message": "Some Problem" }` |

The JWT payload is `{ email, iat }`. It has no expiry.

### 5. `GET /health`
`200 { "status": "ok", "timestamp": "<ISO date>" }`

---

## 7.3 Admin and messaging

### 6. `POST /admin/send-daily-report` (Token)
Runs `generateDailyReport()` for every user (yesterday's data).
`200 { "message": "Daily report triggered" }` or `500 { "message": "Failed to run daily report" }`. Any valid token can call it.

### 7. `POST /admin/test-email` (Token)
Body (optional): `{ "to": "someone@example.com" }`. If it is missing, `req.user.email` is used.
| Case | Status | Body |
|---|---|---|
| Sent | 200 | `{ "message": "Test email sent", "info": { ...nodemailer info } }` |
| No recipient | 400 | `{ "message": "No recipient provided and token has no email" }` |
| SMTP verify failed | 500 | `{ "message": "Transporter verification failed", "error": "<message>" }` |
| Send failed | 500 | `{ "message": "Failed to send test email", "error": "<message>" }` |

### 8. `POST /admin/send-daily-report/:userId?forDate=<date>` (Token + admin)
Allowed only if the token's `email` is listed in the `ADMIN_EMAILS` environment variable. The "own report" check never passes, because the token holds no user ID.
`200 { "message": "Report sent", "result": { ...nodemailer info } }`, `403 { "message": "Not authorized to send report for this user" }`, or `500 { "message": "<error>" }`.

### 9. `POST /send-messages` (no auth)
Body: `{ "message": "text" }`. Sends the text by SMS to every profile with a contact number.
`200 "Messages sent successfully."` (plain text), `400 "Message content is required."`, `500 "Server error"`.
Because `sendMessageToAllUsers` catches its own errors, the route returns 200 even when Twilio sending fails.

---

## 7.4 Local food database (not used by the UI)

### 10. `GET /foods` (Token)
`200 [ { _id, name, imageUrl, calories, protein, carbohydrates, fat, fiber, createdAt, updatedAt } ]`, or `500 { "message": "Some Problem while getting info" }`.

### 11. `GET /foods/random?count=5`
Picks a random start position and returns up to `count` items (default 5) from there, so it can return fewer than requested. `500 { "message": "Error fetching random meals" }` on error.

### 12. `GET /foods/:name` (Token)
Case-insensitive regex search on `name`, using the raw URL value as the regex.
`200 [ ...foods ]`, `404 { "message": "Food Item Not Fund" }` (sic), `500 { "message": "Some Problem in getting the food" }`.

---

## 7.5 Meal tracking

### 13. `POST /track` (Token)
```http
POST /track
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "userId": "<ObjectId>",
  "foodId": "k3j9x0a1b",
  "foodName": "Apple",
  "details": { "calories": "78.00", "protein": "0.39", "carbohydrates": "20.72", "fat": "0.26", "fiber": "3.60" },
  "quantity": 150
}
```
- **Date handling:** `eatenDate` is optional. If present, as `eatenDate` or `date`, it is normalised to `DD-MM-YYYY`; if not, today's server date is used.
- **Body is stored as-is:** the whole body is passed to `create`, so extra fields are stored only if they exist in the schema.
- **Responses:** `201` with the created document. Validation errors (for example, a missing `foodName`) go to the central handler and return `500 { "message": "<validation message>" }`.

### 14. `GET /track/:userid/:date` (no auth)
`:date` may be `DD-MM-YYYY`, `D/M/YYYY`, `YYYY-MM-DD` or anything `Date` can parse. Any value whose first number is 31 or less is read as **day first**.
- **Response:** `200 [ { ...tracking, "userId": { full User document } } ]`. The populated user includes `password`, `otp` and `otpExpiry` (security issue S-01).
- **Errors:** `400 { "message": "Invalid date format" }`.

> The frontend sends `M-D-YYYY` here (`Diet.jsx:27`, `Profile.jsx:112`), which this parser reads as `D-M-YYYY`. See [Known limitations](12-known-limitations.md).

---

## 7.6 Profile

### 20. `POST /userinfo` (Token)
Accepts these fields and ignores any others: `firstName, lastName, age, height, weight, bloodGroup, email, contactNumber, activityLevel, allergies, healthConditions, fitnessGoal, dietaryPreferences, foodPreferences, hobbies, bmi, dailyCalorieRequirement, userId`. Upserts by `userId`; validators do not run.
- **Success:** `200` with the updated or created document.
- **Missing user ID:** `400 { "message": "User ID is required" }`.
- **Duplicate email:** `400 { "message": "Email already exists" }`. This only happens if a unique email index exists in the database; the schema's `unique` is commented out.
- **Other errors:** `500 { "message": "Something went wrong" }`, for example a CastError when `dailyCalorieRequirement` is text.

### 23. `GET /userinfo/:userId` (Token)
`200` profile document · `404 { "message": "User not found" }` · `500 { "message": "Something went wrong" }`.

---

## 7.7 Water intake

### 21. `POST /water_intake` (Token)
```json
{ "userId": "<ObjectId>", "date": "2026-11-22", "waterConsumed": 0.2 }
```
- **Adds to existing record:** if a record for `{ userId, date }` exists, `waterConsumed` is **added** to it and `200` is returned with the document.
- **Creates new record:** otherwise a new document is created and `201` is returned.
- **Missing fields:** `400 { "message": "userId and date are required" }`.

### 22. `GET /water_intake/:userId/:date` (Token)
`200 { "waterConsumed": <number> }`, or `{ "waterConsumed": 0 }` when there is no record.

---

## 7.8 Community posts

### 24. `GET /posts`
Loads all posts, shuffles them with `sort(() => 0.5 - Math.random())`, and returns at most 5. `200 []` if there are none, `500 { "message": "Server error" }`.

### 16. `GET /posts/:postId`
`200` post · `404 { "message": "Post not found" }` · `500 { "message": "Error fetching post", "error": {...} }`.

### 15. `GET /user/:userId/posts`
`200 [ ...posts ]` · `400 { "message": "Invalid user ID" }` (when it is not a valid ObjectId) · `500 { "message": "Error fetching user posts", "error": {...} }`.

### 17. `POST /posts` (no auth, multipart)
```http
POST /posts
Content-Type: multipart/form-data

userId=<ObjectId>
title=My breakfast
content=Oats with fruit
image=<file, max 10 MB>
```
- **Success:** `200 { "message": "Profile photo uploaded successfully!", "savedPhoto": { ...post } }`. The message text is copied from the photo route.
- **Missing fields:** `400 { "message": "User ID and image are required!" }` when any of `userId`, `image`, `title` or `content` is missing.
- **Errors:** `500 { "message": "Error uploading profile photo", "error": {...} }`.

### 26. `DELETE /posts/:id` (no auth)
`200 "Post deleted successfully"` · `404 "Post not found"` · `500 "Server error"` (plain-text responses).

---

## 7.9 Profile photos

### 18. `POST /upload_profile_photo` (no auth, multipart)
Fields: `userId`, `image` (file).
- **Photo replaced:** `200 { "message": "Profile photo updated successfully!", "updatedUser": {...} }` when a photo already exists.
- **Photo created:** `200 { "message": "Profile photo uploaded successfully!", "savedPhoto": {...} }` when it does not.
- **Errors:** `400` when a field is missing, `500` on error.

### 19. `GET /upload_profile_photo/:userId`
`200 { "message": "Profile photo fetched successfully!", "image": "<base64>" }` · `404 { "message": "Profile photo not found!" }` · `500`.

---

## 7.10 Recipes

### 25. `POST /generateMeal` (no auth)
```json
{ "dietPreference": "vegetarian", "calories": 2000, "totalMeals": 7, "healthSpec": "vegetarian" }
```
Builds `https://api.edamam.com/search?q=...&app_id=...&app_key=...&from=0&to=...` with server-side keys. If `dietPreference` is empty, `q` defaults to `"meal"`, and `to` defaults to 7.
| Case | Status | Body |
|---|---|---|
| Success | 200 | `{ "hits": [ ...Edamam recipe hits ] }` |
| Keys missing | 500 | `{ "message": "Server misconfiguration: Edamam keys missing" }` |
| Edamam error | 502 | `{ "message": "Edamam error: <message>" }` |
| Network error | 500 | `{ "message": "Failed to fetch meal plan from Edamam" }` |

No frontend code calls this endpoint.

---

## 7.11 Common error format

- **Central handler:** routes wrapped in `asyncHandler` send unhandled errors to the central handler, which responds `{ "message": "<err.message>" }` with `err.status` or 500.
- **Unknown routes:** Express's default HTML 404 page.
- **No consistent envelope:** responses do not share one format (some send plain text, some `{ message }`, the auth router `{ success, message }`).

Next: [Authentication and OTP flow](08-authentication-and-otp-flow.md)
