const debug = require("debug")("evolvus-platform-server:routes:api:masterTimeZone");
const _ = require("lodash");
const masterTimeZone = require("@evolvus/evolvus-master-time-zone");
const shortid = require('shortid');
const LIMIT = process.env.LIMIT || 10;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const PAGE_SIZE = 10;
const ORDER_BY = process.env.ORDER_BY || {
  lastUpdatedDate: -1
};
const masterTimeZoneAttributes = ["zoneCode", "zoneName", "offsetValue", "createdDate", "lastUpdatedDate", "createdBy", "updatedBy", "enableFlag", "offSet", "wfInstanceId", "processingStatus", "objVersion"];

const filterAttributes = masterTimeZone.filterAttributes;
const sortAttributes = masterTimeZone.sortAttributes;
var workFlowAttributes = ["wfInstanceId", "processingStatus"];


module.exports = (router) => {
  router.route('/masterTimeZone')
    .post((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      // const accessLevel = req.header(accessLevelHeader);
      // const entityId = req.header(entityIdHeader)
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      let body = _.pick(req.body, masterTimeZoneAttributes);

      try {
        body.tenantId = tenantId;
        body.createdBy = createdBy;
        body.createdDate = new Date().toISOString();
        body.lastUpdatedDate = body.createdDate;
        // body.entityId = entityId;
        // body.accessLevel = accessLevel;

        debug(`save API. tenantId :${tenantId}, createdBy :${createdBy},ipAddress :${ipAddress}, body :${JSON.stringify(body) }are parameters`);
        masterTimeZone.save(tenantId, createdBy, ipAddress, body).then((ent) => {
          response.status = "200";
          response.description = `New masterTimeZone ''${body.zoneName}' has been added successfully and sent for the supervisor authorization`;
          response.data = ent;
          debug("response: " + JSON.stringify(response));
          res.status(response.status).json(response);
        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to add new masterTimeZone ${body.zoneName}. Due to ${e}`;
          response.data = e;
          var reference = shortid.generate();
          debug(`save promise failed due to :${e} and referenceId :${reference}`);
          res.status(response.status).json(response);
        });
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed due to :${e} , and reference id :${reference}`);
        response.status = "400";
        response.description = `Unable to add new masterTimeZone ${body.zoneName}. Due to ${e.message}`;
        response.data = e.toString();
        res.status(response.status).json(response);
      }
    });

  router.route("/masterTimeZone/:zoneCode")
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      // const accessLevel = req.header(accessLevelHeader);
      // const entityId = req.header(entityIdHeader);
      var updatezoneCode = req.params.zoneCode;
      const response = {
        "status": "200",
        "description": "",
        "data": []
      };
      debug("query: " + JSON.stringify(req.query));
      let body = _.pick(req.body, masterTimeZoneAttributes);
      try {
        body.tenantId = tenantId;
        body.updatedBy = req.header(userHeader);
        body.lastUpdatedDate = new Date().toISOString();
        body.processingStatus = "IN_PROGRESS";
        debug(`Update API.tenantId :${tenantId},createdBy :${JSON.stringify(createdBy)},ipAddress :${ipAddress}, updatezoneCode :${updatezoneCode}, body :${JSON.stringify(body)}, are parameters`);
        masterTimeZone.update(tenantId, createdBy, ipAddress, updatezoneCode, body).then((updatedmasterTimeZone) => {
          response.status = "200";
          response.description = `${updatezoneCode} masterTimeZone has been modified successfully and sent for the supervisor authorization.`;
          response.data = body;
          debug("response: " + JSON.stringify(response));
          res.status(response.status).json(response);
        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to modify masterTimeZone ${updatezoneCode}. Due to ${e.message}`;
          response.data = e.toString();
          var reference = shortid.generate();
          debug(`Update promise failed due to :${e} and referenceId :${reference}`);
          res.status(response.status).json(response);
        });

      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed due to :${e} , and reference id :${reference}`);
        response.status = "400";
        response.description = `Unable to modify masterTimeZone ${body.zoneName}. Due to ${e.message}`;
        response.data = e.toString();
        res.status(response.status).json(response);
      }

    });


  router.route('/masterTimeZone/')
    .get((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      // const accessLevel = req.header(accessLevelHeader);
      // const entityId = req.header(entityIdHeader);
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };

      try {
        debug("query: " + JSON.stringify(req.query));
        var limit = _.get(req.query, "limit", LIMIT);
        var limitc = parseInt(limit);
        if (isNaN(limitc)) {
          throw new Error("limit must be a number")
        }
        var pageSize = _.get(req.query, "pageSize", PAGE_SIZE);
        var pageSizec = parseInt(pageSize);
        if (isNaN(pageSizec)) {
          throw new Error("pageSize must be a number")
        }
        var pageNo = _.get(req.query, "pageNo", 1);
        var pageNoc = parseInt(pageNo);
        if (isNaN(pageNoc)) {
          throw new Error("pageNo must be a number")
        }
        var skipCount = pageSizec * (pageNoc - 1);
        var filterValues = _.pick(req.query, filterAttributes);
        var filter = _.omitBy(filterValues, function(value, key) {
          return value.startsWith("undefined");
        });
        var sort = _.get(req.query, "sort", {});
        var orderby = sortable(sort);
        limitc = (+pageSizec < limitc) ? pageSizec : limitc;

        debug(`GET ALL API.tenantId :${tenantId},createdBy :${createdBy},ipAddress :${ipAddress},filter :${JSON.stringify(filter)}, orderby :${JSON.stringify(orderby)}, skipCount :${skipCount}, +limit :${+limit} are parameters`);
        Promise.all([masterTimeZone.find(tenantId, createdBy, ipAddress, filter, orderby, skipCount, limitc), masterTimeZone.find(tenantId, ipAddress, createdBy, filter, orderby, 0, 0)])
          .then((result) => {
            if (result[0].length > 0) {
              response.status = "200";
              response.description = "SUCCESS";
              response.totalNoOfPages = Math.ceil(result[1].length / pageSize);
              response.totalNoOfRecords = result[1].length;
              response.data = result[0];
              debug("response: " + JSON.stringify(response));
              res.status(response.status).json(response);
            } else {
              response.status = "200";
              response.description = "No masterTimeZones found";
              response.totalNoOfRecords = result[1].length;
              response.data = [];
              response.totalNoOfPages = 0;
              debug("response: " + JSON.stringify(response));
              res.status(response.status)
                .json(response);
            }
          })
          .catch((e) => {
            var reference = shortid.generate();
            debug(`Get All promise failed due to :${e} and referenceId :${reference}`);
            response.status = "400";
            response.description = `Unable to fetch all masterTimeZones`;
            response.data = e.toString();
            debug(`failed to fetch all masterTimeZones ${e}`);
            res.status(response.status).json(response);
          });
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed due to :${e} , and reference id :${reference}`);
        response.status = "400";
        response.description = `Unable to fetch all masterTimeZones`;
        response.data = e.toString();
        debug(`caught exception ${e}`);
        res.status(response.status).json(response);
      }
    });

  router.route("/private/api/masterTimeZone/:id")
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      // const accessLevel = req.header(accessLevelHeader);
      // const entityId = req.header(entityIdHeader);
      var id = req.params.id;
      const response = {
        "status": "200",
        "description": "",
        "data": []
      };
      debug("query: " + JSON.stringify(req.query));
      try {
        let body = _.pick(req.body, masterTimeZoneAttributes);
        body.updatedBy = req.header(userHeader);
        body.lastUpdatedDate = new Date().toISOString();
        debug(`Update workFlow API.tenantId :${tenantId},createdBy :${JSON.stringify(createdBy)},ipAddress :${ipAddress}, id :${id}, body :${JSON.stringify(body)}, are parameters`);
        masterTimeZone.updateWorkflow(tenantId, createdBy, ipAddress, id, body).then((updatemasterTimeZone) => {
          response.status = "200";
          response.description = `${id} masterTimeZone workflow has been modified successful and sent for the supervisor authorization.`;
          response.data = body;
          res.status(200)
            .json(response);
        }).catch((e) => {
          response.status = "400",
            response.description = `Unable to modify masterTimeZone  workflow. Due to ${e}`
          response.data = e.toString()
          res.status(response.status).json(response);
        });
      } catch (e) {
        response.status = "400",
          response.description = `Unable to modify masterTimeZone  workflow . Due to ${e}`
        response.data = e.toString()
        res.status(response.status).json(response);
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