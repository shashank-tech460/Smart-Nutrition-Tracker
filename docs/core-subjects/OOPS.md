# Object-Oriented Programming (OOP) in Smart Nutrition Tracker

**Strength of mapping: light.** The project is written in JavaScript in a mostly functional and procedural style. It defines no classes of its own. OOP ideas still appear through the libraries it uses and through how its modules are organised.

## 1. Concepts used

### 1.1 Classes and objects (through Mongoose)
A Mongoose model is a class generated from a schema. Each document is an object (an instance) of that class, with data and methods such as `save()`.

```js
// backend/models/postModel.js
const postSchema = new mongoose.Schema({ userId: {...}, title: {...}, content: {...}, image: {...} }, { timestamps: true });
const postModel = mongoose.model('Post', postSchema);   // a class (constructor function)

// backend/index.js:449-457
const newProfilePhoto = new postModel({ userId, title, content, image });  // object (instance)
const savedPhoto = await newProfilePhoto.save();                             // instance method
```
- **Class-level methods** (like static methods) are used too: `postModel.find()`, `userModel.findOne()`, `trackingModel.create()`.
- **Instance changes and save:** `existing.waterConsumed = ...; await existing.save();` (`index.js:616-617`).

### 1.2 Encapsulation (module pattern)
A Node.js module keeps its variables private and exports only what it chooses.
```js
// backend/services/mailService.js
const transporter = nodemailer.createTransport({...});      // private
const sendOtpEmail = (email, otp) => transporter.sendMail(...);
module.exports = { sendOtpEmail, sendReportEmail, verifyTransporter };  // public interface
```
Callers never touch `transporter` directly. Likewise, `sendMessage.js` hides the Twilio `client` and exposes only `sendMessageToAllUsers`.

### 1.3 Abstraction
- **Mongoose:** hides MongoDB driver details behind `find`, `create` and `populate`.
- **`generateDailyReport()`:** hides the steps of loading users, summing nutrients and sending email behind one call used by both the cron job and the admin route.
- **`verifyToken`:** hides JWT parsing and verification behind a single middleware.

### 1.4 Single shared instance (similar to the Singleton pattern)
Node caches a module after its first `require`, so `mailService.js` creates **one** transporter and `sendMessage.js` **one** Twilio client, shared everywhere. The Mongoose connection is likewise shared by all models. This is not a hand-written Singleton class, but the effect is the same: one shared instance.

### 1.5 Composition
- **React components** are composed from smaller components: pages include `<Header />` and `<Footer />`.
- **Route guard:** `Private.jsx` receives a component as a prop and decides whether to render it:
```jsx
// frontend/src/Components/Private.jsx
return loggedData.loggedUser != null ? <props.Component /> : <Navigate to="/login" />;
```
This prefers composition over inheritance, as React recommends.

### 1.6 Design patterns visible in the code
| Pattern | Where | How |
|---|---|---|
| Chain of Responsibility | Express middleware (`index.js:73-77`, `verifyToken.js`) | Each handler either responds or passes the request on with `next()` |
| Proxy | `POST /generateMeal` (`index.js:679`) | The backend stands in for the Edamam API so keys stay on the server |
| Decorator / wrapper | `asyncHandler` (`index.js:67`) | Wraps a handler to add error forwarding without changing it |
| Observer (event-based) | `server.on('error', ...)`, `process.on('uncaughtException', ...)` (`index.js:727-752`) | Code subscribes to events emitted by the server or process |
| Provider (Context) | `UserContext.Provider` (`App.jsx:45`) | Supplies shared state to any component below it |

## 2. Concepts not implemented

| Concept | Status | How it could be added |
|---|---|---|
| User-defined `class` | Not used anywhere | A `ReportService` or `NutritionCalculator` class grouping related methods |
| Inheritance | Not used | A base `ApiError` class with subclasses `NotFoundError`, `AuthError` carrying an HTTP status |
| Polymorphism | Not used explicitly | A `Notifier` interface with `EmailNotifier` and `SmsNotifier` implementations of `send()` |
| Interfaces / abstract classes | Not available in plain JavaScript; TypeScript not used | Migrate to TypeScript and define interfaces for models and services |
| React class components | All components are functions with hooks | — (functions are the modern recommendation) |
| Mongoose schema methods or statics | Not defined | `userSchema.methods.comparePassword = function (pw) {...}` would move login logic into the model |

## 3. Interview questions

**Q1. Is your project object-oriented?**
Not primarily. JavaScript supports OOP, but I used a functional and module-based style. OOP appears through Mongoose models, which are classes whose instances are documents, through encapsulation in modules like `mailService.js`, and through patterns such as middleware chains. I did not write my own classes or use inheritance.

**Q2. Where do you create objects from a class?**
`new postModel({ userId, title, content, image })` and `new User({ email })` in `routes/auth.js:20` create instances of Mongoose model classes, and I call instance methods like `save()` on them.

**Q3. Give an example of encapsulation.**
`mailService.js` keeps the nodemailer transporter private and exports only `sendOtpEmail`, `sendReportEmail` and `verifyTransporter`. If I switched from Gmail to another provider, only that file would change.

**Q4. How could you use inheritance in this project?**
For errors. A base `AppError extends Error` holding a `status`, with subclasses like `ValidationError(400)` and `UnauthorizedError(401)`. The central error handler at `index.js:737` already reads `err.status`, so throwing these subclasses would give correct status codes everywhere.

**Q5. How could you use polymorphism?**
For notifications. Define `send(user, message)` on both `EmailNotifier` and `SmsNotifier`. The report and reminder jobs would loop over a list of notifiers and call `send` without knowing which type each one is.

**Q6. What is the Chain of Responsibility pattern, and where is it?**
A request passes through a chain of handlers, and each one either handles it or passes it on. Express middleware works this way: `express.json` → `cors` → `morgan` → `verifyToken` → route handler. `verifyToken` can stop the chain with a 401, or call `next()`.

**Q7. Why are there no class components in React?**
Since React 16.8, hooks (`useState`, `useEffect`, `useContext`) give function components state and lifecycle behaviour. They are shorter and easier to reuse, so all 19 components are functions.

**Q8. How would you move login logic into the model (OOP style)?**
Add `userSchema.methods.comparePassword = function (plain) { return bcrypt.compare(plain, this.password); }`. Then the route calls `await user.comparePassword(password)`. The model owns its own behaviour; that is encapsulation.
