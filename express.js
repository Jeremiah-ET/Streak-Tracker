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

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
