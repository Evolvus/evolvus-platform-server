const debug = require("debug")("evolvus-platform-server:routes:api");
const _ = require("lodash");
const application = require("evolvus-application");
const menu = require("evolvus-menu");

const applicationAttributes = ["tenantId", "applicationName", "applicationId", "description", "enabled", "applicationCode", "createdBy", "createdDate", "logo", "favicon"];
const menuGroupAttributes = ["menuGroupId", "menuGroupCode", "title", "icon", "menuGroupType", "applicationCode"];
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

  // router.route('/findByCode/:menuGroupCode')
  //   .get((req, res, next) => {
  //     try {
  //       let codeValue = req.params.menuGroupCode;
  //       menuGroup.FindByCode(codeValue).then((app) => {
  //         res.send(app);
  //       }).catch((e) => {
  //         res.status(400).send(e);
  //       });
  //     } catch (e) {
  //       res.send(e);
  //     }
  //   });
  // router.route("/saveMenuGroupItemMap")
  // .post((req, res, next)=>{
  //   try{
  //     let body = _.pick(req.body, menuGroupItemMapAttributes);
  //     application.FindByCode(body.applicationCode).then((app) => {
  //       if (_.isEmpty(app)) {
  //         throw new Error(`No Application with ${body.applicationCode} found`);
  //   }
  // }
  // })

  router.route("/saveMenuGroup")
    .post((req, res, next) => {
      try {
        let body = _.pick(req.body, menuGroupAttributes);
        application.FindByCode(body.applicationCode).then((app) => {
          if (_.isEmpty(app)) {
            throw new Error(`No Application with ${body.applicationCode} found`);
          } else {
            menu.saveMenuGroup(body).then((menu) => {
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

};