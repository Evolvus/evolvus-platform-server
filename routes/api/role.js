const debug = require("debug")("evolvus-platform-server:routes:api:role");
const _ = require("lodash");
const role = require("evolvus-role");
const application = require("evolvus-application");

const roleAttributes = ["tenantId", "roleName", "applicationCode", "description", "activationStatus", "processingStatus", "associatedUsers", "createdBy", "createdDate", "menuGroup"];

module.exports = (router) => {
  router.route("/role")
    .post((req, res, next) => {
      try {
        let body = _.pick(req.body, roleAttributes);
        body.tenantId = "IVL";
        body.associatedUsers = 5;
        body.processingStatus = "unauthorized";
        body.createdBy = "SYSTEM";
        body.createdDate = new Date().toISOString();
        body.activationStatus = "active";

        Promise.all([application.getOne("applicationCode", body.applicationCode), role.getOne("roleName", body.roleName)])
          .then((result) => {
            if (_.isEmpty(result[0])) {
              throw new Error(`No Application with ${body.applicationCode} found`);
            }
            if (!_.isEmpty(result[1])) {
              throw new Error(`RoleName ${body.roleName} already exists`);
            }
            role.save(body).then((obj) => {
              res.json(obj);
            }).catch((e) => {
              res.status(400).json({
                error: e.toString()
              });
            });
          }).catch((e) => {
            console.log(e);
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

  router.route('/role')
    .get((req, res, next) => {
      try {
        role.getAll(-1).then((roles) => {
          if (roles.length > 0) {
            res.send(roles);
          } else {
            res.send("No roles found");
          }
        }).catch((e) => {
          res.status(400).json({
            error: e.message
          });
        });
      } catch (e) {
        res.status(400).json({
          error: e.message
        });
      }
    });

  router.route("/role/:id")
    .put((req, res, next) => {
      try {
        let body = _.pick(req.body, roleAttributes);
        Promise.all([application.getOne("applicationCode", body.applicationCode), role.getOne("roleName", body.roleName)])
          .then((result) => {
            if (_.isEmpty(result[0])) {
              throw new Error(`No Application with ${body.applicationCode} found`);
            }
            if ((!_.isEmpty(result[1])) && (result[1]._id != req.params.id)) {
              throw new Error(`RoleName ${body.roleName} already exists`);
            }
            role.update(req.params.id, body).then((updatedRole) => {
              res.json(updatedRole);
            }).catch((e) => {
              res.status(400).json({
                error: e.toString()
              });
            });
          }).catch((e) => {
            console.log(e);
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

  router.route('/role/find')
    .get((req, res, next) => {
      try {
        let roleName = req.query.roleName;
        role.getOne("roleName", roleName).then((role) => {
          res.json(role);
        }).catch((e) => {
          res.status(400).json({
            error: e
          });
        });
      } catch (e) {
        res.status(400).json({
          error: e
        });
      }
    });

  router.route("/role/:id")
    .delete((req, res, next) => {
      try {
        let body = _.pick(req.body, roleAttributes);
        body.updatedBy = "SYSTEM";
        body.lastUpdatedDate = new Date().toISOString();
        Promise.all([application.getOne("applicationCode", body.applicationCode), role.getOne("roleName", body.roleName)])
          .then((result) => {
            if (_.isEmpty(result[0])) {
              throw new Error(`No Application with ${body.applicationCode} found`);
            }
            if ((!_.isEmpty(result[1])) && (result[1]._id != req.params.id)) {
              throw new Error(`RoleName ${body.roleName} already exists`);
            }
            var obj = {
              deletedFlag: 1
            }
            role.update(req.params.id, obj).then((updatedRole) => {
              res.json(updatedRole);
            }).catch((e) => {
              res.status(400).json({
                error: e.toString()
              });
            });
          }).catch((e) => {
            console.log(e);
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

}
