# 1. Project Overview

## 1.1 What the project is

Smart Nutrition Tracker is a full-stack web application that helps a person:

- **log what they eat** and see calories, protein, carbohydrates, fat and fibre for each item and for the day;
- **calculate their BMI and a suggested daily calorie requirement** from their profile;
- **track water intake** against a goal based on body weight;
- **share posts** (title, text and an image) with other users;
- **receive reminders and summaries**: a nightly email report and meal-time SMS messages;
- **use helper tools** powered by third-party APIs: workout plans, nutrition advice, calories burned by an activity, and recipes from ingredients.

It is built with a JavaScript-only stack: **React (Vite)** for the frontend, **Node.js + Express** for the backend, and **MongoDB (Mongoose)** for storage. This is commonly called a MERN stack.

## 1.2 Who it is for

| Audience | What they use |
|---|---|
| End users | Registration, food tracking, profile, water, community, helper tools |
| Developers and students | A worked example of a MERN app with OTP email, JWT auth, file uploads, cron jobs and third-party APIs |
| Interviewers and reviewers | A real codebase to discuss design choices, trade-offs and improvements |

## 1.3 Scope

**In scope (exists in code):** user accounts with email OTP, JWT login, meal logging, nutrient calculations, profile and BMI, water tracking, community posts, profile photos, email reports, SMS reminders, third-party helper tools.

**Out of scope or not built:** admin dashboard UI, password reset screen, chat, video calls, Google login, mobile app, automated tests, CI/CD. See [Features and implementation status](02-features-and-status.md).

## 1.4 Naming

| Name | Where it appears |
|---|---|
| **Smart Nutrition Tracker** | GitHub repository name; used throughout this documentation |
| **NutriQuest** | `frontend/package.json` (`"name": "nutriquest"`), page footer "© 2024 NutriQuest" (`Footer.jsx`, `Home.jsx:185`), `frontend/README.md` |
| **NutriFy** | `backend/package.json` (`"name": "nutrify"`), test email text (`index.js:105`), localStorage key `nutrify-user` (`App.jsx:30`, `Login.jsx:55`) |

The three names come from different stages of the project and were never unified. The browser tab title is still the Vite template default, "Vite + React" (`frontend/index.html`).

## 1.5 Repository facts

| Item | Value |
|---|---|
| Repository | https://github.com/shashank-tech460/Smart-Nutrition-Tracker |
| Default branch | `main` (the only branch) |
| Commits | 4, all dated 2025-11-04 (see [CHANGELOG](../CHANGELOG.md)) |
| Deployed backend | Render (URL hardcoded in frontend code) |
| Deployed frontend | Not recorded in the repository |
| License | None in the repository |
| Tests | None |

## 1.6 High-level flow

1. A user registers: the backend emails a 6-digit OTP, and the user confirms it.
2. The user logs in and receives a JWT, which the frontend keeps in `localStorage`.
3. The user fills in a profile; the frontend calculates BMI and a calorie goal and saves them.
4. The user searches foods (Edamam via RapidAPI), enters grams, and logs items. The backend stores each item with the date.
5. The Profile page shows calories against the goal, a macronutrient pie chart, and water intake.
6. Every night at 22:00 the backend emails each user a summary of yesterday's intake. At 08:00, 12:00 and 19:00 it sends SMS meal reminders.

Next: [Features and implementation status](02-features-and-status.md)
