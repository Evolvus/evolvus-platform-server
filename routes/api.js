const debug = require("debug")("evolvus-platform-server:routes:api");
const _ = require("lodash");
const application = require("evolvus-application");
const menu = require("evolvus-menu-group");
const role = require("evolvus-role");
const roleTypeMenuItemMap = require("evolvus-role-type-menu-item-map");

const applicationAttributes = ["applicationName", "applicationId", "description", "enabled", "applicationCode", "createdBy", "createdDate", "logo", "favicon"];
const menuGroupAttributes = ["tenantId", "menuGroupCode", "title", "menuGroupType", "applicationCode"];
const roleAttributes = ["tenantId", "roleName", "roleType", "applicationCode", "description", "activationStatus", "processingStatus", "associatedUsers"];
const menuItemAttributes = ["menuItemCode", "title", "icon", "menuItemType", "applicationCode", "tenantId"];

module.exports = (router) => {
  router.route('/saveApplication')
    .post((req, res, next) => {
      try {
        let body = _.pick(req.body, applicationAttributes);
        body.tenantId = "IVL";
        body.createdBy = "SYSTEM";
        body.createdDate = new Date().toISOString();
        application.save(body).then((app) => {
          debug(`application saved ${app}`);
          res.send(app);
        }).catch((e) => {
          debug(`failed to save ${e}`);
          res.status(400).json({
            error: e.toString()
          });
        });
      } catch (e) {
        debug(`caught exception ${e}`);
        res.status(400).json({
          error: e.toString()
        });
      }
    });

  router.route('/findByCode/:applicationCode')
    .get((req, res, next) => {
      try {
        let codeValue = req.params.applicationCode;
        application.getOne("applicationCode", codeValue).then((app) => {
          if (_.isEmpty(app)) {
            debug(`no application found by this code `, codeValue);
            res.status(204).json({
              message: `no application found by this code ${codeValue}`
            });
          } else {
            debug(`application found ${app}`);
            res.send(app);
          }
        }).catch((e) => {
          debug(`failed to find the appilication by code ${codeValue}`);
          res.status(400).json({
            error: e.toString()
          });
        });
      } catch (e) {
        debug(`caught exception ${e}`);
        res.status(400).json({
          error: e.toString()
        });
      }
    });

  router.route('/getAllApplications')
    .get((req, res, next) => {
      try {
        application.getAll(-1).then((applications) => {
          if (applications.length > 0) {
            res.send(applications);
          } else {
            res.status(204).json({
              message: "No applications found"
            });
          }
        }).catch((e) => {
          debug(`failed to fetch all applications ${e}`);
          res.status(400).json({
            error: e.toString()
          });
        });
      } catch (e) {
        debug(`caught exception ${e}`);
        res.status(400).json({
          error: e.toString()
        });
      }
    });

  router.route("/updateApplication/:id")
    .put((req, res, next) => {
      try {
        application.update(req.params.id, req.body).then((response) => {
          debug(`application updated successfully ${response}`);
          res.send(response);
        }).catch((e) => {
          debug(`failed to update ${e}`);
          res.status(400).json({
            error: e.toString()
          });
        });
      } catch (e) {
        debug(`caught exception ${e}`);
        res.status(400).json({
          error: e.toString()
        });
      }
    });

  router.route("/saveMenuGroup")
    .post((req, res, next) => {
      try {
        let body = _.pick(req.body, menuGroupAttributes);
        application.getOne("applicationCode", body.applicationCode).then((app) => {
          if (_.isEmpty(app)) {
            throw new Error(`No Application with ${body.applicationCode} found`);
          } else {
            menu.save(body).then((menu) => {
              res.send(menu);
            }).catch((e) => {
              res.status(400).send({
                error: e.message
              });
            });
          }
        }).catch((e) => {
          res.status(400).send({
            error: e.message
          });
        });
      } catch (e) {
        res.status(400).send({
          error: e.message
        });
      }
    });

  router.route("/getAllMenuGroup/:applicationCode")
    .get((req, res, next) => {
      try {
        let codeValue = req.params.applicationCode;
        menu.getMany("applicationCode", codeValue).then((menuGroup) => {
          if (menuGroup.length > 0) {
            res.send(menuGroup);
          } else {
            res.send("No menuGroup found");
          }
        }).catch((e) => {
          res.status(400).send(e.message);
        });
      } catch (e) {
        res.status(400).send(e.message);
      }
    });


  router.route("/saveMenuItem")
    .post((req, res, next) => {
      try {
        let body = _.pick(req.body, menuItemAttributes);
        body.createdBy = "SYSTEM";
        body.creationDate = new Date().toISOString();
        application.FindByCode(body.applicationCode).then((app) => {
          if (_.isEmpty(app)) {
            throw new Error(`No Application with ${body.applicationCode} found`);
          } else {
            menu.saveMenuItem(body).then((menu) => {
              res.send(menu);
            }).catch((e) => {
              res.status(400).send({
                error: e.message
              });
            });
          }
        }).catch((e) => {
          res.status(400).send({
            error: e.message
          });
        });
      } catch (e) {
        res.status(400).send({
          error: e.message
        });
      }
    });

  router.route("/saveRole")
    .post((req, res, next) => {
      try {
        let body = _.pick(req.body, roleAttributes);
        application.getOne("applicationCode", body.applicationCode).then((app) => {
          if (_.isEmpty(app)) {
            throw new Error(`No Application with ${body.applicationCode} found`);
          } else {
            role.getOne("roleName", body.roleName).then((roleObj) => {
              if (!_.isEmpty(roleObj)) {
                throw new Error(`RoleName ${body.roleName} is already exists`);
              } else {
                var object = {
                  applicationCode: req.body.applicationCode,
                  tenantId: req.body.tenantId,
                  roleName: req.body.roleName,
                  roleType: req.body.roleType,
                  menuItems: req.body.menuItems
                };
                roleTypeMenuItemMap.save(object).then((obj) => {
                  role.save(body).then((roleObj) => {
                    console.log("roleObject", roleObj);
                    res.send(roleObj);
                  }).catch((e) => {
                    res.status(400).send({
                      error: e.message
                    });
                  });
                }).catch((e) => {
                  res.status(400).send({
                    error: e.message
                  });
                });

              }
            }).catch((e) => {
              res.status(400).send({
                error: e.message
              });
            });
          }
        }).catch((e) => {
          res.status(400).send({
            error: e.message
          });
        });
      } catch (e) {
        res.status(400).send({
          error: e.message
        });
      }
    });
};