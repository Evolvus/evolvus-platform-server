const debug = require("debug")("evolvus-platform-server:routes:api");
const _ = require("lodash");
const menuGroup = require("evolvus-menu-group");
const application = require("evolvus-application");


const menuGroupAttributes = ["tenantId", "menuGroupCode", "title", "menuGroupType", "applicationCode"];

module.exports = (router) => {
    router.route("/menuGroup")
        .post((req, res, next) => {
            try {
                let body = _.pick(req.body, menuGroupAttributes);
                application.getOne("applicationCode", body.applicationCode).then((app) => {
                    if (_.isEmpty(app)) {
                        throw new Error(`No Application with ${body.applicationCode} found`);
                    } else {
                        menuGroup.save(body).then((menu) => {
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

    router.route("/menuGroup/find")
        .get((req, res, next) => {
            try {
                let codeValue = req.params.applicationCode;
                menuGroup.getMany("applicationCode", codeValue).then((menuGroup) => {
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

};
