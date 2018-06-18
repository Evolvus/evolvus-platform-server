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
        var MenuObj = new menu(body);
        body.tenantId = "IVL";
        body.associatedUsers = 5;
        body.processingStatus = "unauthorized";
        body.createdBy = "SYSTEM";
        body.createdDate = new Date().toISOString();
        body.activationStatus = "active";

        application.getOne("applicationCode", body.applicationCode).then((app) => {
          if (_.isEmpty(app)) {
            throw new Error(`No Application with ${body.applicationCode} found`);
          } else {
            role.getOne("roleName", body.roleName).then((roleObj) => {
              if (!_.isEmpty(roleObj)) {
                throw new Error(`RoleName ${body.roleName} is already exists`);
              } else {
                role.save(body).then((obj) => {
                  res.json(obj);
                }).catch((e) => {
                  res.status(400).json({
                    error: e.toString()
                  });
                });
              }
            }).catch((e) => {
              res.status(400).json({
                error: e.toString()
              });
            });
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
        application.getOne("applicationCode", body.applicationCode).then((app) => {
          if (_.isEmpty(app)) {
            throw new Error(`No Application found for the code ${body.applicationCode}`);
          } else {
            role.getOne("roleName", body.roleName).then((roleObj) => {
              if (!_.isEmpty(roleObj)) {
                throw new Error(`RoleName ${body.roleName} already exists`);
              } else {
                role.update(req.params.id, body).then((roleObj) => {
                  res.json(roleObj);
                }).catch((e) => {
                  res.status(400).json({
                    error: e
                  });
                });
              }
            }).catch((e) => {
              res.status(400).json({
                error: e
              });
            });
          }
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
}