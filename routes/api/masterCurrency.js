const debug = require("debug")("evolvus-platform-server:routes:api:masterCurrency");
const _ = require("lodash");
const masterCurrency = require("@evolvus/evolvus-master-currency");
const LIMIT = process.env.LIMIT || 10;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const PAGE_SIZE = 10;

const masterCurrencyAttributes = ["currencyCode", "currencyName", "decimalDigit", "delimiter", "createdDate", "lastUpdatedDate", "createdBy", "updatedBy", "objVersion", "enableFlag", "currencyLocale"];

const filterAttributes = masterCurrency.filterAttributes;
const sortAttributes = masterCurrency.sortableAttributes;

module.exports = (router) => {
  router.route('/masterCurrency/')
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
        Promise.all([masterCurrency.find(tenantId, filter, orderby, skipCount, limit), masterCurrency.counts(tenantId, filter)])
          .then((result) => {
            if (result[0].length > 0) {
              response.status = "200";
              response.description = "SUCCESS";
              response.totalNoOfPages = Math.ceil(result[1] / pageSize);
              response.totalNoOfRecords = result[1];
              response.data = result[0];
              res.status(200)
                .send(JSON.stringify(response, null, 2));
            } else {
              response.status = "400";
              response.description = "No masterCurrency found";
              debug("response: " + JSON.stringify(response));
              res.status(400)
                .send(JSON.stringify(response, null, 2));
            }
          })
          .catch((e) => {
            debug(`failed to fetch all masterCurrency ${e}`);
            response.status = "400",
              response.description = `Unable to fetch all masterCurrency`
            response.data = e.toString()
            res.status(response.status).send(JSON.stringify(response, null, 2));
          });
      } catch (e) {
        debug(`caught exception ${e}`);
        response.status = "400",
          response.description = `Unable to fetch all masterCurrency`
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
