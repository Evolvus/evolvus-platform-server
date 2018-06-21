const debug = require("debug")("evolvus-platform-server:routes:api:entity");
const _ = require("lodash");
const entity = require("evolvus-entity");
const entityAttributes = ["tenantId", "name", "entityCode", "enable", "description", "createdBy", "createdDate", "processingStatus", "parent", "level"];

var limit = process.env.LIMIT || -1;

module.exports = (router) => {
  router.route('/entity')
    .post((req, res, next) => {
      try {
        let body = _.pick(req.body, entityAttributes);
        body.tenantId = "IVL";
        body.createdBy = "User";
        body.createdDate = new Date().toISOString();
        entity.getOne("entityCode", body.parent).then((result) => {
          if (_.isEmpty(result)) {
            throw new Error(`No ParentEntity found with ${body.parent}`);
          }
          if (result.enable) {
            body.level = result.level + 1;
            entity.save(body).then((ent) => {
              res.send(JSON.stringify(ent));
            }).catch((e) => {
              res.status(400).send(JSON.stringify({
                error: e.toString()
              }));
            });
          } else {
            throw new Error(`ParentEntity is disabled`);
          }
        }).catch((e) => {
          res.status.send(JSON.stringify({
            error: e.message
          }));
        });
      } catch (e) {
        res.status(400).send(JSON.stringify({
          error: e.toString()
        }));
      }
    });

  router.route('/entity')
    .get((req, res, next) => {
      try {
        entity.getAll(limit).then((entities) => {
          if (entities.length > 0) {
            res.send(entities);
          } else {
            res.status(204).send(JSON.stringify({
              message: "No Entities found"
            }));
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

}