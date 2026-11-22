# Changelog

All notable changes to this project are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project has no version tags yet, so entries are grouped by commit.

## [Unreleased]

### Added
- Project documentation: `README.md`, `SECURITY.md`, `CHANGELOG.md`, the `docs/` folder (16 documents, core-subject deep dives, interview preparation) and 10 architecture diagrams (Mermaid source, SVG and PNG).

### Not changed
- No application source code, dependency or configuration file was modified while writing the documentation.

## 2025-11-04: `aa8f5a8` "fixed error"
### Changed
- `frontend/src/App.jsx`: one-line change (1 insertion, 1 deletion).

## 2025-11-04: `33886ea` "add live backend url"
### Changed
- Replaced the local API base URL with the deployed Render backend URL in 13 frontend components (Community, Diet, Food, Home, Login, MealPlanGenerator, PostCreate, Profile, Register, SlotBooking, Track, UserInfo, ViewPost).

## 2025-11-04: `ba8110b` "added mongodb atlas uri"
### Changed
- `backend/index.js`: the MongoDB connection string is now read from the `MONGO_URI` environment variable instead of being written in the code.

## 2025-11-04: `a38470a` "Initial commit"
### Added
- Express backend with Mongoose models, OTP registration router, JWT middleware, mail service, Twilio SMS broadcast, daily report controller and cron jobs.
- React + Vite frontend with 19 components, routing, user context and styles.

> All four commits are dated the same day, and the page footer says "© 2024". The project was probably developed elsewhere first and uploaded as a single snapshot, so the earlier history is not available.
