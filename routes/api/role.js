const debug = require("debug")("evolvus-platform-server:routes:api:role");
const _ = require("lodash");
const role = require("evolvus-role");
const application = require("evolvus-application");
const ORDER_BY = process.env.ORDER_BY || {
  lastUpdatedDate: -1
};
const LIMIT = process.env.LIMIT || 10;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const entityIdHeader = "X-ENTITY-ID";
const accessLevelHeader = "X-ACCESS-LEVEL";
const PAGE_SIZE = 10;

const roleAttributes = ["tenantId", "roleName", "applicationCode", "description", "activationStatus", "processingStatus", "associatedUsers", "createdBy", "createdDate", "menuGroup", "lastUpdatedDate", "entityId", "accessLevel", "roleType", "txnType"];
const filterAttributes = role.filterAttributes;
const sortableAttributes = role.sortAttributes;



module.exports = (router) => {

  router.route("/role")
    .post((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const entityId = req.header(entityIdHeader);
      const accessLevel = req.header(accessLevelHeader);
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      let body = _.pick(req.body, roleAttributes);
      try {
        body.associatedUsers = 5;
        body.tenantId = tenantId;
        body.createdBy = createdBy;
        body.entityId = entityId;
        body.createdDate = new Date().toISOString();
        body.lastUpdatedDate = body.createdDate;

        role.save(tenantId, createdBy, accessLevel, entityId, body).then((roles) => {
          response.status = "200";
          response.description = `New role ${body.roleName.toUpperCase()} has been added successfully for the application ${body.applicationCode} and sent for the supervisor authorization.`;
          response.data = roles;
          debug("response: " + JSON.stringify(response));
          res.status(200)
            .send(JSON.stringify(response, null, 2));
        }).catch((e) => {

          response.status = "400";
          response.description = `Unable to add new role ${body.roleName}. Due to ${e}`;
          response.data = {};
          debug("failed to save an role" + JSON.stringify(response));
          res.status(response.status).send(JSON.stringify(response, null, 2));
        });
      } catch (e) {

        response.status = "400";
        response.description = `Unable to add new Role ${body.roleName}. Due to ${e.message}`;
        response.data = {};
        debug("caught exception" + JSON.stringify(response));
        res.status(response.status).send(JSON.stringify(response, null, 2));

      }
    });

  router.route('/role/')
    .get((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const entityId = req.header(entityIdHeader);
      const accessLevel = req.header(accessLevelHeader);
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      debug("query: " + JSON.stringify(req.query));
      var limit = _.get(req.query, "limit", LIMIT);
      var pageSize = _.get(req.query, "pageSize", PAGE_SIZE);
      var pageNo = _.get(req.query, "pageNo", 1);
      var skipCount = pageSize * (pageNo - 1);
      var filterValues = _.pick(req.query, filterAttributes);
      var filter = _.omitBy(filterValues, function(value, key) {
        return value.startsWith("undefined");
      });
      var sort = _.get(req.query, "sort", {});
      var orderby = sortable(sort);
      try {
        Promise.all([role.find(tenantId, filter, orderby, skipCount, +limit), role.find(tenantId, filter, orderby, 0, 0)])
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
              response.description = "No role found";
              debug("response: " + JSON.stringify(response));
              res.status(response.status)
                .send(JSON.stringify(response, null, 2));
            }
          }).catch((e) => {
            debug(`failed to fetch all roles ${e}`);
            response.status = "400";
            response.description = `Unable to fetch all roles`;
            response.data = e.toString();
            res.status(response.status).send(JSON.stringify(response, null, 2));
          });
      } catch (e) {
        debug(`caught exception ${e}`);
        response.status = "400";
        response.description = `Unable to fetch all roles`;
        response.data = e.toString();
        res.status(response.status).send(JSON.stringify(response, null, 2));
      }
    });

  router.route("/role/:roleName")
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const accessLevel = req.header(accessLevelHeader);
      const entityId = req.header(entityIdHeader)
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      debug("query: " + JSON.stringify(req.query));
      try {
        let body = _.pick(req.body, roleAttributes);
        body.updatedBy = req.header(userHeader);;
        body.lastUpdatedDate = new Date().toISOString();
        let updateRoleName = req.params.roleName;

        role.update(tenantId, body.roleName, updateRoleName, body).then((updatedRoles) => {
          response.status = "200";
          response.description = `${body.roleName} Role has been modified successful and sent for the supervisor authorization.`;
          response.data = body;
          debug("response: " + JSON.stringify(response));
          res.status(200)
            .send(JSON.stringify(response, null, 2));
        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to modify role ${body.roleName}. Due to ${e.message}`;
          response.data = e.toString();
          debug("failed to modify a role" + JSON.stringify(response));
          res.status(response.status).send(JSON.stringify(response, null, 2));
        });
      } catch (e) {
        response.status = "400";
        response.description = `Unable to modify role ${body.roleName}. Due to ${e.message}`;
        response.data = e.toString();
        debug(`caught exception ${e}`);
        res.status(response.status).send(JSON.stringify(response, null, 2));
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