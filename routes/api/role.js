const debug = require("debug")("evolvus-platform-server:routes:api:role");
const _ = require("lodash");
const role = require("evolvus-role");
const application = require("evolvus-application");

const roleAttributes = ["tenantId", "roleName", "applicationCode", "description", "activationStatus", "processingStatus", "associatedUsers", "createdBy", "createdDate", "menuGroup","lastUpdatedDate"];
const headerAttributes = ["tenantid", "entitycode", "accesslevel"];
module.exports = (router) => {
  router.route("/role")
    .post((req, res, next) => {
      try {
        let body = _.pick(req.body, roleAttributes);
        let header = _.pick(req.headers, headerAttributes);
        body.tenantId = header.tenantid;
        body.entityCode = header.entitycode;
        body.accessLevel = header.accesslevel;
        body.processingStatus = "PENDING_AUTHORIZATION";
        body.associatedUsers = 5;
        body.createdBy = "SYSTEM";
        body.createdDate = new Date().toISOString();
        body.lastUpdatedDate = body.createdDate;
        Promise.all([application.getOne("applicationCode", body.applicationCode), role.getOne("roleName", body.roleName)])
          .then((result) => {
            if (_.isEmpty(result[0])) {
              throw new Error(`No Application with ${body.applicationCode} found`);
            }
            if (!_.isEmpty(result[1])) {
              throw new Error(`RoleName ${body.roleName} already exists`);
            }
            role.save(body).then((obj) => {
              res.json({
                savedRoleObject: obj,
                message: `New role ${body.roleName.toUpperCase()} has been added successfully for the application ${body.applicationCode} and sent for the supervisor authorization.`
              });
            }).catch((e) => {
              res.status(400).json({
                error: e.toString(),
                message: `Unable to add new role ${body.roleName}. Due to ${e.message}`
              });
            });
          }).catch((e) => {
            res.status(400).json({
              error: e.toString(),
              message: `Unable to add new role ${body.roleName}. Due to ${e.message}`
            });
          });
      } catch (e) {
        res.status(400).json({
          error: e.toString(),
          message: `Unable to add new role ${body.roleName}. Due to ${e.message}`
        });
      }
    });

  router.route('/role')
    .get((req, res, next) => {
      try {
        let header = _.pick(req.headers, headerAttributes);
        role.getAll(header.tenantid, header.entitycode, header.accesslevel).then((roles) => {
          if (roles.length > 0) {
            res.json(roles);
          } else {
            res.send([]);       
          }
        }).catch((e) => {
          res.status(400).json({
            error: e.toString()
          });
        });
      } catch (e) {
        res.status(400).json({
          error: e.toString()
        });
      }
    });

  router.route("/role/:id")
    .put((req, res, next) => {
      try {
        let body = _.pick(req.body.roleData, roleAttributes);
        body.lastUpdatedDate=new Date().toISOString();
        body.updatedBy="SYSTEM";
        body.processingStatus="PENDING_AUTHORIZATION";
        Promise.all([application.getOne("applicationCode", body.applicationCode), role.getOne("roleName", body.roleName)])
          .then((result) => {
            if (_.isEmpty(result[0])) {
              throw new Error(`No Application with ${body.applicationCode} found`);
            }
            if ((!_.isEmpty(result[1])) && (result[1]._id != req.params.id)) {
              throw new Error(`RoleName ${body.roleName} already exists`);
            }
            role.update(req.params.id, body).then((updatedRole) => {
              res.json({
                updatedRoleObject: updatedRole,
                message: `${body.roleName} role has been modified successfully for the application ${body.applicationCode} and sent for the supervisor authorization.`
              });
            }).catch((e) => {
              res.status(400).json({
                error: e.toString(),
                message: `Unable to modify role ${body.roleName}. Due to ${e.message}`
              });
            });
          }).catch((e) => {
            res.status(400).json({
              error: e.toString(),
              message: `Unable to modify role ${body.roleName}. Due to ${e.message}`
            });
          });
      } catch (e) {
        res.status(400).json({
          error: e.toString(),
          message: `Unable to modify role ${body.roleName}. Due to ${e.message}`
        });
      }
    });

  router.route('/role/find')
    .get((req, res, next) => {
      try {
        let roleName = req.query.roleName;
        role.getOne("roleName", roleName).then((role) => {
          res.json(role);
        }).catch((e) => {
          res.status(400).json({
            error: e.toString()
          });
        });
      } catch (e) {
        res.status(400).json({
          error: e.toString()
        });
      }
    });

  router.route("/role/delete/:id")
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

  router.route('/role/filter')
    .get((req, res, next) => {
      try {
        role.filterByRoleDetails(req.query).then((roles) => {
          res.send(roles);
        }).catch((e) => {
          res.status(400).send(JSON.stringify({
            error: e.toString()
          }));
        });
      } catch (e) {
        res.status(400).send(JSON.stringify({
          error: e.toString()
        }));
      }
    });
};
