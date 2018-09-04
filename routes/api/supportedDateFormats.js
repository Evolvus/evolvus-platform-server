const debug = require("debug")("evolvus-platform-server:routes:api:supportedDateFormats");
const _ = require("lodash");
const supportedDateFormats = require('@evolvus/evolvus-supported-date-formats');
const shortid = require('shortid');
const LIMIT = process.env.LIMIT || 10;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const PAGE_SIZE = 10;
const ORDER_BY = process.env.ORDER_BY || {
  lastUpdatedDate: -1
};
const supportedDateFormatsAttributes = ["formatCode", "timeFormat", "description", "createdDate", "lastUpdatedDate", "createdBy", "updatedBy", "objVersion", "enableFlag"];

const filterAttributes = supportedDateFormats.filterAttributes;
const sortAttributes = supportedDateFormats.sortAttributes;
var workFlowAttributes = ["wfInstanceId", "processingStatus"];



module.exports = (router) => {

  router.route('/supportedDateFormats')
    .post((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      // const accessLevel = req.header(accessLevelHeader);
      //const entityId = req.header(entityIdHeader)
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      let body = _.pick(req.body, supportedDateFormatsAttributes);

      try {
        body.tenantId = tenantId;
        body.createdBy = createdBy;
        body.createdDate = new Date().toISOString();
        body.lastUpdatedDate = body.createdDate;
        //body.entityId = entityId;
        //body.accessLevel = accessLevel;

        debug(`save API. tenantId :${tenantId}, createdBy :${createdBy},ipAddress :${ipAddress}, body :${JSON.stringify(body) }are parameters`);
        supportedDateFormats.save(tenantId, createdBy, ipAddress, body).then((ent) => {
          response.status = "200";
          response.description = `New supportedDateFormats has been added successfully and sent for the supervisor authorization`;
          response.data = ent;
          debug("response: " + JSON.stringify(response));
          res.status(response.status).json(response);
        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to add new supportedDateFormats . Due to ${e}`;
          response.data = {};
          var reference = shortid.generate();
          debug(`save promise failed due to :${e} and referenceId :${reference}`);
          res.status(response.status).json(response);
        });
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed due to :${e} , and reference id :${reference}`);
        response.status = "400";
        response.description = `Unable to add new supportedDateFormats . Due to ${e.message}`;
        response.data = {};
        res.status(response.status).json(response);
      }
    });

  router.route('/supportedDateFormats')
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      //  const accessLevel = req.header(accessLevelHeader);
      //  const entityId = req.header(entityIdHeader);

      const response = {
        "status": "200",
        "description": "",
        "data": []
      };
      debug("query: " + JSON.stringify(req.query));
      let body = _.pick(req.body, supportedDateFormatsAttributes);
      try {
        body.tenantId = tenantId;
        body.updatedBy = req.header(userHeader);
        body.lastUpdatedDate = new Date().toISOString();
        body.processingStatus = "IN_PROGRESS";
        var updateformatCode = body.formatCode;
        debug(`Update API.tenantId :${tenantId},createdBy :${JSON.stringify(createdBy)},ipAddress :${ipAddress}, updateformatCode :${updateformatCode}, body :${JSON.stringify(body)}, are parameters`);
        supportedDateFormats.update(tenantId, createdBy, ipAddress, updateformatCode, body).then((updatedsupportedDateFormats) => {
          response.status = "200";
          response.description = `${updateformatCode} supportedDateFormats has been modified successfully and sent for the supervisor authorization.`;
          response.data = body;
          debug("response: " + JSON.stringify(response));
          res.status(response.status).json(response);
        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to modify supportedDateFormats ${updateformatCode}. Due to ${e.message}`;
          response.data = e.toString();
          var reference = shortid.generate();
          debug(`Update promise failed due to :${e} and referenceId :${reference}`);
          res.status(response.status).json(response);
        });

      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed due to :${e} , and reference id :${reference}`);
        response.status = "400";
        response.description = `Unable to modify supportedDateFormats . Due to ${e.message}`;
        response.data = e.toString();
        res.status(response.status).json(response);
      }

    });


  router.route('/supportedDateFormats/')
    .get((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      /// const accessLevel = req.header(accessLevelHeader);
      // const entityId = req.header(entityIdHeader)
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
        Promise.all([supportedDateFormats.find(tenantId, createdBy, ipAddress, filter, orderby, skipCount, limitc), supportedDateFormats.find(tenantId, ipAddress, createdBy, filter, orderby, 0, 0)])
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
              response.description = "No supportedDateFormatss found";
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
            response.description = `Unable to fetch all supportedDateFormatss`;
            response.data = e.toString();
            debug(`failed to fetch all supportedDateFormatss ${e}`);
            res.status(response.status).json(response);
          });
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed due to :${e} , and reference id :${reference}`);
        response.status = "400";
        response.description = `Unable to fetch all supportedDateFormatss`;
        response.data = e.toString();
        debug(`caught exception ${e}`);
        res.status(response.status).json(response);
      }
    });

  router.route("/private/api/supportedDateFormats/:id")
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      // const accessLevel = req.header(accessLevelHeader);
      // const entityId = req.header(entityIdHeader)
      var id = req.params.id;
      const response = {
        "status": "200",
        "description": "",
        "data": []
      };
      debug("query: " + JSON.stringify(req.query));
      try {
        let body = _.pick(req.body, supportedDateFormatsAttributes);
        body.updatedBy = req.header(userHeader);
        body.lastUpdatedDate = new Date().toISOString();
        debug(`Update workFlow API.tenantId :${tenantId},createdBy :${JSON.stringify(createdBy)},ipAddress :${ipAddress}, id :${id}, body :${JSON.stringify(body)}, are parameters`);
        supportedDateFormats.updateWorkflow(tenantId, createdBy, ipAddress, id, body).then((updatesupportedDateFormats) => {
          response.status = "200";
          response.description = `${id} supportedDateFormats workflow has been modified successful and sent for the supervisor authorization.`;
          response.data = body;
          res.status(200)
            .json(response);
        }).catch((e) => {
          response.status = "400",
            response.description = `Unable to modify supportedDateFormats  workflow. Due to ${e}`
          response.data = e.toString()
          res.status(response.status).json(response);
        });
      } catch (e) {
        response.status = "400",
          response.description = `Unable to modify supportedDateFormats  workflow . Due to ${e}`
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