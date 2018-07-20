const debug = require("debug")("evolvus-platform-server:routes:api:application");
const _ = require("lodash");
const application = require("@evolvus/evolvus-application");
const ORDER_BY = process.env.ORDER_BY || {
  lastUpdatedDate: -1
};
const entityIdHeader = "X-ENTITY-ID";
const accessLevelHeader = "X-ACCESSLEVEL"
const LIMIT = process.env.LIMIT || 10;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const PAGE_SIZE = 10;

const applicationAttributes = ["applicationName", "description", "enableFlag", "applicationCode", "createdBy", "createdDate", "logo", "favicon", "entityId", "accessLevel", "lastUpdatedDate"];

var filterAttributes = application.filterAttributes;
var sortAttributes = application.sortAttributes;

module.exports = (router) => {
  router.route('/application')
    .post((req, res, next) => {
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
      let body = _.pick(req.body, applicationAttributes);
      try {
        body.tenantId = tenantId;
        body.createdBy = createdBy;
        body.createdDate = new Date().toISOString();
        body.lastUpdatedDate = body.createdDate;
        body.entityId = entityId;
        body.accessLevel = accessLevel;

        application.save(tenantId, ipAddress, createdBy, body).then((ent) => {
          response.status = "200";
          response.description = `New Application ''${body.applicationName}' has been added successfully and sent for the supervisor authorization`;
          response.data = ent;
          debug("response: " + JSON.stringify(response));
          res.status(200)
            .send(JSON.stringify(response, null, 2));
        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to add new application ${body.applicationName}. Due to ${e.message}`;
          response.data = e.toString();
          debug("failed to save an application" + JSON.stringify(response));
          res.status(response.status).send(JSON.stringify(response, null, 2));
        });
      } catch (e) {
        response.status = "400";
        response.description = `Unable to add new Application ${body.applicationName}. Due to ${e.message}`;
        response.data = e.toString();
        debug("caught exception" + JSON.stringify(response));
        res.status(response.status).send(JSON.stringify(response, null, 2));
      }
    });

  router.route("/application/:applicationCode")
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const accessLevel = req.header(accessLevelHeader);
      const entityId = req.header(entityIdHeader);
      var updateapplicationCode = req.params.applicationCode;
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      debug("query: " + JSON.stringify(req.query));
      let body = _.pick(req.body, applicationAttributes);
      try {
        body.updatedBy = req.header(userHeader);;
        body.lastUpdatedDate = new Date().toISOString();

        application.update(tenantId, body.applicationCode, body, updateapplicationCode).then((updatedapplication) => {
          response.status = "200";
          response.description = `${body.applicationName} application has been modified successfully and sent for the supervisor authorization.`;
          response.data = body;
          debug("response: " + JSON.stringify(response));
          res.status(200)
            .send(JSON.stringify(response, null, 2));

        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to modify application ${body.applicationName}. Due to ${e.message}`;
          response.data = e.toString();
          debug("failed to modify an application" + JSON.stringify(response));
          res.status(response.status).send(JSON.stringify(response, null, 2));
        });

      } catch (e) {
        response.status = "400";
        response.description = `Unable to modify application ${body.applicationName}. Due to ${e.message}`;
        response.data = e.toString();
        debug("caught exception" + JSON.stringify(response));
        res.status(response.status).send(JSON.stringify(response, null, 2));
      }

    });




  router.route('/application/')
    .get((req, res, next) => {
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
        Promise.all([application.find(tenantId, filter, orderby, skipCount, +limit), application.find(tenantId, filter, orderby, 0, 0)])
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
              response.description = "No applications found";
              response.totalNoOfRecords = result[1].length;
              response.totalNoOfPages = 0;
              debug("response: " + JSON.stringify(response));
              res.status(response.status)
                .send(JSON.stringify(response, null, 2));
            }
          })
          .catch((e) => {
            res.status(400)
            response.description = `Unable to fetch all applications`;
            response.data = e.toString();
            debug(`failed to fetch all applications ${e}`);
            res.status(response.status).send(JSON.stringify(response, null, 2));
          });
      } catch (e) {
        res.status(400);
        response.description = `Unable to fetch all applications`;
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
