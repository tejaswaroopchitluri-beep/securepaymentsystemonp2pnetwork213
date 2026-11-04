const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());

app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }), require("./routes/auth_routes"));
app.use("/api/users", require("./routes/users_route"));
app.use("/api/wallet", require("./routes/wallet_routes"));
app.use("/api/transactions", rateLimit({ windowMs: 60 * 1000, max: 20 }), require("./routes/transaction_routes"));
app.use("/api/admin", require("./routes/admin_route"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.listen(process.env.PORT || 5000, () => console.log("Server running"));