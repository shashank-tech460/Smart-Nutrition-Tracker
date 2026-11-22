# Data Structures and Algorithms (DSA) in Smart Nutrition Tracker

**Strength of mapping: light to moderate.** The project does not implement classic algorithms such as sorting, graphs or dynamic programming by hand. It does use core data structures (arrays, objects as hash maps, `Map`), linear-time aggregation, string parsing, randomised selection and cryptographic hashing. Several of these offer good discussion points about complexity and correctness.

## 1. Concepts used

### 1.1 Arrays and higher-order functions
- **Searching posts by title:** `posts.filter(post => post.title.toLowerCase().includes(query.toLowerCase()))` (`Community.jsx:19-21`). This is a linear search costing O(n · m), where m is the title length.
- **Rendering lists:** `items.map(...)` renders lists (`Diet.jsx:89`).
- **Fan-out requests:** `foodNames.map(food => fetchFoodDetails(food))` creates one promise per name (`Track.jsx:27`).

### 1.2 Hash map for de-duplication: O(n)
```js
// frontend/src/Components/Track.jsx:32-42
const uniqueFoodDetailsMap = new Map();
foodDetails.forEach(item => {
  if (item) {
    const uniqueKey = `${item.label}-${item.image}-${item.calories}`;
    if (!uniqueFoodDetailsMap.has(uniqueKey)) uniqueFoodDetailsMap.set(uniqueKey, item);
  }
});
const uniqueFoodDetails = Array.from(uniqueFoodDetailsMap.values());
```
- **Complexity:** `Map.has` and `Map.set` are O(1) on average, so de-duplicating n items is O(n) time and O(n) space. Comparing every pair of items would be O(n²).
- **Order:** a `Map` keeps insertion order, so the first occurrence of each item wins.
- **Key design:** a composite key (label + image + calories) means two different foods with the same name stay separate.

### 1.3 Objects as dictionaries
`eatenQuantity` is a plain object keyed by food label: `{ [foodLabel]: grams }` (`Track.jsx:11`, `86-100`). Each food's quantity is looked up in O(1).

### 1.4 Linear aggregation (prefix sum idea)
```js
// backend/Controllers/reportController.js:21-27
activities.forEach(activity => {
  totalCalories += Number(details.calories || 0);
  totalProtein  += Number(details.protein  || 0);
  ...
});
```
One pass over the day's entries computes five totals: O(n) time, O(1) extra space. `Diet.jsx` and `Profile.jsx` do the same on the client.

### 1.5 String parsing (date normalisation)
```js
// backend/index.js:317-333 (simplified)
const s = String(input).trim().replace(/\//g, '-');
const parts = s.split('-').map(Number);
if (parts.length === 3 && parts.every(n => !Number.isNaN(n))) {
  if (parts[0] > 31) { const [y, m, d] = parts; return `${pad(d)}-${pad(m)}-${y}`; }
  const [d, m, y] = parts; return `${pad(d)}-${pad(m)}-${y}`;
}
```
- **Tokenising:** split on a separator and convert each piece to a number.
- **Classification rule:** if the first number is above 31 it must be a year, otherwise it is assumed to be the day.
- **Why it fails:** this rule cannot tell `D-M-YYYY` from `M-D-YYYY` when both numbers are 12 or less, which is the root of bug B-01. Ambiguous input formats cannot be parsed correctly by any rule, so the fix belongs in the data format, not the parser.

### 1.6 Pattern matching with regular expressions
- **Search:** `{ name: { $regex: req.params.name, $options: 'i' } }`, a case-insensitive substring search (`index.js:285`).
- **Validation:** `/^\d{10}$/` for phone numbers and `/.+\@.+\..+/` for emails (`UserInfoModel.js`).
- **Normalisation:** `/[^0-9]/g` strips non-digits from phone numbers (`sendMessage.js:23`).
- **Risk:** user-supplied regex patterns can trigger catastrophic backtracking (ReDoS). The input should be escaped first.

### 1.7 Randomised algorithms
**OTP generation** (`routes/auth.js:9-11`): `Math.floor(100000 + Math.random() * 900000)` gives a uniform integer from 100000 to 999999 (as uniform as `Math.random` allows).

**Random post selection** (`index.js:668`):
```js
const shuffledPosts = posts.sort(() => 0.5 - Math.random());
const selectedPosts = shuffledPosts.slice(0, Math.min(5, posts.length));
```
- **Biased:** a comparator that returns random answers breaks the sorting algorithm's assumptions. Different permutations come out with **unequal** probability.
- **Expensive:** costs O(n log n) and loads all n posts to choose 5.
- **Better options:**
  - **Fisher–Yates shuffle:** O(n), every permutation equally likely.
  - **Partial Fisher–Yates:** O(k) swaps to pick k items.
  - **Database sampling:** `$sample` in MongoDB.
```js
// Fisher–Yates (not in the code; for reference)
for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
```

**Random skip** (`GET /foods/random`, `index.js:272-274`): it picks one random start index r and returns the items from r up to r + count. The items come in a contiguous block, so this is not k independent random picks, and fewer items come back near the end of the collection.

### 1.8 Hashing (cryptographic)
- **bcrypt** (`bcrypt.hash(password, 10)`): a slow, salted, one-way hash. The cost factor 10 means 2¹⁰ rounds of key expansion. It is deliberately slow to resist brute force.
- **HMAC-SHA256** (inside JWT): a keyed hash that produces the signature; any change to the payload changes the signature.

A cryptographic hash is different from a hash *table*: it is a one-way function designed for security, not fast lookup.

### 1.9 Formulas implemented (arithmetic algorithms)
| Formula | Location |
|---|---|
| BMI = w / (h/100)² | `UserInfo.jsx:44-48` |
| Mifflin-St Jeor BMR, × activity factor, ± 500 | `UserInfo.jsx:51-98` |
| Harris–Benedict BMR (non-functional page) | `MealPlanGenerator.jsx:46-51` |
| Nutrient scaling = value × grams / 100 | `Track.jsx:118-122` |
| Percentage = total / goal × 100 | `reportController.js:31`, `Profile.jsx:109` |
| Water goal = weight × 0.03 L | `Profile.jsx:57` |
| Calories burned = (kcal/h ÷ 60) × minutes | `TrackBurnedCalories.jsx:39-44` |
| Relative time ("x days y hours ago") by repeated integer division | `Home.jsx:73-90` |

### 1.10 Complexity summary
| Operation | Time | Notes |
|---|---|---|
| De-duplicate search results | O(n) | `Map` |
| Daily totals | O(n) | one pass |
| Post title search | O(n·m) | linear scan |
| Random 5 posts | O(n log n) + loading all n | could be O(n) or done in the DB |
| DB lookup by `userId` without an index | O(N) collection scan | an index makes it O(log N) |
| DB lookup by `email` | O(log N) | unique B-tree index |

## 2. Concepts not implemented

| Concept | Status | Possible use |
|---|---|---|
| Custom data structures (stack, queue, linked list, tree, heap) | Not used | A queue for outgoing SMS/email; a min-heap for upcoming reminders |
| Sorting algorithms written by hand | Not used (built-in `sort` only) | — |
| Binary search | Not used | Searching a sorted local food list |
| Graphs, dynamic programming, greedy | Not used | A meal planner could be framed as a knapsack (DP) problem: maximise protein within a calorie limit |
| Trie | Not used | Local food-name auto-complete instead of an API call per keystroke |
| Debounce / throttle | Not used | Limit food search requests |
| Caching (LRU) | Not used | Cache food lookups on the server |

## 3. Interview questions

**Q1. Which data structure did you use to remove duplicate search results, and why?**
A JavaScript `Map` keyed by `label-image-calories`. Lookups and inserts are O(1) on average, so the whole pass is O(n) instead of O(n²) for nested comparisons. `Map` also keeps insertion order.

**Q2. What is the time complexity of computing the daily totals?**
O(n) in the number of entries for that day, with O(1) extra space. Each entry is visited once and five running totals are updated.

**Q3. Is `array.sort(() => Math.random() - 0.5)` a correct shuffle?**
No. The comparator gives inconsistent answers, so the result depends on the sort algorithm and some permutations are more likely than others. Fisher–Yates is the correct O(n) uniform shuffle. To pick k items from a database, `$sample` avoids loading everything.

**Q4. Why can the date parser not be fixed just with better code?**
`05-11-2026` is ambiguous: it could be 5 November or 11 May. No parser can decide without extra information. The fix is to agree on one unambiguous format such as ISO `YYYY-MM-DD`, or to send real timestamps.

**Q5. What is the difference between a hash table and a cryptographic hash?**
A hash table uses a fast hash function to place keys in buckets for O(1) average lookup (`Map` in `Track.jsx`). A cryptographic hash (bcrypt, SHA-256) is one-way and collision-resistant, and is built for security. bcrypt is deliberately *slow*.

**Q6. How would you design a meal planner algorithmically?**
As a constrained optimisation, for example a 0/1 knapsack: choose foods that maximise protein (value) while total calories (weight) stay under the user's daily requirement. Dynamic programming solves it in O(n · C), where C is the calorie limit in units. A greedy protein-per-calorie heuristic is faster but not guaranteed optimal.

**Q7. How would you make food search cheaper?**
Debounce input (wait about 300 ms after typing stops), cache results in an LRU cache on the server, and limit the fan-out of parser calls. A trie over a local food list could serve auto-complete in O(length of prefix).

**Q8. What is the complexity of a MongoDB query without an index?**
A collection scan, O(N) in the number of documents. With a B-tree index on the queried fields, it is O(log N) plus the number of matches.
