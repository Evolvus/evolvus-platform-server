const debug = require("debug")("evolvus-platform-server:routes:api:entity");
const _ = require("lodash");
const entity = require("evolvus-entity");
const randomString = require("randomstring");
const entityAttributes = ["tenantId", "name", "entityCode", "entityId", "description", "processingStatus", "enableFlag", "createdBy", "createdDate", "parent", "acessLevel","lastUpdatedDate"];
const headerAttributes = ["tenantid", "entitycode", "accesslevel"];

module.exports = (router) => {
  router.route('/entity')
    .post((req, res, next) => {
      try {
        let body = _.pick(req.body, entityAttributes);
        let header = _.pick(req.headers, headerAttributes);
        body.tenantId = header.tenantid;
        body.accessLevel = header.accesslevel;
        body.entityCode = header.entitycode;
        body.createdBy = "User";
        body.createdDate = new Date().toISOString();
        body.lastUpdatedDate=body.createdDate;
        entity.getOne("name", body.parent).then((result) => {
          if (_.isEmpty(result)) {
            throw new Error(`No ParentEntity found with ${body.parent}`);
          }
          var randomId = randomString.generate(5);
          if (result.enableFlag) {
            var aces = parseInt(result.accessLevel) + 1;
            body.accessLevel = JSON.stringify(aces);
            body.entityId = result.entityId + randomId;
            entity.save(body).then((ent) => {
              res.json({
                savedEntityObject: ent,
                message: `New Entity ${body.name.toUpperCase()} has been added successfully and sent for the supervisor authorization.`
              });
            }).catch((e) => {
              res.status(400).json({
                error: e.toString(),
                message: `Unable to add new Entity ${body.name}. Due to ${e.message}`
              });
            });
          } else {
            throw new Error(`ParentEntity is disabled`);
          }
        }).catch((e) => {
          res.status(400).json({
            error: e.toString(),
            message: `Unable to add new Entity ${body.name}. Due to ${e.message}`
          });
        });
      } catch (e) {
        res.status(400).json({
          error: e.toString(),
          message: `Unable to add new Entity ${body.name}. Due to ${e.message}`
        });
      }
    });


  router.route('/entity')
    .get((req, res, next) => {
      try {
        let header = _.pick(req.headers, headerAttributes);
        entity.getAll(header.tenantid, header.entitycode, header.accesslevel).then((entities) => {
          if (entities.length > 0) {
            res.send(entities);
          } else {
            res.send([]);
          }
        }).catch((e) => {
          debug(`failed to fetch entities ${e}`);
          res.status(400).send(JSON.stringify({
            error: e.toString()
          }));
        });
      } catch (e) {
        debug(`caught exception ${e}`);
        res.status(400).send(JSON.stringify({
          error: e.toString()
        }));
      }
    });

  router.route("/entity/:id")
    .put((req, res, next) => {
      try {
        let body = _.pick(req.body, entityAttributes);
        body.updatedBy = "User";
        body.lastUpdatedDate = new Date().toISOString();
        entity.update(req.params.id, body).then((updatedEntity) => {
          res.json({
            updatedEntityObject: updatedEntity,
            message: `${body.name} Entity has been modified successful and sent for the supervisor authorization.`
          });
        }).catch((e) => {
          res.status(400).json({
            error: e.toString(),
            message: `Unable to modify entity ${body.name}. Due to ${e.message}`
          });
        });
      } catch (e) {
        res.status(400).json({
          error: e.toString(),
          message: `Unable to modify entity ${body.name}. Due to ${e.message}`
        });
      }
    });

  router.route('/entity/filter')
    .get((req, res, next) => {
      try {
        entity.filterByEntityDetails(req.query).then((entity) => {
          res.send(entity);
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

  router.route('/entity/find')
    .get((req, res, next) => {
      try {
        let entityName = req.query.name;
        entity.getOne("name", entityName).then((entity) => {
          res.json(entity);
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
}
