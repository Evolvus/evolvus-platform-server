// Get all the environment variables
//  The PORT env variable is not set in docker so
//  defaults to 8086

const PORT = process.env.PORT || 8086;
var dbUrl = process.env.MONGO_DB_URL || "mongodb://10.10.69.204:27017/Platform_Dev";

/*
 ** Get all the required libraries
 */
const debug = require("debug")("evolvus-platform-server:server");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");

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
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Request-Headers", "*");
  res.header('Access-Control-Allow-Methods', 'GET, POST,PUT, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With,X-HTTP-Method-Override, Content-Type, Accept, Authorization,entityId,tenantId,accessLevel");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "html");
app.set("views", path.join(__dirname, "views"));


app.use(bodyParser.urlencoded({
  limit: '1mb',
  extended: true
}));

app.use(bodyParser.json({
  limit: '1mb'
}));

require("./routes/main")(router);

app.use("/api", router);

const server = app.listen(PORT, () => {
  debug("server started: ", PORT);
  app.emit('application_started');
});

module.exports.app = app;
