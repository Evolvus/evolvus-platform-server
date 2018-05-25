const debug = require("debug")("evolvus-platform-server:routes:api");
const _ = require("lodash");
const application = require("evolvus-application");

const applicationAttributes = ["applicationName", "applicationId", "description", "enabled", "applicationCode", "createdBy", "createdDate", "logo", "favicon"];

module.exports = (router) => {
  router.route('/saveApplication')
    .post((req, res, next) => {
      try {
        let body = _.pick(req.body, applicationAttributes);
        body.createdBy = "SYSTEM";
        body.createdDate = new Date().toISOString();
        application.saveApplication(body).then((app) => {
          res.send(app);
        }).catch((e) => {
          res.status(400).send(e.message);
        });
      } catch (e) {
        res.send(e);
      }
    });

  router.route('/findByCode/:applicationCode')
    .get((req, res, next) => {
      try {
        let codeValue = req.params.applicationCode;
        application.FindByCode(codeValue).then((app) => {
          res.send(app);
        }).catch((e) => {
          res.status(400).send(e);
        });
      } catch (e) {
        res.send(e);
      }
    });

  router.route('/findByCodeAndEnabled')
    .get((req, res, next) => {
        try {
          let codeValue = _.pick(req.body, ['code','enable']);
          application.findByCodeAndEnabled(codeValue,enable).then((app) => {
            res.send(app);
          }).catch((e) => {
            res.status(400).send(e);
          });
        }catch (e) {
          res.send(e);
        }
      });

  router.route('/getAllApplications')
    .get((req, res, next) => {
      try {
        application.getAll().then((applications) => {
          if (applications.length > 0) {
            res.send(applications);
          } else {
            res.send("No applications found");
          }
        }).catch((e) => {
          res.status(400).send(e.message);
        });
      } catch (e) {
        res.status(400).send(e.message);
      }
    });

  router.route("/updateApplication/:id")
    .put((req, res, next) => {
      try {
        application.updateApplication(req.params.id, req.body).then((response) => {
          res.send(response);
        }).catch((e) => {
          res.status(400).send(e);
        });
      } catch (e) {
        res.status(400).send(e);
      }
    });
};
