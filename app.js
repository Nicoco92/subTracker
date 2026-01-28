const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const subRoutes = require("./routes/subRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { attachUser } = require("./middleware/auth");
const plaidRoutes = require("./routes/plaidRoutes");
const initNotificationService = require("./services/notificationService");

connectDB();

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const sessionOptions = {
  secret: process.env.SESSION_SECRET || "dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
};

if (process.env.MONGO_URI) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
  });
}

app.use(session(sessionOptions));
app.use(attachUser);
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use("/auth", authRoutes);
app.use("/subscriptions", subRoutes);
app.use("/dashboard", subRoutes); 
app.use("/api/ai", aiRoutes);
app.use("/api/plaid", plaidRoutes);
app.get("/", (req, res) => {
  res.redirect("/subscriptions");
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).send("Internal Server Error");
});

initNotificationService();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SubTracker running on http://localhost:${PORT}`);
});
