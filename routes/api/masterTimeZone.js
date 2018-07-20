const debug = require("debug")("evolvus-platform-server:routes:api:masterTimeZone");
const _ = require("lodash");
const masterTimeZone = require("@evolvus/evolvus-master-time-zone");

const LIMIT = process.env.LIMIT || 10;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const PAGE_SIZE = 10;

const mastermasterTimeZoneAttributes = ["zoneCode", "zoneName", "offsetValue", "createdDate", "lastUpdatedDate", "createdBy", "updatedBy", "enableFlag", "offSet", "objVersion"];

const filterAttributes = masterTimeZone.filterAttributes;
const sortAttributes = masterTimeZone.sortAttributes;



module.exports = (router) => {
  router.route('/masterTimeZone/')
    .get((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      debug("query: " + JSON.stringify(req.query));
      var limit = _.get(req.query, "limit", LIMIT);
      var pageSize = _.get(req.query, "pageSize", PAGE_SIZE);
      var pageNo = _.get(req.query, "pageSize", 1);
      var skipCount = pageSize * (pageNo - 1);
      var filter = _.pick(req.query, filterAttributes);
      var sort = _.get(req.query, "sort", {});
      var orderby = sortable(sort);

      try {
        //console.log(tenantId, createdBy, ipAddress, filter, orderby, skipCount, limit);
        Promise.all([masterTimeZone.find(tenantId, filter, orderby, skipCount, +limit), masterTimeZone.counts(tenantId, filter)])
          .then((masterTimeZone) => {

            if (masterTimeZone.length > 0) {
              response.status = "200";
              response.description = "SUCCESS";
              response.totalNoOfPages = Math.ceil(masterTimeZone[1] / pageSize);
              response.totalNoOfRecords = masterTimeZone[1];
              response.data = masterTimeZone[0];

              res.status(200)
                .send(JSON.stringify(response, null, 2));
            } else {
              response.status = "404";
              response.description = "No masterTimeZone found";
              debug("response: " + JSON.stringify(response));
              res.status(200)
                .send(JSON.stringify(response, null, 2));
            }
          })
          .catch((e) => {
            debug(`failed to fetch all masterTimeZone ${e}`);
            response.status = "400",
              response.description = `Unable to fetch all masterTimeZone`
            response.data = e.toString()
            res.status(response.status).send(JSON.stringify(response, null, 2));
          });
      } catch (e) {
        debug(`caught exception ${e}`);
        response.status = "400",
          response.description = `Unable to fetch all masterTimeZone`
        response.data = e.toString()
        res.status(response.status).send(JSON.stringify(response, null, 2));
      }
    });
};

function sortable(sort) {
  if (typeof sort === 'undefined' ||
    sort == null) {
    return {};
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
    return {};
  }
}
