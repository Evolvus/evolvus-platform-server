const debug = require("debug")("evolvus-platform-server:routes:api:entity");
const _ = require("lodash");
const entity = require("@evolvus/evolvus-entity");
const randomString = require("randomstring");

const LIMIT = process.env.LIMIT || 10;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const PAGE_SIZE = 10;
const entityIdHeader = "X-ENTITY-ID";
const accessLevelHeader = "X-ACCESS-LEVEL"
const entityAttributes = ["tenantId", "name", "entityCode", "entityId", "wfInstanceId", "wfInstanceStatus", "description", "processingStatus", "enableFlag", "createdBy", "createdDate", "parent", "acessLevel", "lastUpdatedDate"];
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

        entity.save(tenantId, entityId, accessLevel, body).then((ent) => {
          response.status = "200";
          response.description = `New entiy ${body.name.toUpperCase()} has been added successfully  and sent for the supervisor authorization.`;
          response.data = ent;
          res.status(200)
            .json(response);
        }).catch((e) => {
          response.status = "400",
            response.description = `Unable to add new Entity ${body.name}. Due to ${e}`,
            response.data = e;
          res.status(response.status).json(response);
        });
      } catch (e) {
        response.status = "400",
          response.description = `Unable to add new Entity ${body.name}. Due to ${e}`,
          response.data = e;
        res.status(response.status).send(JSON.stringify(response, null, 2));
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
        var filter = _.pick(req.query, filterAttributes);
        var sort = _.get(req.query, "sort", {});
        var orderby = sortable(sort);
        limitc = (+pageSizec < limitc) ? pageSizec : limitc;

        Promise.all([entity.find(tenantId, entityId, accessLevel, filter, orderby, skipCount, limitc), entity.find(tenantId, entityId, accessLevel, filter,0,0)])
          .then((result) => {
            if (result[0].length > 0) {
              response.status = "200";
              response.description = "SUCCESS";
              response.totalNoOfPages = Math.ceil(result[1] / pageSize);
              response.totalNoOfRecords = result[1];
              response.data = result[0];
              res.status(200)
                .json(response);
            } else {
              response.status = "200";
              response.description = "No entity found";
                response.data=[];
              debug("response: " + JSON.stringify(response));
              res.status(response.status)
                .json(response);
            }
          })
          .catch((e) => {
            debug(`failed to fetch all entity ${e}`);
            response.status = "400",
              response.description = `Unable to fetch all entities`
            response.data = e.toString()
            res.status(response.status).json(response);
          });
      } catch (e) {
        debug(`caught exception ${e}`);
        response.status = "400",
          response.description = `Unable to fetch all entities`
        response.data = e.toString()
        res.status(response.status).json(response);
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
        "data": []
      };
      debug("query: " + JSON.stringify(req.query));
      try {
        let body = _.pick(req.body, entityAttributes);
        body.updatedBy = req.header(userHeader);;
        body.lastUpdatedDate = new Date().toISOString();
        entity.update(tenantId, body.entityCode, body).then((updatedEntity) => {
          response.status = "200";
          response.description = `${body.name} Entity has been modified successful and sent for the supervisor authorization.`;
          response.data = body;
          res.status(200)
            .json(response);

        }).catch((e) => {
          response.status = "400",
            response.description = `Unable to modify entity ${body.name}. Due to ${e}`
          response.data = e.toString()
          res.status(response.status).json(response);
        });
      } catch (e) {
        response.status = "400",
          response.description = `Unable to modify entity ${req.body.name}. Due to ${e}`
        response.data = e.toString()
        res.status(response.status).json(response);
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
