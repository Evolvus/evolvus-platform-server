const debug = require("debug")("evolvus-platform-server:routes:api:role");
const _ = require("lodash");
const role = require("./../../index");
const application = require("evolvus-new-application")

const LIMIT = process.env.LIMIT || 10;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const entityIdHeader = "X-ENTITY-ID";
const accessLevelHeader = "X-ACCESS-LEVEL";
const PAGE_SIZE = 10;

const roleAttributes = ["tenantId", "roleName", "applicationCode", "description", "activationStatus", "processingStatus", "associatedUsers", "createdBy", "createdDate", "menuGroup", "lastUpdatedDate", "entityId", "accessLevel"];
const filterAttributes = role.filterAttributes;
console.log("filterAttributes", filterAttributes);
const sortableAttributes = role.sortableAttributes;


module.exports = (router) => {

  router.route("/role")
    .post((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const entityId = req.header(entityIdHeader);
      const accessLevel = req.header(accessLevelHeader);
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      let body = _.pick(req.body, roleAttributes);
      try {
        body.associatedUsers = 5;
        body.tenantId = tenantId;
        body.createdBy = createdBy;
        body.entityId = entityId;
        body.createdDate = new Date().toISOString();
        body.lastUpdatedDate = body.createdDate;
        console.log(body);
        Promise.all([application.find(tenantId, {
          "applicationCode": body.applicationCode
        }, {}, 0, 1), role.find(tenantId, {
          "roleName": body.roleName
        }, {}, 0, 1)]).then((result) => {
          if (_.isEmpty(result[0])) {
            throw new Error(`No Application with ${body.applicationCode} found`);
          }
          if (!_.isEmpty(result[1])) {
            throw new Error(`RoleName ${body.roleName} already exists`);
          }
          role.save(tenantId, body).then((roles) => {
            response.status = "200";
            response.description = "Saved Role Successfully";
            response.data = roles;
            res.status(200)
              .send(JSON.stringify(response, null, 2));
          }).catch((e) => {
            response.status = "400",
              response.description = `Unable to add new role ${body.roleName}. Due to ${e.message}`,
              response.data = e.toString()
            res.status(response.status).send(JSON.stringify(response, null, 2));
          });
        }).catch((e) => {
          response.status = "400",
            response.description = `Unable to add new Role ${body.roleName}. Due to ${e.message}`,
            response.data = e.toString()
          res.status(response.status).send(JSON.stringify(response, null, 2));
        });
      } catch (e) {
        response.status = "400",
          response.description = `Unable to add new Role ${body.roleName}. Due to ${e.message}`,
          response.data = e.toString()
        res.status(response.status).send(JSON.stringify(response, null, 2));

      }
    });

  router.route('/role/')
    .get((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      console.log(tenantId, "tenantId");
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const entityId = req.header(entityIdHeader);
      const accessLevel = req.header(accessLevelHeader);
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
      console.log(skipCount, "skipCount");
      var filter = _.pick(req.query, filterAttributes);
      console.log("filterAttributes", filter);
      var sort = _.get(req.query, "sort", {});
      var orderby = sortable(sort);
      try {
        Promise.all([role.find(tenantId, filter, orderby, skipCount, +limit), role.counts(tenantId, entityId, accessLevel, filter)])
          .then((result) => {
            console.log("resulttttttttttttttttttttt", result);
            if (result[0].length > 0) {
              response.status = "200";
              response.description = "SUCCESS";
              response.totalNoOfPages = Math.ceil(result[1] / pageSize);
              response.totalNoOfRecords = result[1];
              response.data = result[0];
              res.status(200)
                .send(JSON.stringify(response, null, 2));
            } else {
              console.log("else");
              response.status = "404";
              response.description = "No role found";
              debug("response: " + JSON.stringify(response));
              res.status(response.status)
                .send(JSON.stringify(response, null, 2));
            }
          })
          .catch((e) => {
            console.log("catch1", e);
            debug(`failed to fetch all roles ${e}`);
            response.status = "400",
              response.description = `Unable to fetch all roles`
            response.data = e.toString()
            res.status(response.status).send(JSON.stringify(response, null, 2));
          });
      } catch (e) {
        console.log("catch2", e);
        debug(`caught exception ${e}`);
        response.status = "400",
          response.description = `Unable to fetch all roles`
        response.data = e.toString()
        res.status(response.status).send(JSON.stringify(response, null, 2));
      }
    });

  router.route("/role")
    .put((req, res, next) => {
      try {
        let body = _.pick(req.body.roleData, roleAttributes);
        Promise.all([application.getOne("applicationCode", body.applicationCode), role.getOne("roleName", body.roleName)])
          .then((result) => {
            if (_.isEmpty(result[0])) {
              throw new Error(`No Application with ${body.applicationCode} found`);
            }
            if ((!_.isEmpty(result[1])) && (result[1]._id != req.params.id)) {
              throw new Error(`RoleName ${body.roleName} already exists`);
            }
            let updated = {
              deletedFlag: "1"
            };
            role.update(req.params.id, updated).then((updatedRole) => {
              res.json(updatedRole);
            }).catch((e) => {
              res.status(400).json({
                error: e.toString()
              });
            });
          }).catch((e) => {
            res.status(400).json({
              error: e.toString()
            });
          });
      } catch (e) {
        res.status(400).json({
          error: e
        });
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