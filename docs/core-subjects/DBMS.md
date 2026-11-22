# Database Management Systems (DBMS) in Smart Nutrition Tracker

**Strength of mapping: strong.** The project uses MongoDB (a NoSQL document database) through the Mongoose ODM, with 8 schemas and typical CRUD patterns. The schema details are in [06-database-design.md](../06-database-design.md).

## 1. Concepts used

### 1.1 NoSQL document model
Data is stored as BSON documents in collections, not as rows in tables. A document can contain nested objects:
```js
// backend/models/trackingModel.js
details: { calories: Number, protein: Number, carbohydrates: Number, fat: Number, fiber: Number }
```
This is an **embedded sub-document**: the nutrients live inside the tracking document, so one read returns everything.

### 1.2 Schema and data types
MongoDB itself is schema-less. Mongoose adds an application-level schema with types (`String`, `Number`, `Date`, `Boolean`, `ObjectId`) and casts values. For example, `"78.00"` sent by `Track.jsx` is stored as the number `78`.

### 1.3 Constraints (integrity rules)
| Constraint | Example | File |
|---|---|---|
| NOT NULL equivalent | `required: true` on `email`, `foodName`, `quantity` | `userModel.js`, `trackingModel.js` |
| UNIQUE | `email: { unique: true }` | `userModel.js:5` |
| CHECK (range) | `age: { min: 12 }`, `quantity: { min: 1 }` | `userModel.js:7`, `trackingModel.js:40` |
| CHECK (domain) | `enum: ['Sedentary', 'Lightly Active', ...]` | `UserInfoModel.js:48` |
| CHECK (pattern) | `contactNumber: { match: /^\d{10}$/ }` | `UserInfoModel.js:43` |
| DEFAULT | `isVerified: { default: false }`, `eatenDate` default function | `userModel.js:10`, `trackingModel.js:30` |

These constraints apply on `create` and `save`. They are **not** applied by `findOneAndUpdate` unless `runValidators: true` is set, and `POST /userinfo` does not set it (`index.js:591-595`).

### 1.4 Keys and relationships
- **Primary key:** every document has `_id` (an ObjectId), indexed and unique.
- **Foreign-key-like references:** `userId: { type: ObjectId, ref: 'User' }` in trackings, userinfos, waterintakes, posts and profilephotos.
- **Cardinality:** User 1:N Tracking, 1:N Post, 1:N WaterIntake; User 1:1 UserInfo and 1:1 ProfilePhoto (intended).
- **Not enforced by the database:** MongoDB has no foreign key constraints or cascades.

See the [ER diagram](../diagrams/svg/02-database-er-diagram.svg).

### 1.5 Joins with `populate`
```js
// backend/index.js:384
trackingModel.find({ userId: userid, eatenDate: strDate }).populate('userId').populate('foodId');
```
`populate('userId')` runs a second query and replaces the ID with the user document, which is the application-level equivalent of a SQL `JOIN`. `foodId` has no `ref`, so populating it has no effect. Populating the full user document also exposes the password hash, a projection mistake (see [SECURITY.md](../../SECURITY.md)).

### 1.6 Indexes
- `_id` (default) and `users.email` (unique) are the only indexes.
- **Missing compound index:** queries such as `{ userId, eatenDate }` would benefit from a compound index; without it the database scans every document in the collection.

### 1.7 CRUD operations
| Operation | Mongoose call | Example |
|---|---|---|
| Create | `Model.create()`, `new Model().save()` | `trackingModel.create(toCreate)` (`index.js:344`) |
| Read | `find`, `findOne`, `findById`, `countDocuments` | `UserinfoModel.findOne({ userId })` (`index.js:646`) |
| Update | `save()` on a changed document, `findOneAndUpdate` | `existing.save()` (`index.js:617`) |
| Delete | `findByIdAndDelete` | `postModel.findByIdAndDelete(postId)` (`index.js:169`) |
| Upsert | `findOneAndUpdate(filter, update, { upsert: true })` | `POST /userinfo` (`index.js:591-595`) |
| Pattern search | `$regex` with `$options: 'i'` | `GET /foods/:name` (`index.js:285`) |
| Skip / limit | `.skip(n).limit(k)` | `GET /foods/random` (`index.js:274`) |

### 1.8 Denormalisation
Each tracking entry stores `foodName` and the scaled nutrient values instead of referencing a food record. This is intentional: the source is an external API, history must not change, and reading a day's log needs no join.

### 1.9 Timestamps (audit columns)
`{ timestamps: true }` adds `createdAt` and `updatedAt` automatically to users, userinfos, trackings, waterintakes, posts, foods and physicals.

### 1.10 Concurrency anomaly (lost update)
`POST /water_intake` reads the record, adds in application code, then saves (`index.js:614-622`). Two concurrent requests can cause a **lost update** or a **duplicate insert**, classic concurrency anomalies. The atomic alternative is:
```js
await WaterModel.updateOne({ userId, date }, { $inc: { waterConsumed: amount } }, { upsert: true });
```

## 2. Concepts not implemented

| Concept | Status | Where it would help |
|---|---|---|
| Transactions (ACID across documents) | Not used | Creating a user and a profile together |
| Aggregation pipeline | Not used; totals are summed in JavaScript | `$match` + `$group` to compute daily totals in the database |
| Compound and secondary indexes | Not defined | `{ userId: 1, eatenDate: 1 }`, unique `{ userId: 1, date: 1 }` |
| Referential integrity / cascade delete | Not enforced; there is no delete-account feature | Removing a user's data when the account is deleted |
| Normalisation (1NF–3NF) | Not applied formally (document model) | Discussed as a trade-off against denormalisation |
| Pagination | Not implemented | `GET /posts` should use `skip`/`limit` or cursor pagination |
| Projection to hide fields | Not used | `select: false` on `password` and `otp` |
| Proper date types | Dates stored as text | Store `Date` values in UTC to allow range queries |
| `$sample` for random documents | Not used | Replace the in-memory shuffle in `GET /posts` |
| Backups / replication settings | Managed by the database host (not in repository) | — |

## 3. Interview questions

**Q1. Why MongoDB instead of MySQL?**
The data is naturally document-shaped (a meal with its nutrients, a profile with many optional fields), the schema changed often during development, and it fits a JavaScript stack well. A relational database would give stronger integrity (foreign keys, transactions) and easier reporting with SQL. For this size of app, either would work.

**Q2. What is the difference between embedding and referencing? Where do you use each?**
Embedding stores related data inside one document; referencing stores an ID that points to another document. I **embed** the nutrient `details` inside each tracking entry, because they are always read together. I **reference** the user with `userId`, because users are shared by many collections and change independently.

**Q3. What does `populate` do internally?**
It runs a separate query for the referenced IDs and swaps the IDs for documents in the result. It is not a database-side join (unlike `$lookup`), so it costs an extra round trip.

**Q4. Which indexes would you add and why?**
`trackings { userId: 1, eatenDate: 1 }`, because both the Diet page and the nightly report filter by exactly these fields. Also a unique `waterintakes { userId: 1, date: 1 }` to stop duplicate daily records, and a unique `userinfos { userId: 1 }`.

**Q5. What is an upsert? What is the catch in your code?**
An update that inserts the document if nothing matches. In `POST /userinfo` I upsert without `runValidators: true`, so enum and required rules are skipped. That is how the invalid value `"Maintain Weight"` gets stored.

**Q6. Explain the race condition in water tracking.**
Read-modify-write without atomicity. Two requests read 0.4, both add 0.2, and both save 0.6 instead of 0.8 (a lost update). If no record exists yet, both may insert one (duplicates). `$inc` with `upsert`, plus a unique index, solves it.

**Q7. Does MongoDB support transactions?**
Yes. Multi-document ACID transactions have been supported on replica sets since MongoDB 4.0, and Mongoose exposes them through sessions. I don't use them; every operation in the app touches a single document, and single-document writes are atomic.

**Q8. How would you compute the daily totals in the database instead of JavaScript?**
```js
trackingModel.aggregate([
  { $match: { userId: new mongoose.Types.ObjectId(id), eatenDate: '22-11-2026' } },
  { $group: { _id: null, calories: { $sum: '$details.calories' }, protein: { $sum: '$details.protein' } } }
]);
```

**Q9. Why is storing dates as text a problem?**
`"22-11-2026"` sorts as text, not by date. Range queries ("last 7 days") are hard, and the project uses two formats (`DD-MM-YYYY` for meals, `YYYY-MM-DD` for water), which has already caused a bug. A `Date` in UTC with time-zone conversion in the UI is safer.

**Q10. What are ACID properties?**
- **Atomicity:** all or nothing.
- **Consistency:** rules hold before and after.
- **Isolation:** concurrent transactions don't interfere.
- **Durability:** committed data survives crashes.

In this project, single-document writes are atomic, but the water endpoint shows what happens without isolation: the read-then-write sequence loses updates.
