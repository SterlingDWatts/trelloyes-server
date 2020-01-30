require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const winston = require("winston");
const { NODE_ENV } = require("./config");

// create Express app
const app = express();

// log 'tiny' output if in production, else log 'common'
const morganOption = NODE_ENV === "production" ? "tiny" : "common";
app.use(morgan(morganOption));

// log all "info" events with winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "info.log" })]
});

if (NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple()
    })
  );
}

// hide sensitive data with 'helmet' and allow cors
app.use(helmet());
app.use(cors());

//  validate authorization header with API token
app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const authToken = req.get("Authorization");

  if (!authToken || authToken.split(" ")[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: "Unauthorized request" });
  }

  next();
});

// Create Arrays to store cards and lists
const cards = [{ id: 1, title: "Task One", content: "This is card one" }];
const lists = [{ id: 1, header: "List One", cardIds: [1] }];

// basic endpoint for app.js
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

// GET /card endpoint returns array of cards
app.get("/card", (req, res) => {
  res.json(cards);
});

// GER /card/:id endpoint returns the card with matching ID
app.get("/card/:id", (req, res) => {
  const { id } = req.params;
  const cards = cards.find(c => c.id == id);

  // make sure we found a card
  if (!card) {
    logger.error(`Card with id ${id} not found.`);
    return res.status(400).send("Card Not Found");
  }

  res.json(card);
});

// GET /list endpoint returns array of lists
app.get("/list", (req, res) => {
  res.json(lists);
});

// error handling middleware gives short response if in production
app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

// export the app
module.exports = app;
