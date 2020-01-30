require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const uuid = require("uuid/v4");
const { NODE_ENV } = require("./config");
const cardRouter = require("./card/card-router");

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

const lists = [{ id: 1, header: "List One", cardIds: [1] }];

// GET / endpoint
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

// /card endpoint
app.use(cardRouter);

// GET /list endpoint returns array of lists
app.get("/list", (req, res) => {
  res.json(lists);
});

// GET /list/id endpoint returns list with matching ID
app.get("/list/id", (req, res) => {
  const { id } = req.params;
  const list = lists.find(li => li.id == id);

  // make user we found a list
  if (!list) {
    logger.error(`List with id ${id} not found`);
    return res.status(404).send("List Not Found");
  }

  res.json(list);
});

// POST /list endpoint
app.post("/list", (req, res) => {
  const { header, cardIds = [] } = req.body;

  if (!header) {
    logger.error(`Header is required`);
    return res.status(400).send("Invalid data");
  }

  // check card IDs
  if (cardIds.length > 0) {
    let valid = true;
    cardIds.forEach(cid => {
      const card = cards.find(c => c.id == cid);
      if (!card) {
        logger.error(`Card with id ${cid} not found in cards array.`);
        valid = false;
      }
    });

    if (!valid) {
      return res.status(400).send("Invalid data");
    }
  }

  // get an id
  const id = uuid();

  const list = {
    id,
    header,
    cardIds
  };

  lists.push(list);

  logger.info(`List with id ${id} created`);

  res
    .status(201)
    .location(`http://localhost:8000/list/${id}`)
    .json({ id });
});

app.delete("/list/:id", (req, res) => {
  const { id } = req.params;

  const listIndex = lists.findIndex(li => li.id == id);

  if (listIndex === -1) {
    logger.error(`List with id ${id} not found.`);
    return res.status(404).send("Not Found");
  }

  lists.splice(listIndex, 1);

  logger.info(`List with id ${id} deleted.`);
  res.status(204).end();
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
