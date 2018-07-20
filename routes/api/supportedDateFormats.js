const debug = require("debug")("evolvus-platform-server:routes:api:supportedDateFormats");
const _ = require("lodash");
const supportedDateFormats = require("@evolvus/evolvus-supported-date-formats");

const LIMIT = process.env.LIMIT || 10;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const PAGE_SIZE = 10;

const supportedDateFormatsAttributes = ["formatCode", "timeFormat", "description", "createdDate", "lastUpdatedDate", "createdBy", "updatedBy", "objVersion", "enableFlag"];

const filterAttributes = supportedDateFormats.filterAttributes;
const sortAttributes = supportedDateFormats.sortAttributes;



module.exports = (router) => {
  router.route('/supportedDateFormats/')
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
        Promise.all([supportedDateFormats.find(tenantId, filter, orderby, skipCount, +limit), supportedDateFormats.counts(tenantId, filter)])
          .then((supportedDateFormats) => {

            if (supportedDateFormats.length > 0) {
              response.status = "200";
              response.description = "SUCCESS";
              response.totalNoOfPages = Math.ceil(supportedDateFormats[1] / pageSize);
              response.totalNoOfRecords = supportedDateFormats[1];
              response.data = supportedDateFormats[0];

              res.status(200)
                .send(JSON.stringify(response, null, 2));
            } else {
              response.status = "404";
              response.description = "No supportedDateFormats found";
              debug("response: " + JSON.stringify(response));
              res.status(200)
                .send(JSON.stringify(response, null, 2));
            }
          })
          .catch((e) => {
            debug(`failed to fetch all supportedDateFormats ${e}`);
            response.status = "400",
              response.description = `Unable to fetch all supportedDateFormats`
            response.data = e.toString()
            res.status(response.status).send(JSON.stringify(response, null, 2));
          });
      } catch (e) {
        debug(`caught exception ${e}`);
        response.status = "400",
          response.description = `Unable to fetch all supportedDateFormats`
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
