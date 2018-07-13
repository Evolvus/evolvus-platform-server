const debug = require("debug")("evolvus-platform-server:routes:api:user");
const _ = require("lodash");
const user = require("evolvus-user");
const entity = require("evolvus-entity")

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
      var sort = _.get(req.query, "sort", {});
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
              debug("response: " + JSON.stringify(response));
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
            response.status = "400";
            response.description = `Unable to fetch all Users due to ${e}`;
            response.data = e.toString();
            debug("failed to fetch all Users" + JSON.stringify(response));
            res.status(400).send(JSON.stringify(response, null, 2));
          });
      } catch (e) {
        response.status = "400";
        response.description = `Unable to fetch all Users due to ${e}`;
        response.data = e.toString();
        debug("caught exception" + JSON.stringify(response));
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
        debug("request body:" + JSON.stringify(req.body));
        let object = _.pick(req.body, userAttributes);
        object.tenantId = tenantId;
        object.createdDate = new Date().toISOString();
        object.lastUpdatedDate = object.createdDate;
        object.createdBy = createdBy;
        object.userPassword = "evolvus*123";
        object.applicationCode = object.role.applicationCode;
        var filter = {
          entityId: object.entityId
        };
        entity.find(tenantId, object.entityId, accessLevel, filter, {}, 0, 1).then((entityObject) => {
          if (!entityObject.length == 0) {
            object.accessLevel = entityObject[0].accessLevel;
            user.save(tenantId, ipAddress, createdBy, object).then((savedUser) => {
              response.status = "200";
              response.description = `New User '${req.body.userName}' has been added successfully and sent for the supervisor authorization.`;
              response.data = savedUser;
              debug("response: " + JSON.stringify(response));
              res.status(200)
                .send(JSON.stringify(response, null, 2));
            }).catch((e) => {
              response.status = "400";
              response.description = `Unable to add new User '${req.body.userName}'. Due to '${e}'`;
              response.data = {};
              debug("failed to save an user" + JSON.stringify(response));
              res.status(400)
                .send(JSON.stringify(response, null, 2));
            });
          } else {
            throw new Error(`No Entity found with id ${req.body.entityId}`);
          }
        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to add new User '${req.body.userName}'. Due to '${e}'`;
          response.data = {};
          debug("failed to save an user" + JSON.stringify(response));
          res.status(400)
            .send(JSON.stringify(response, null, 2));
        });
      } catch (e) {
        response.status = "400";
        response.description = `Unable to add new User '${req.body.userName}'. Due to '${e}'`;
        response.data = {};
        debug("caught exception" + JSON.stringify(response));
        res.status(400)
          .send(JSON.stringify(response, null, 2));
      }
    });

  router.route("/user/:userName")
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
        let object = _.pick(req.body, userAttributes);
        object.updatedBy = req.header(userHeader);
        object.lastUpdatedDate = new Date().toISOString();
        object.processingStatus = "PENDING_AUTHORIZATION";
        object.applicationCode = object.role.applicationCode;
        var filter = {
          entityId: object.entityId
        };
        entity.find(tenantId, object.entityId, accessLevel, filter, {}, 0, 1).then((entityObject) => {
          if (!entityObject.length == 0) {
            object.accessLevel = entityObject[0].accessLevel;
            user.update(tenantId, req.params.userName, object).then((updatedUser) => {
              response.status = "200";
              response.description = `'${req.params.userName}' User has been modified successfully and sent for the supervisor authorization.`;
              response.data = `'${req.params.userName}' User has been modified successfully and sent for the supervisor authorization.`;
              debug("response: " + JSON.stringify(response));
              res.status(200)
                .send(JSON.stringify(response, null, 2));
            }).catch((e) => {
              response.status = "400";
              response.description = `Unable to modify User ${req.params.userName} . Due to  ${e.message}`;
              response.data = `Unable to modify User ${req.params.userName} . Due to  ${e.message}`;
              debug("failed to modify an user" + JSON.stringify(response));
              res.status(400).send(JSON.stringify(response, null, 2));
            });
          } else {
            throw new Error(`No Entity found with id ${req.body.entityId}`);
          }
        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to add new User '${req.body.userName}'. Due to '${e}'`;
          response.data = {};
          debug("failed to modify an user" + JSON.stringify(response));
          res.status(400)
            .send(JSON.stringify(response, null, 2));
        });
      } catch (e) {
        response.status = "400";
        response.description = `Unable to modify User ${req.params.userName} . Due to  ${e.message}`;
        response.data = e.toString();
        debug("caught exception" + JSON.stringify(response));
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
    var result = sort.split(",")
      .reduce((temp, sortParam) => {
        if (sortParam.charAt(0) == "-") {
          return _.assign(temp, _.fromPairs([
            [sortParam.replace(/-/, ""), -1]
          ]));
        } else {
          return _.assign(_.fromPairs([
            [sortParam.replace(/\+/, ""), 1]
          ]));
        }
      }, {});
    return result;
  } else {
    return ORDER_BY;
  }
}