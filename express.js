const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.listen(port, ()=> {
  console.log(`Connected to server on ${port}`)
})

app.get("/", ()=> {
  console.log("Connect to Homepage")
})