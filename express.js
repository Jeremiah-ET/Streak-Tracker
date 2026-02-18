import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "public");

app.use(express.json());
app.use(express.static(publicPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Connected to server on ${port}`);
});
