const debug = require("debug")("evolvus-platform-server:routes:api:lookup");
const _ = require("lodash");
const lookup = require("@evolvus/evolvus-lookup");
const ORDER_BY = process.env.ORDER_BY || {
  lastUpdatedDate: -1
};
const LIMIT = process.env.LIMIT || 10;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const PAGE_SIZE = 10;

const lookupAttributes = ["lookupCode", "value", "enabled", "createdBy", "createdDate"];
const filterAttributes = lookup.filterAttributes;
const sortAttributes = lookup.sortAttributes;


module.exports = (router) => {

  router.route('/lookup/')
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
      var skipCount = (pageNo - 1) * pageSize;
      var filter = _.pick(req.query, filterAttributes);
      var sort = _.get(req.query, "sort", {});
      var orderby = sortable(sort);
      //api/user?userName=xys&lookupId=12312


      try {

        lookup.find(tenantId, createdBy, ipAddress, filter, orderby, skipCount, limit)
          .then((lookups) => {
            if (lookups.length > 0) {
              response.status = "200";
              response.description = "SUCCESS";
              response.data = lookups;
              res.status(200)
                .send(JSON.stringify(response, null, 2));
            } else {
              response.status = "200";
              response.description = "No lookup found";
              debug("response: " + JSON.stringify(response));
              res.status(response.status)
                .send(JSON.stringify(response, null, 2));

            }
          })
          .catch((e) => {
            debug(`failed to fetch all lookup ${e}`);
            response.status = "400";
            response.description = `Unable to fetch all lookup`;
            response.data = e.toString();
            res.status(response.status).send(JSON.stringify(response, null, 2));
          });
      } catch (e) {
        debug(`failed to fetch all lookup ${e}`);
        response.status = "400";
        response.description = `Unable to fetch all lookup`;
        response.data = e.toString();
        res.status(response.status).send(JSON.stringify(response, null, 2));
      };
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
        body.createdBy = createdBy;
        body.createdDate = new Date().toISOString();
        body.lastUpdatedDate = body.createdDate;

        lookup.save(tenantId, createdBy, ipAddress, body).then((ent) => {
          response.status = "200";
          response.description = "SUCCESS";
          response.data = ent;
          res.status(200)
            .send(JSON.stringify(response, null, 2));
        }).catch((e) => {

          response.status = "400",
            response.description = `Unable to add new lookup ${body.lookupCode}. Due to ${e.message}`,
            response.data = e.toString()
          res.status(response.status).send(JSON.stringify(response, null, 2));
        });
      } catch (e) {
        response.status = "400",
          response.description = `Unable to add new lookup ${body.lookupCode}. Due to ${e.message}`,
          response.data = e.toString()
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
