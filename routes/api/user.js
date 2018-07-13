const debug = require("debug")("evolvus-platform-server:routes:api:user");
const _ = require("lodash");
const user = require("evolvus-user");

const LIMIT = process.env.LIMIT || 10;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const entityIdHeader = "X-ENTITY-ID";
const accessLevelHeader = "X-ACCESS-LEVEL"
const PAGE_SIZE = 10;
const ORDER_BY = process.env.ORDER_BY || {
  lastUpdatedDate: -1
};

const userAttributes = ["tenantId", "entityId", "accessLevel", "applicationCode", "contact", "role", "userId", "designation", "userName", "userPassword", "saltString", "enabledFlag", "activationStatus", "processingStatus", "createdBy", "createdDate", "lastUpdatedDate", "deletedFlag", "token",
  "masterTimeZone", "masterCurrency", "dailyLimit", "individualTransactionLimit", "loginStatus"
];
const filterAttributes = user.filterAttributes;
const sortAttributes = user.sortAttributes;

module.exports = (router) => {

  router.route('/user/')
    .get((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const accessLevel = req.header(accessLevelHeader);
      const entityId = req.header(entityIdHeader);
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      debug("query: " + JSON.stringify(req.query));
      var limit = _.get(req.query, "limit", LIMIT);
      var pageSize = _.get(req.query, "pageSize", PAGE_SIZE);
      var pageNo = _.get(req.query, "pageNo", 1);
      var skipCount = (pageNo - 1) * pageSize;
      var filterValues = _.pick(req.query, filterAttributes);
      var filter = _.omitBy(filterValues, function(value, key) {
        return value.startsWith("undefined");
      });
      var orderby = sortable(sort);

      try {
        Promise.all([user.find(tenantId, entityId, accessLevel, createdBy, ipAddress, filter, orderby, skipCount, +pageSize), user.find(tenantId, entityId, accessLevel, createdBy, ipAddress, filter, orderby, 0, 0)])
          .then((result) => {
            if (result[0].length > 0) {
              response.status = "200";
              response.description = "SUCCESS";
              response.totalNoOfPages = Math.ceil(result[1].length / pageSize);
              response.totalNoOfRecords = result[1].length;
              response.data = result[0];
              res.status(200)
                .send(JSON.stringify(response, null, 2));
            } else {
              response.status = "200";
              response.data = [];
              response.totalNoOfRecords = result[1].length;
              response.totalNoOfPages = 0;
              response.description = "No Users added yet. Create a new User to start off";
              debug("response: " + JSON.stringify(response));
              res.status(200)
                .send(JSON.stringify(response, null, 2));
            }
          }).catch((e) => {
            debug(`failed to fetch all Users ${e}`);
            response.status = "400";
            response.description = `Unable to fetch all Users due to ${e}`;
            response.data = e.toString();
            res.status(400).send(JSON.stringify(response, null, 2));
          });
      } catch (e) {
        response.status = "400";
        response.description = `Unable to fetch all Users due to ${e}`;
        response.data = e.toString();
        res.status(400).send(JSON.stringify(response, null, 2));
      }
    });

  router.route("/user/")
    .post((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const accessLevel = req.header(accessLevelHeader);
      const entityId = req.header(entityIdHeader);
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      try {
        let object = _.pick(req.body, userAttributes);
        object.tenantId = tenantId;
        object.createdDate = new Date().toISOString();
        object.lastUpdatedDate = object.createdDate;
        object.createdBy = createdBy;
        object.userPassword = "evolvus*123";
        object.applicationCode = object.role.applicationCode;
        user.save(tenantId, ipAddress, createdBy, accessLevel, object).then((savedUser) => {
          response.status = "200";
          response.description = `New User '${req.body.userName}' has been added successfully and sent for the supervisor authorization.`;
          response.data = savedUser;
          res.status(200)
            .send(JSON.stringify(response, null, 2));
        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to add new User '${req.body.userName}'. Due to '${e}'`;
          response.data = {};
          res.status(400)
            .send(JSON.stringify(response, null, 2));
        });
      } catch (e) {
        response.status = "400";
        response.description = `Unable to add new User '${req.body.userName}'. Due to '${e}'`;
        response.data = {};
        res.status(400)
          .send(JSON.stringify(response, null, 2));
      }
    });

  router.route("/user/:userId")
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const accessLevel = req.header(accessLevelHeader);
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      debug("query: " + JSON.stringify(req.query));
      try {
        let body = _.pick(req.body, userAttributes);
        body.tenantId = tenantId;
        body.updatedBy = req.header(userHeader);
        body.lastUpdatedDate = new Date().toISOString();
        body.processingStatus = "PENDING_AUTHORIZATION";
        body.applicationCode = body.role.applicationCode;
        user.update(tenantId, req.params.userId, body, accessLevel).then((updatedUser) => {
          response.status = "200";
          response.description = `'${req.params.userId}' User has been modified successfully and sent for the supervisor authorization.`;
          response.data = `'${req.params.userId}' User has been modified successfully and sent for the supervisor authorization.`;
          res.status(200)
            .send(JSON.stringify(response, null, 2));
        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to modify User ${req.params.userId} . Due to  ${e}`;
          response.data = `Unable to modify User ${req.params.userId} . Due to  ${e}`;
          res.status(400).send(JSON.stringify(response, null, 2));
        });
      } catch (e) {
        response.status = "400";
        response.description = `Unable to modify User ${req.params.userId} . Due to  ${e}`;
        response.data = e.toString();
        res.status(400).send(JSON.stringify(response, null, 2));
      }
    });
};

function sortable(sort) {
  if (typeof sort === 'undefined' ||
    sort == null) {
    return ORDER_BY;
  }
  if (typeof sort === 'string') {
    var values = sort.split(",");
    var result = sort.split(",")
      .reduce((temp, sortParam) => {
        if (sortParam.charAt(0) == "-") {
          return _.assign(temp, _.fromPairs([
            [sortParam.replace(/-/, ""), -1]
          ]));
        } else {
          return _.assign(_.fromPairs([
            [sortParam.replace(/\ /, ""), 1]
          ]));
        }
      }, {});
    return result;
  } else {
    return ORDER_BY;
  }
}