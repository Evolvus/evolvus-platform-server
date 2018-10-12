// Get all the environment variables
//  The PORT env variable is not set in docker so
//  defaults to 8086

const PORT = process.env.PORT || 8086;
/*
 ** Get all the required libraries
 */

const http = require("http");
const terminus = require("@godaddy/terminus");

const debug = require("debug")("evolvus-platform-server:server");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const connection = require("@evolvus/evolvus-mongo-dao").connection;

const _ = require("lodash");
const healthCheck = require("@evolvus/evolvus-node-health-check");
const healthCheckAttributes = ["status", "saveTime"];
let body = _.pick(healthCheckAttributes);

const app = express();
const router = express.Router();

var dbConnection = connection.connect("PLATFORM").then((res, err) => {
  if (err) {
    debug(`CONNECTION PROBLEM DUE TO :${err}`);
  } else {
    debug("connected to mongodb");
    body.status = "working";
    body.saveTime = new Date().toISOString();
    healthCheck.save(body).then((ent) => {
      debug("healthcheck object saved");
    }).catch((e) => {
      debug(`unable to save Healthcheck object due to ${e}`);
    });
  }
});

app.use(function(req, res, next) {
  // res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Request-Headers", "*");
  res.header('Access-Control-Allow-Methods', 'GET, POST,PUT, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With,X-HTTP-Method-Override, Content-Type, Accept, Authorization,entityId,tenantId,entityCode,accessLevel");
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
/*
 * Healthcheck and gracefull shutdown..
 */
function onSignal() {
  console.log("server is starting cleanup");
  // start cleanup of resource, like databases or file descriptors
  db.disconnect();
}

function onHealthCheck() {
  // checks if the system is healthy, like the db connection is live
  // resolves, if health, rejects if not
  return new Promise((resolve, reject) => {

    healthCheck.getAll(-1).then((healthChecks) => {
      if (healthChecks.length > 0) {
        resolve("CONNECTION CONNECTED");
        debug("CONNECTION CONNECTED");
      } else {
        reject("CONNECTION PROBLEM");
        debug("CONNECTION PROBLEM");
      }
    }).catch((e) => {
      debug("CONNECTION PROBLEM");
      reject("CONNECTION PROBLEM");
    });
  });
}

const server = http.createServer(app);

terminus(server, {
  signal: "SIGINT",
  healthChecks: {
    "/api/healthcheck": onHealthCheck,
  },
  onSignal
});


server.listen(PORT, () => {
  debug("server started: ", PORT);
  app.emit("application_started");
});

module.exports.app = app;