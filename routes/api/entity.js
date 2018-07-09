const debug = require("debug")("evolvus-platform-server:routes:api:entity");
const _ = require("lodash");
const entity = require("evolvus-entity");
const randomString = require("randomstring");

const LIMIT = process.env.LIMIT || 10;
const ORDER_BY = process.env.ORDER_BY || {
  lastUpdatedDate: -1
}
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const PAGE_SIZE = 10;
const entityIdHeader = "X-ENTITY-ID";
const accessLevelHeader = "X-ACCESS-LEVEL"
const entityAttributes = ["tenantId", "name", "entityCode", "entityId", "description", "processingStatus", "enableFlag", "createdBy", "createdDate", "parent", "acessLevel", "lastUpdatedDate"];
const filterAttributes = entity.filterAttributes;
const sortAttributes = entity.sortAttributes;

module.exports = (router) => {
  router.route('/entity')
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
      let body = _.pick(req.body, entityAttributes);
      try {
        body.createdBy = createdBy;
        body.createdDate = new Date().toISOString();
        body.lastUpdatedDate = body.createdDate;
        entity.find(tenantId, entityId, accessLevel, {
          "name": body.parent
        }, {}, 0, 1).then((result) => {
          if (_.isEmpty(result)) {
            throw new Error(`No ParentEntity found with ${body.parent}`);
          }
          var randomId = randomString.generate(5);
          if (result[0].enableFlag == `1`) {
            var aces = parseInt(result[0].accessLevel) + 1;
            body.accessLevel = JSON.stringify(aces);
            body.entityId = result[0].entityId + randomId;
            entity.find(tenantId, entityId, accessLevel, {
                "name": body.name,
                "entityCode": body.entityCode
              }, {}, 0, 1)
              .then((result) => {
                if (!_.isEmpty(result[0])) {
                  throw new Error(`Entity ${body.name},${body.entityCode} already exists`);
                }
                entity.save(tenantId, body).then((ent) => {
                  response.status = "200";
                  response.description = `New Entity ''${body.name}' has been added successfully and sent for the supervisor authorization`;
                  response.data = ent;
                  res.status(200)
                    .send(JSON.stringify(response, null, 2));
                }).catch((e) => {
                  response.status = "400",
                    response.description = `Unable to add new Entity ${body.name}. Due to ${e.message}`,
                    response.data = e.toString()
                  res.status(400).send(JSON.stringify(response, null, 2));
                });
              }).catch((e) => {
                response.status = "400",
                  response.description = `Unable to add new Entity ${body.name}. Due to ${e.message}`,
                  response.data = e.toString()
                res.status(400).send(JSON.stringify(response, null, 2));
              });
          } else {
            throw new Error(`ParentEntity is disabled`);
          }
        }).catch((e) => {
          response.status = "400",
            response.description = `Unable to add new Entity ${body.name}. Due to ${e.message}`,
            response.data = e.toString()
          res.status(400).send(JSON.stringify(response, null, 2));
        });
      } catch (e) {
        response.status = "400",
          response.description = `Unable to add new Entity ${body.name}. Due to ${e.message}`,
          response.data = e.toString()
        res.status(400).send(JSON.stringify(response, null, 2));
      }
    });
  router.route('/entity/')
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
        Promise.all([entity.find(tenantId, entityId, accessLevel, filter, orderby, skipCount, +pageSize), entity.counts(tenantId, entityId, accessLevel, filter)])
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
              response.status = "200";
              response.data = [];
              response.totalNoOfRecords = result[1];
              response.totalNoOfPages = 0;
              response.description = "No entity found";
              debug("response: " + JSON.stringify(response));
              res.status(response.status)
                .send(JSON.stringify(response, null, 2));
            }
          })
          .catch((e) => {
            debug(`failed to fetch all entity ${e}`);
            response.status = "400";
            response.description = `Unable to fetch all entities`;
            response.data = e.toString();
            res.status(response.status).send(JSON.stringify(response, null, 2));
          });
      } catch (e) {
        debug(`caught exception ${e}`);
        response.status = "400";
        response.description = `Unable to fetch all entities`;
        response.data = e.toString();
        res.status(response.status).send(JSON.stringify(response, null, 2));
      }
    });

  router.route("/entity/:entityCode")
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
        let body = _.pick(req.body, entityAttributes);
        body.updatedBy = req.header(userHeader);;
        body.lastUpdatedDate = new Date().toISOString();
        entity.find(tenantId, entityId, accessLevel, {
            "name": body.name,
            "entityCode": body.entityCode
          }, {}, 0, 1)
          .then((result) => {
            if (_.isEmpty(result[0])) {
              throw new Error(`Entity ${body.name},  already exists `);
            }
            if ((!_.isEmpty(result[0])) && (result[0].entityCode != req.params.entityCode)) {
              throw new Error(`Entity ${body.name} already exists`);
            }
            entity.update(tenantId, body.entityCode, body).then((updatedEntity) => {
              response.status = "200";
              response.description = `${body.name} Entity has been modified successful and sent for the supervisor authorization.`;
              response.data = body;
              res.status(200)
                .send(JSON.stringify(response, null, 2));

            }).catch((e) => {
              response.status = "400",
                response.description = `Unable to modify entity ${body.name}. Due to ${e.message}`
              response.data = e.toString()
              res.status(response.status).send(JSON.stringify(response, null, 2));
            });
          }).catch((e) => {
            response.status = "400",
              response.description = `Unable to modify entity ${body.name}. Due to ${e.message}`
            response.data = e.toString()
            res.status(response.status).send(JSON.stringify(response, null, 2));
          });
      } catch (e) {
        response.status = "400",
          response.description = `Unable to modify entity ${body.name}. Due to ${e.message}`
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