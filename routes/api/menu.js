const debug = require("debug")("evolvus-platform-server:routes:api:menu");
const _ = require("lodash");
const menu = require("evolvus-menu");
const application = require("evolvus-application");

const menuAttributes = ["menuGroupCode", "title", "applicationCode", "tenantId","menuItems","createdBy","createdDate","updatedBy","lastUpdatedDate"];

module.exports = (router) => {
    router.route("/menuItem")
        .post((req, res, next) => {
            try {
                let body = _.pick(req.body, menuAttributes);
                body.createdBy = "SYSTEM";
                body.createdDate = new Date().toISOString();
                application.getOne("applicationCode", body.applicationCode).then((app) => {
                    if (_.isEmpty(app)) {
                        throw new Error(`No Application with ${body.applicationCode} found`);
                    } else {
                        menu.save(body).then((menuObj) => {
                            res.send(menuObj);
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

    router.route('/menuItem')
        .get((req, res, next) => {
            try {
                menuItem.getAll(-1).then((menuItems) => {
                    if (menuItems.length > 0) {
                        res.send(menuItems);
                    } else {
                        res.send("No menuItem found");
                    }
                }).catch((e) => {
                    res.status(400).send(e.message);
                });
            } catch (e) {
                res.status(400).send(e.message);
            }
        });

    router.route('/menuItem/find/:applicationCode')
        .get((req, res, next) => {
            try {
                let codeValue = req.params.applicationCode;
                menuItem.getMany("applicationCode", codeValue).then((app) => {
                    res.json(app);
                }).catch((e) => {
                    res.status(400).send(e);
                });
            } catch (e) {
                res.status(400).send(e);
            }
        });



};
