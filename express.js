const express = require("express");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

/* =====================
   DATABASE CONNECTION
===================== */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("Database connection error:", err));

/* =====================
   ROUTES
===================== */

app.get("/", (req, res) => {
  res.send("Server running with database");
});

/* =====================
   SERVER START
===================== */

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
// install express,dotenv,mongodb,nodemon

app.post("/streakCounter", async (req, res) => {
  try {
    await client.connect();
    const dbStreaks = client.db("streaksCounter")
    const streaks = db.collection("streaks");

    const result = await streaks.insertOne({
      streak: req.body.streakNumber
    })

    console.log(req.body)

    res.json ({ message: "streak saved"})
  } catch(err) {
      console.error(err)
      res.status(500).json({ error: "server error"})
    }
})