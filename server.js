// Get all the environment variables
//  The PORT env variable is not set in docker so
//  defaults to 8080

const PORT = process.env.PORT || 8080;
var dbUrl = process.env.MONGO_DB_URL || "mongodb://localhost:27017/Platform";

/*
 ** Get all the required libraries
 */
const debug = require("debug")("evolvus-platform-server:server");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
const router = express.Router();

mongoose.connect(dbUrl, (err, db) => {
  if (err) {
    debug("Failed to connect to the database");
  } else {
    debug("connected to mongodb");
  }
});
app.use(function(req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  // Pass to next layer of middleware
  next();
});

app.use(bodyParser.urlencoded({
  limit: '1mb',
  extended: true
}));

app.use(bodyParser.json({
  limit: '1mb'
}));

require("./routes/api")(router);

app.use("/", router);

const server = app.listen(PORT, "192.168.1.115", () => {
  debug("server started: ", PORT);
  app.emit('application_started');
});

module.exports.app = app;