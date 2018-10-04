const debug = require("debug")("evolvus-platform-server:routes:api:user");
const _ = require("lodash");
const user = require("@evolvus/evolvus-user");
const shortid = require('shortid');
const axios = require("axios");

const LIMIT = process.env.LIMIT || 20;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const entityIdHeader = "X-ENTITY-ID";
const accessLevelHeader = "X-ACCESS-LEVEL"
const PAGE_SIZE = 20;
const ORDER_BY = process.env.ORDER_BY || {
  lastUpdatedDate: -1
};
var mainBranch = process.env.ENTITY_ID || "H001B001";
var timeOut = process.env.TIME_OUT || 5000;
var corporateURL = process.env.CORPORATE_URL || "http://localhost:8282/flux-services/corporate/status/";

const userAttributes = ["tenantId", "entityId", "accessLevel", "applicationCode", "contact", "role", "userId", "designation", "userName", "userPassword", "saltString", "enabledFlag", "activationStatus", "processingStatus", "createdBy", "createdDate", "lastUpdatedDate", "deletedFlag", "token",
  "masterTimeZone", "masterCurrency", "dailyLimit", "individualTransactionLimit", "loginStatus"
];
const bulkUserAttributes = ["phoneNumber", "mobileNumber", "emailId", "city", "state", "country"];
const filterAttributes = user.filterAttributes;
const sortAttributes = user.sortAttributes;

var instance = axios.create({
  baseURL: corporateURL,
  timeout: timeOut
});

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

      limit = +pageSize > +limit ? +limit : +pageSize;

      try {
        debug(`user get API: Query parameters are: tenantId:${tenantId},entityId:${entityId},accessLevel:${accessLevel},createdBy:${createdBy},ipAddress:${ipAddress},orderby:${JSON.stringify(orderby)},filter:${JSON.stringify(filter)},skipCount:${skipCount},limit:${limit}`)
        Promise.all([user.find(tenantId, entityId, accessLevel, createdBy, ipAddress, filter, orderby, skipCount, limit), user.find(tenantId, entityId, accessLevel, createdBy, ipAddress, filter, orderby, 0, 0)])
          .then((result) => {
            if (result[0].length > 0) {
              response.status = "200";
              response.description = "Users found";
              response.totalNoOfPages = Math.ceil(result[1].length / pageSize);
              response.totalNoOfRecords = result[1].length;
              response.data = result[0];
              debug("response: " + JSON.stringify(response));
              res.status(200).json(response);
            } else {
              response.status = "200";
              response.data = [];
              response.totalNoOfRecords = result[1].length;
              response.totalNoOfPages = 0;
              response.description = "No User data available";
              debug("response: " + JSON.stringify(response));
              res.status(200).json(response);
            }
          }).catch((e) => {
            var reference = shortid.generate();
            debug(`user find promise failed due to ${e} and referenceId:${reference}`);
            response.status = "400";
            response.description = `Unable to fetch all Users due to ${e}`;
            response.data = e.toString();
            res.status(400).json(response);
          });
      } catch (e) {
        var reference = shortid.generate();
        response.status = "400";
        response.description = `Unable to fetch all Users due to ${e}`;
        response.data = e.toString();
        debug(`try catch promise failed due to ${e} and referenceId:${reference}`);
        res.status(400).json(response);
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
        debug(`user save API: nput parameters are:tenantId:${tenantId},ipAddress:${ipAddress},createdBy:${createdBy},accessLevel:${accessLevel},userObject:${JSON.stringify(object)}`);
        user.save(tenantId, ipAddress, createdBy, accessLevel, object).then((savedUser) => {
          response.status = "200";
          response.description = `New User '${req.body.userId}' has been added successfully and sent for the supervisor authorization.`;
          response.data = savedUser;
          debug("response: " + JSON.stringify(response));
          res.status(200).json(response);
        }).catch((e) => {
          var reference = shortid.generate();
          response.status = "400";
          response.description = `Unable to add new User '${req.body.userId}'. Due to '${e}'`;
          response.data = {};
          debug(`user save promise failed due to ${e} and referenceId:${reference}`);
          res.status(400).json(response);
        });
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch promise failed due to ${e} and referenceId:${reference}`);
        response.status = "400";
        response.description = `Unable to add new User '${req.body.userId}'. Due to '${e}'`;
        response.data = {};
        res.status(400).json(response);
      }
    });

  router.route("/user/:userId")
    .put((req, res, next) => {
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
      try {
        let body = _.pick(req.body, userAttributes);
        body.tenantId = tenantId;
        body.updatedBy = req.header(userHeader);
        body.lastUpdatedDate = new Date().toISOString();
        body.processingStatus = "IN_PROGRESS";
        debug(`user update API:Input parameters are:tenantId:${tenantId},createdBy:${createdBy},ipAddress:${ipAddress},userId:${req.params.userId},body:${JSON.stringify(body)},accessLevel:${accessLevel},entityId:${entityId}`);
        user.update(tenantId, createdBy, ipAddress, req.params.userId, body, accessLevel, entityId).then((updatedUser) => {
          response.status = "200";
          response.description = `'${req.params.userId}' User has been modified successfully and sent for the supervisor authorization.`;
          response.data = `'${req.params.userId}' User has been modified successfully and sent for the supervisor authorization.`;
          debug("response: " + JSON.stringify(response));
          res.status(200).json(response);
        }).catch((e) => {
          var reference = shortid.generate();
          response.status = "400";
          response.description = `Unable to modify User ${req.params.userId} . Due to  ${e}`;
          response.data = `Unable to modify User ${req.params.userId} . Due to  ${e}`;
          debug(`user update promise failed due to ${e} and referenceId:${reference}`);
          res.status(400).json(response);
        });
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch promise failed due to ${e} and referenceId:${reference}`);
        response.status = "400";
        response.description = `Unable to modify User ${req.params.userId} . Due to  ${e}`;
        response.data = e.toString();
        res.status(400).json(response);
      }
    });

  router.route("/private/api/user/:id")
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const accessLevel = req.header(accessLevelHeader);
      const entityId = req.header(entityIdHeader)
      const response = {
        "status": "200",
        "description": "",
        "data": []
      };
      debug("query: " + JSON.stringify(req.query));
      try {
        let body = _.pick(req.body, userAttributes);
        body.updatedBy = req.header(userHeader);
        body.lastUpdatedDate = new Date().toISOString();
        debug(`user workflow update API:Input parameters are: tenantId:${tenantId},ipAddress:${ipAddress},createdBy:${createdBy},id:${req.params.id},updateObject:${JSON.stringify(body)}`);
        user.updateWorkflow(tenantId, ipAddress, createdBy, req.params.id, body).then((updatedUser) => {
          response.status = "200";
          response.description = `${req.params.id} User workflow status has been updated successfully `;
          response.data = body;
          res.status(200).json(response);
        }).catch((e) => {
          var reference = shortid.generate();
          debug(`user update workflow promise failed due to ${e} and referenceId:${reference}`);
          response.status = "400";
          response.description = `Unable to update User workflow status due to ${e}`;
          response.data = e.toString()
          res.status(400).json(response);
        });
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch promise failed due to ${e} and referenceId:${reference}`);
        response.status = "400";
        response.description = `Unable to update User workflow status due to ${e}`;
        response.data = e.toString();
        res.status(400).json(response);
      }
    });

  router.route("/user/bulk")
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
        let contact = _.pick(req.body, bulkUserAttributes)
        object.createdDate = new Date().toISOString();
        object.lastUpdatedDate = object.createdDate;
        object.createdBy = createdBy;
        object.userPassword = "evolvus*123";
        if (!_.isEmpty(contact)) {
          object.contact = contact;
        }
        if (object.role != null) {
          object.role = {
            roleName: object.role
          };
        }
        user.save(tenantId, ipAddress, createdBy, accessLevel, object).then((savedUser) => {
          response.status = "200";
          response.description = `User ${req.body.userId} saved successfullly`;
          response.data = savedUser;
          debug("response: " + JSON.stringify(response));
          res.status(200).json(response);
        }).catch((e) => {
          var reference = shortid.generate();
          debug(`bulk user save promise failed due to ${e} and referenceId:${reference}`);
          response.status = "400";
          response.description = `Unable to add new User '${req.body.userId}'. Due to '${e}'`;
          response.data = {};
          res.status(400).json(response);
        });
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch promise failed due to ${e} and referenceId:${reference}`);
        response.status = "400";
        response.description = `Unable to add new User '${req.body.userId}'. Due to '${e}'`;
        response.data = {};
        res.status(400).json(response);
      }
    });

  router.route("/induscollect/user")
    .post((req, res, next) => {
      const tenantId = req.body.corporateId;
      const createdBy = _.get(req.body, "createdBy", "IndusCollect");
      const ipAddress = _.get(req.body, "ipAddress", req.ip);
      const accessLevel = _.get(req.body, "accessLevel", "0");
      const entityId = _.get(req.body, "branchId", mainBranch);
      const response = {
        "status": "200",
        "description": "",
        "data": {},
        "uniquereferenceid": null
      };
      try {
        instance.get(req.body.corporateId).then((resp) => {
          if (resp.data != null && resp.data.data != null && resp.data.data.exist == true) {
            let object = _.pick(req.body, userAttributes);
            object.tenantId = tenantId;
            object.entityId = entityId;
            object.tenantName = req.body.corporateName;
            object.createdDate = new Date().toISOString();
            object.lastUpdatedDate = object.createdDate;
            object.createdBy = createdBy;
            object.userPassword = "evolvus*123";
            object.enabledFlag = "false";
            object.userName = _.get(req.body, "userName", req.body.userId);
            object.activationStatus = "INACTIVE";
            object.processingStatus = "AUTHORIZED";
            let contact = {
              "emailId": req.body.emailId
            };
            object.contact = contact;
            if (object.role != null) {
              object.role = {
                roleName: object.role
              };
            }
            debug(`user save API: input parameters are:tenantId:${tenantId},ipAddress:${ipAddress},createdBy:${createdBy},accessLevel:${accessLevel},userObject:${JSON.stringify(object)}`);
            user.save(tenantId, ipAddress, createdBy, accessLevel, object).then((savedUser) => {
              response.status = "200";
              response.description = `New User '${req.body.userId}' has been added successfully.`;
              response.data = savedUser;
              response.uniquereferenceid = savedUser.uniquereferenceid;
              debug("response: " + JSON.stringify(response));
              res.status(200).json(response);
            }).catch((e) => {
              var reference = shortid.generate();
              response.status = "400";
              response.description = `Unable to add new User '${req.body.userId}'. Due to '${e}'`;
              response.data = {};
              debug(`user save promise failed due to ${e} and referenceId:${reference}`);
              res.status(400).json(response);
            });
          } else {
            response.status = "400";
            response.description = "Corporate not found";
            response.data = {};
            res.status(400).send(response);
          }
        }).catch((error) => {
          response.status = "400";
          response.description = "Server Error.Please contact Administrator";
          response.data = {};
          res.status(400).json(response);
        });

      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch promise failed due to ${e} and referenceId:${reference}`);
        response.status = "400";
        response.description = `Unable to add new User '${req.body.userId}'. Due to '${e}'`;
        response.data = {};
        res.status(400).json(response);
      }
    });

  router.route("/induscollect/user/:userId")
    .put((req, res, next) => {
      const tenantId = req.body.corporateId;
      const entityId = mainBranch;
      const createdBy = _.get(req.body, "createdBy", "IndusCollect");
      const ipAddress = _.get(req.body, "ipAddress", req.ip);
      const accessLevel = _.get(req.body, "accessLevel", "0");
      const response = {
        "status": "200",
        "description": "",
        "data": {},
        "uniquereferenceid": null
      };
      debug("query: " + JSON.stringify(req.query));
      try {
        let body = _.pick(req.body, ["userName", "designation", "emailId", "role", "branchId"]);
        body.tenantId = tenantId;
        if (body.branchId != null) {
          body.entityId = body.branchId;
        }
        if (body.role != null) {
          body.role = {
            roleName: body.role
          }
        }
        body.contact = {};
        if (body.emailId != null) {
          body.contact.emailId = body.emailId
        }
        body.updatedBy = req.header(userHeader);
        body.lastUpdatedDate = new Date().toISOString();
        debug(`user update API:Input parameters are:tenantId:${tenantId},createdBy:${createdBy},ipAddress:${ipAddress},userId:${req.params.userId},body:${JSON.stringify(body)},accessLevel:${accessLevel}`);
        user.update(tenantId, createdBy, ipAddress, req.params.userId, body, accessLevel, entityId).then((updatedUser) => {
          response.status = "200";
          response.description = `'${req.params.userId}' User has been modified successfully.`;
          response.data = `'${req.params.userId}' User has been modified successfully.`;
          response.uniquereferenceid = updatedUser.uniquereferenceid;
          debug("response: " + JSON.stringify(response));
          res.status(200).json(response);
        }).catch((e) => {
          var reference = shortid.generate();
          response.status = "400";
          response.description = `Unable to modify User ${req.params.userId} . Due to  ${e}`;
          response.data = `Unable to modify User ${req.params.userId} . Due to  ${e}`;
          debug(`user update promise failed due to ${e} and referenceId:${reference}`);
          res.status(400).json(response);
        });
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch promise failed due to ${e} and referenceId:${reference}`);
        response.status = "400";
        response.description = `Unable to modify User ${req.params.userId} . Due to  ${e}`;
        response.data = e.toString();
        res.status(400).json(response);
      }
    });

  router.route("/induscollect/user/:userId/activate")
    .put((req, res, next) => {
      const userId = _.get(req.params, "userId");
      const tenantId = req.body.corporateId;
      const entityId = mainBranch;
      const createdBy = _.get(req.body, "createdBy", "IndusCollect");
      const ipAddress = _.get(req.body, "ipAddress", req.ip);
      const accessLevel = _.get(req.body, "accessLevel", "0");
      const response = {
        "status": "200",
        "description": "",
        "data": {},
        "uniquereferenceid": null
      };
      try {
        let body = _.pick(req.body, ["action", "corporateId"]);
        body.action = (body.action != null) ? body.action.toUpperCase() : null;
        if (body.action !== "ACTIVE" && body.action !== "INACTIVE") {
          throw new Error("Action must be ACTIVE or INACTIVE");
        }
        instance.get(body.corporateId).then((resp) => {
          var result = resp.data;
          if (result != null && result.data != null) {
            if (result.data.status != null && (result.data.status.toUpperCase() == "ACTIVE" || body.action.toUpperCase() == "INACTIVE")) {
              let flag = (body.action == "ACTIVE") ? "true" : "false";
              let object = {
                "activationStatus": body.action,
                "enabledFlag": flag
              };
              let filter = {
                "userId": req.params.userId.toUpperCase(),
                "tenantId": req.body.corporateId
              };
              Promise.all([user.find(tenantId, entityId, accessLevel, createdBy, ipAddress, filter, ORDER_BY, 0, 1), user.update(tenantId, createdBy, ipAddress, userId, object, accessLevel, entityId)])
                .then((result) => {
                  if (result[0][0] != null) {
                    if (result[0][0].activationStatus === body.action) {
                      response.description = `User is already ${body.action}`;
                      response.uniquereferenceid = result[0][0].uniquereferenceid;
                      debug("response: " + JSON.stringify(response));
                      res.status(200).json(response);
                    } else {
                      response.status = "200";
                      response.description = "User status changed successfully.";
                      response.data = "User status changed successfully.";
                      response.uniquereferenceid = result[0][0].uniquereferenceid;
                      debug("response: " + JSON.stringify(response));
                      res.status(200).json(response);
                    }
                  } else {
                    throw new Error("User not found");
                  }
                }).catch((e) => {
                  var reference = shortid.generate();
                  response.status = "400";
                  response.description = `Unable to modify the status of User ${req.params.userId} . Due to  ${e}`;
                  response.data = `Unable to modify the status of User ${req.params.userId} . Due to  ${e}`;
                  debug(`user update promise failed due to ${e} and referenceId:${reference}`);
                  res.status(400).json(response);
                });
            } else {
              response.status = "400";
              response.description = "Not able to modify the user status.Due to Corporate not found or it is INACTIVE";
              response.data = {};
              debug("response: " + JSON.stringify(response));
              res.status(400).json(response);
            }
          } else {
            response.status = "400";
            response.description = "Server Error.Please contact Administrator";
            response.data = {};
            debug("response: " + JSON.stringify(response));
            res.status(400).json(response);
          }
        }).catch((e) => {
          var reference = shortid.generate();
          response.status = "400";
          response.description = "Server Error.Please contact Administrator";
          response.data = {};
          debug(`Find corporate status promise failed due to ${e} and referenceId is ${reference}`);
          res.status(400).json(response);
        });

      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch promise failed due to ${e} and referenceId:${reference}`);
        response.status = "400";
        response.description = `Unable to modify the status of User ${req.params.userId} . Due to  ${e}`;
        response.data = e.toString();
        res.status(400).json(response);
      }
    });

  router.route("/user/verify").get((req, res, next) => {
    try {
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      var query = _.pick(req.query, ["applicationCode", "userId"]);
      user.verify(query.applicationCode, query.userId)
        .then(user => {
          response.data = user;
          if (user) {
            response.description = `User with userId ${req.query.userId} exists`;
          } else {
            response.description = `User with userId ${req.query.userId} doesn't exist`;
          }
          res.status(200).json(response);
        })
        .catch(e => {
          debug("error", e);
          response.status = "404";
          response.data = e;
          response.description = `${e.toString()}`;
          res.status(404).json(response);
        });
    } catch (e) {
      debug("error e:", e);
      response.status = "404";
      response.data = e;
      response.description = `${e.toString()}`;
      res.status(404).json(response);
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