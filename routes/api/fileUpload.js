const debug = require("debug")("evolvus-platform-server:routes:api:file-upload");
const _ = require("lodash");
const shortid = require('shortid');
const fileUpload = require("@evolvus/evolvus-file-upload");
const ORDER_BY = process.env.ORDER_BY || {
  lastUpdatedDate: -1
};
const LIMIT = process.env.LIMIT || 20;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const PAGE_SIZE = 20;
const entityIdHeader = "X-ENTITY-ID";
const accessLevelHeader = "X-ACCESS-LEVEL"

const fileUploadAttributes = ["tenantId", "wfInstanceId", "processingStatus", "fileIdentification", "fileName", "fileType", "fileUploadStatus", "totalTransaction", "count", "totalProcessedCount", "totalFailedCount", "uploadedBy", "successLog", "errorLog", "lastUpdatedDate", "enableFlag", "createdBy", "updatedBy", "uploadDateAndTime", "createdDate"];
const filterAttributes = fileUpload.filterAttributes;
const sortAttributes = fileUpload.sortAttributes;
const workFlowAttributes = ["wfInstanceId", "processingStatus"];

module.exports = (router) => {

  router.route('/fileUpload')
    .get((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      // const createdBy = req.header(userHeader);
      // const ipAddress = req.header(ipHeader);
      // const accessLevel = req.header(accessLevelHeader);
      // const entityId = req.header(entityIdHeader);
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };


    // get these values from header...
      // const tenantId = "T001";
      const createdBy = "System";
      const ipAddress = "127.0.0.1";

      
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
        debug("query: " + JSON.stringify(req.query));
        var limit = _.get(req.query, "limit", LIMIT);
        limit = parseInt(limit);
        if (isNaN(limit)) {
          throw new Error("limit must be a number");
        }
        var pageSize = _.get(req.query, "pageSize", PAGE_SIZE);
        pageSize = parseInt(pageSize);
        if (isNaN(pageSize)) {
          throw new Error("pageSize must be a number");
        }
        var pageNo = _.get(req.query, "pageNo", 1);
        pageNo = parseInt(pageNo);
        if (isNaN(pageNo)) {
          throw new Error("pageNo must be a number");
        }
        var skipCount = pageSize * (pageNo - 1);
        if (skipCount < 0) {
          throw new Error("skipCount must be positive value or 0");
        }
        var filterValues = _.pick(req.query, filterAttributes);
        var filter = _.omitBy(filterValues, function(value, key) {
          return value.startsWith("undefined");
        });
        var invalidFilters = _.difference(_.keys(req.query), filterAttributes);
        let a = _.pull(invalidFilters, 'pageSize', 'pageNo', 'limit', 'sort', 'query');
        debug("invalidFilters:", invalidFilters);
        if (a.length !== 0) {
          response.status = "200";
          response.description = "No entity found";
          response.data = [];
          response.totalNoOfPagses = 0;
          response.totalNoOfRecords = 0;
          res.json(response);
        } else {
          var sort = _.get(req.query, "sort", {});
          var orderby = sortable(sort);
          limit = (+pageSize < +limit) ? pageSize : limit;



        debug(`get API.tenantId :${tenantId}, createdBy :${createdBy}, ipAddress :${ipAddress}, filter :${JSON.stringify(filter)}, orderby :${JSON.stringify(orderby)}, skipCount :${skipCount}, limit :${limit} are parameters`);
        fileUpload.find(tenantId, createdBy, ipAddress, filter, orderby, skipCount, limit)
        Promise.all([fileUpload.find(tenantId, createdBy, ipAddress, filter, orderby, skipCount, limit), fileUpload.find(tenantId, createdBy, ipAddress, filter, {}, 0, 0)])
          .then((fileUploads) => {
            if (fileUploads[0].length > 0) {

              debug("getting successfully", fileUploads)
              response.status = "200";
              response.description = "SUCCESS";
              response.totalNoOfPages = Math.ceil(fileUploads[1].length / pageSize);
              response.totalNoOfRecords = fileUploads[1].length;
              response.data = fileUploads[0];

              res.status(response.status).json(response);

            } else {
              response.status = "200";
              response.description = "No fileUpload found";
              response.data = [];
                response.totalNoOfPages = 0;
                response.totalNoOfRecords = 0;
              debug("response: " + JSON.stringify(response));
              res.status(response.status).json(response);
            }
          })
          .catch((e) => {
            var reference = shortid.generate();
            debug(`failed to fetch all fileUpload ${e} ,and reference id ${reference}`);
            response.status = "400";
            response.description = `Unable to fetch all fileUpload`;
            response.data = e.toString();
            res.status(response.status).json(response);
          });
        }
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed due to : ${e} and reference id :${reference}`);
        response.status = "400";
        response.description = `Unable to fetch all fileUpload`;
        response.data = e.toString();
        res.status(response.status).json(response);;
      };
    });

  router.route("/fileUpload/:fileName")
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const accessLevel = req.header(accessLevelHeader);
      const entityId = req.header(entityIdHeader);
      var updatefileName = req.params.fileName;
      const response = {
        "status": "200",
        "description": "",
        "data": []
      };
      debug("query: " + JSON.stringify(req.query));
      let body = _.pick(req.body, fileUploadAttributes);
      try {
        body.tenantId = tenantId;
        body.updatedBy = req.header(userHeader);
        body.lastUpdatedDate = new Date().toISOString();
        debug(`Update API.tenantId :${tenantId},createdBy :${JSON.stringify(createdBy)},ipAddress :${ipAddress}, updatefileName :${updatefileName}, body :${JSON.stringify(body)}, are parameters`);
        fileUpload.update(tenantId, createdBy, ipAddress, updatefileName, body).then((updatedfileUpload) => {
          response.status = "200";
          response.description = `${updatefileName} fileUpload has been modified successfully and sent for the supervisor authorization.`;
          response.data = body;
          debug("response: " + JSON.stringify(response));
          res.status(response.status).json(response);
        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to modify fileUpload ${updatefileName}. Due to ${e.message}`;
          response.data = e.toString();
          var reference = shortid.generate();
          debug(`Update promise failed due to :${e} and referenceId :${reference}`);
          res.status(response.status).json(response);
        });

      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed due to :${e} , and reference id :${reference}`);
        response.status = "400";
        response.description = `Unable to modify fileUpload ${body.fileName}. Due to ${e.message}`;
        response.data = e.toString();
        res.status(response.status).json(response);
      }

    });

  router.route('/fileUpload')
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
      // const tenantId = "T001";
      // const createdBy = "System";
      // const ipAddress = "127.0.0.1";
      let body = _.pick(req.body, fileUploadAttributes);
      try {

        body. accessLevel = req.header(accessLevelHeader);
      body.entityId = req.header(entityIdHeader)
         body.createdDate = new Date().toISOString();
        body.lastUpdatedDate = body.createdDate;
        body.updatedBy=createdBy;
        body.wfInstanceId="";
        body.processingStatus="AUTHORIZED";
        debug(`save API. tenantId :${tenantId}, createdBy :${createdBy}, ipAddress :${ipAddress}, body :${JSON.stringify(body)}, are parameters values `);
        fileUpload.save(tenantId, createdBy, ipAddress, body).then((ent) => {
          response.status = "200";
          response.description = "SUCCESS";
          response.data = ent;
          res.status(200)
            .send(JSON.stringify(response, null, 2));
        }).catch((e) => {
          var reference = shortid.generate();
          debug(`save promise failed .due to ${e},and referenceId is ${reference}`);
          response.status = "400",
            response.description = `Unable to add new fileUpload ${body.fileName}. Due to ${e}`,
            response.data = e;
          res.status(response.status).send(JSON.stringify(response));
        });
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed .due to ${e},and referenceId is ${reference}`);
        response.status = "400",
          response.description = `Unable to add new fileUpload ${body.fileName}. Due to ${e.message}`,
          response.data = e.toString()
        res.status(response.status).send(JSON.stringify(response));
      }
    });

  router.route("/private/api/fileUpload/:id")
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      var id = req.params.id;
      // const accessLevel = req.header(accessLevelHeader);
      // const entityId = req.header(entityIdHeader)
      const response = {
        "status": "200",
        "description": "",
        "data": []
      };
      debug("query: " + JSON.stringify(req.query));
      try {
        let body = _.pick(req.body, fileUploadAttributes);
        body.updatedBy = req.header(userHeader);
        body.lastUpdatedDate = new Date().toISOString();
        debug(`Update API.tenantId :${tenantId},createdBy :${JSON.stringify(createdBy)},ipAddress :${ipAddress}, id :${id}, body :${JSON.stringify(body)}, are parameters`);
        fileUpload.updateWorkflow(tenantId, createdBy, ipAddress, id, body).then((updatedfileUpload) => {
          response.status = "200";
          response.description = `${id} fileUpload has been modified successfully and sent for the supervisor authorization.`;
          response.data = body;
          res.status(200)
            .json(response);

        }).catch((e) => {
          var reference = shortid.generate();
          response.status = "400",
            response.description = `Unable to modify fileUpload. Due to ${e}`
          response.data = e.toString()
          debug(`calling updateWorkflow failed due to :${e},and referenceId :${reference}`)
          res.status(response.status).json(response);
        });
      } catch (e) {

        var reference = shortid.generate();
        response.status = "400",
          response.description = `Unable to modify fileUpload . Due to ${e}`
        response.data = e.toString();
        debug(`try catch failed due to :${e},and referenceId :${reference}`)
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