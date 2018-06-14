const debug = require("debug")("evolvus-platform-server:routes:api");
const _ = require("lodash");
const role = require("evolvus-role");
const application = require("evolvus-application");
const roleTypeMenuItemMap=require("evolvus-role-type-menu-item-map");

const roleAttributes = ["tenantId", "roleName", "roleType", "applicationCode", "description", "activationStatus", "processingStatus", "associatedUsers", "createdBy", "createdDate", "lastUpdatedDate"];

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
                body.lastUpdatedDate = new Date().toISOString();
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
                                    tenantId: "IVL",
                                    roleName: req.body.roleName,
                                    roleType: req.body.roleType,
                                    menuItems: req.body.menuItems,
                                    createdDate:new Date().toISOString(),
                                    createdBy:"System"
                                };
                                roleTypeMenuItemMap.save(object).then((obj) => {

                                    role.save(body).then((roleObj) => {
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
                    res.status(400).send(e.message);
                });
            } catch (e) {
                res.status(400).send(e.message);
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
                                var object = {
                                    applicationCode: req.body.applicationCode,
                                    roleName: req.body.roleName,
                                    roleType: req.body.roleType,
                                    menuItems: req.body.menuItems
                                }
                                roleTypeMenuItemMap.getOne("roleType", object.roleType).then((obj) => {
                                    roleTypeMenuItemMap.update(obj._id, object).then((updatedObj) => {
                                        role.update(body).then((roleObj) => {
                                            res.json(roleObj);
                                        }).catch((e) => {
                                            res.status(400).json({
                                                error: e
                                            });
                                        });
                                    }).catch((e) => {
                                        res.status(400).json({
                                            error: e
                                        });
                                    });
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

    router.route('/getAllRoleTypes')
        .get((req, res, next) => {
            try {
                role.getAll(-1).then((roles) => {
                    if (roles.length > 0) {
                        var codes = _.uniq(_.map(roles, 'roleType'));
                        res.send(codes);
                    } else {
                        res.status(204).json({
                            message: "No roleType found"
                        });
                    }
                }).catch((e) => {
                    debug(`failed to fetch all roleType Codes ${e}`);
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
}

