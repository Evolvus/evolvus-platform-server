const debug = require("debug")("evolvus-platform-server:routes:api:lookup");
const _ = require("lodash");
const shortid = require('shortid');
const lookup = require("@evolvus/evolvus-lookup");
const ORDER_BY = process.env.ORDER_BY || {
  lastUpdatedDate: -1
};
const LIMIT = process.env.LIMIT || 30;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const PAGE_SIZE = 30;

const lookupAttributes = ["lookupCode", "value", "valueOne", "wfInstanceId", "processingStatus", "valueTwo", "valueThree", "valueFour", "valueFive", "valueSix", "valueSeven", "valueEight", "valueNine", "valueTen", "lastUpdatedDate", "enableFlag", "createdBy", "wfInstanceId", "wfInstanceStatus", "createdDate"];
const filterAttributes = lookup.filterAttributes;
const sortAttributes = lookup.sortAttributes;
const workFlowAttributes = ["wfInstanceId", "processingStatus"];

module.exports = (router) => {

  router.route('/lookup')
    .get((req, res, next) => {

      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
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

        debug(`get API.tenantId :${tenantId}, createdBy :${createdBy}, ipAddress :${ipAddress}, filter :${JSON.stringify(filter)}, orderby :${JSON.stringify(orderby)}, skipCount :${skipCount}, limit :${limit} are parameters`);
        lookup.find(tenantId, createdBy, ipAddress, filter, orderby, skipCount, limitc)
          .then((lookups) => {
            if (lookups.length > 0) {
              debug("getting successfully", lookups)
              response.status = "200";
              response.description = "SUCCESS";
              response.data = lookups;
              res.status(response.status).json(response);
            } else {
              response.status = "200";
              response.data = [];
              response.description = "No lookup found";
              debug("response: " + JSON.stringify(response));
              res.status(response.status).json(response);

            }
          })
          .catch((e) => {
            var reference = shortid.generate();
            debug(`failed to fetch all lookup ${e} ,and reference id ${reference}`);
            response.status = "400";
            response.description = `Unable to fetch all lookup`;
            response.data = e.toString();
            res.status(response.status).json(response);
          });
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed due to : ${e} and reference id :${reference}`);
        response.status = "400";
        response.description = `Unable to fetch all lookup`;
        response.data = e.toString();
        res.status(response.status).json(response);
      };
    });

  router.route("/lookup/:lookupCode")
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      //const accessLevel = req.header(accessLevelHeader);
      //const entityId = req.header(entityIdHeader);
      var updatelookupCode = req.params.lookupCode;
      const response = {
        "status": "200",
        "description": "",
        "data": []
      };
      debug("query: " + JSON.stringify(req.query));
      let body = _.pick(req.body, lookupAttributes);
      try {
        body.tenantId = tenantId;
        body.updatedBy = req.header(userHeader);
        body.lastUpdatedDate = new Date().toISOString();
        body.processingStatus = "IN_PROGRESS";
        debug(`Update API.tenantId :${tenantId},createdBy :${JSON.stringify(createdBy)},ipAddress :${ipAddress}, updatelookupCode :${updatelookupCode}, body :${JSON.stringify(body)}, are parameters`);
        lookup.update(tenantId, createdBy, ipAddress, updatelookupCode, body).then((updatedlookup) => {
          response.status = "200";
          response.description = `${updatelookupCode} lookup has been modified successfully and sent for the supervisor authorization.`;
          response.data = body;
          debug("response: " + JSON.stringify(response));
          res.status(response.status).json(response);
        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to modify lookup ${updatelookupCode}. Due to ${e.message}`;
          response.data = e.toString();
          var reference = shortid.generate();
          debug(`Update promise failed due to :${e} and referenceId :${reference}`);
          res.status(response.status).json(response);
        });

      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed due to :${e} , and reference id :${reference}`);
        response.status = "400";
        response.description = `Unable to modify lookup ${body.lookupName}. Due to ${e.message}`;
        response.data = e.toString();
        res.status(response.status).json(response);
      }

    });

  router.route('/lookup')
    .post((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      let body = _.pick(req.body, lookupAttributes);
      try {
        body.tenantId = tenantId;
        body.createdBy = createdBy;
        body.createdDate = new Date().toISOString();
        body.lastUpdatedDate = body.createdDate;
        debug(`save API. tenantId :${tenantId}, createdBy :${createdBy}, ipAddress :${ipAddress}, body :${JSON.stringify(body)}, are parameters values `);
        lookup.save(tenantId, createdBy, ipAddress, body).then((ent) => {
          response.status = "200";
          response.description = "SUCCESS";
          response.data = ent;
          res.status(200)
            .send(JSON.stringify(response, null, 2));
        }).catch((e) => {
          var reference = shortid.generate();
          debug(`save promise failed .due to ${e},and referenceId is ${reference}`);
          response.status = "400",
            response.description = `Unable to add new lookup ${body.lookupCode}. Due to ${e}`,
            response.data = {};
          res.status(response.status).json(response);
        });
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed .due to ${e},and referenceId is ${reference}`);
        response.status = "400",
          response.description = `Unable to add new lookup ${body.lookupCode}. Due to ${e}`,
          response.data = {};
        res.status(response.status).json(response);
      }
    });

  router.route("/private/api/lookup/:id")
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      // const accessLevel = req.header(accessLevelHeader);
      // const entityId = req.header(entityIdHeader)
      const response = {
        "status": "200",
        "description": "",
        "data": []
      };
      debug("query: " + JSON.stringify(req.query));
      try {
        let body = _.pick(req.body, lookupAttributes);
        var id = req.params.id;
        body.updatedBy = req.header(userHeader);
        body.lastUpdatedDate = new Date().toISOString();
        debug(`Update API.tenantId :${tenantId},createdBy :${JSON.stringify(createdBy)},ipAddress :${ipAddress}, id :${id}, body :${JSON.stringify(body)}, are parameters`);
        lookup.updateWorkflow(tenantId, createdBy, ipAddress, id, body).then((updatedlookup) => {
          response.status = "200";
          response.description = `${id} lookup has been modified successfully and sent for the supervisor authorization.`;
          response.data = body;
          res.status(200)
            .json(response);

        }).catch((e) => {
          var reference = shortid.generate();
          response.status = "400",
            response.description = `Unable to modify lookup. Due to ${e}`
          response.data = e.toString()
          debug(`calling updateWorkflow failed due to :${e},and referenceId :${reference}`)
          res.status(response.status).json(response);
        });
      } catch (e) {
        var reference = shortid.generate();
        response.status = "400",
          response.description = `Unable to modify lookup . Due to ${e}`
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