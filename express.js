const express = require("express");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = process.env.MONGOURL;

if (!uri) {
  console.error("MONGOURL is missing. Check your .env file.");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let streaksCollection;

async function startServer() {
  // connect once
  await client.connect();
  console.log("Connected to MongoDB");

  // pick database + collection once
  const db = client.db("streaksCounter");
  streaksCollection = db.collection("streaks");

  // routes
  app.get("/", (req, res) => {
    res.send("Server running with database");
  });

  app.post("/streakCounter", async (req, res) => {
    try {
      const { streak } = req.body;

      if (typeof streak !== "number") {
        return res.status(400).json({ error: "streak must be a number" });
      }

      const result = await streaksCollection.insertOne({
        streak,
        createdAt: new Date(),
      });

      res.json({ message: "streak saved", id: result.insertedId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  });

  app.post("/api/sync", async (req, res) => {
    try {
      const { clientId, streak, history, tasks, lastStreakDay } = req.body || {};

      if (!clientId || typeof clientId !== "string") {
        return res.status(400).json({ error: "clientId is required" });
      }

      const payload = {
        clientId,
        streak: typeof streak === "number" ? streak : 0,
        history: Array.isArray(history) ? history : [],
        tasks: Array.isArray(tasks) ? tasks : [],
        lastStreakDay: typeof lastStreakDay === "string" ? lastStreakDay : null,
        updatedAt: new Date(),
      };

      await streaksCollection.updateOne(
        { clientId },
        { $set: payload, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );

      res.json({ message: "sync saved" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  });

  app.get("/api/sync", async (req, res) => {
    try {
      const { clientId } = req.query;
      if (!clientId) {
        return res.status(400).json({ error: "clientId is required" });
      }
      const doc = await streaksCollection.findOne(
        { clientId },
        { projection: { _id: 0, clientId: 1, streak: 1, history: 1, tasks: 1, lastStreakDay: 1, updatedAt: 1 } }
      );
      res.json(doc || {});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server error" });
    }
  });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
