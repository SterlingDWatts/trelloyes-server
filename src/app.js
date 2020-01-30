require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const { NODE_ENV } = require("./config");
const cardRouter = require("./card/card-router");
const listRouter = require("./list/list-router");

// create Express app
const app = express();

// log 'tiny' output if in production, else log 'common'
const morganOption = NODE_ENV === "production" ? "tiny" : "common";
app.use(morgan(morganOption));

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

// Routes
app.use(cardRouter);
app.use(listRouter);

// GET / endpoint
app.get("/", (req, res) => {
  res.send("Hello, world!");
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
