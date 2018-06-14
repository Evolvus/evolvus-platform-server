const debug = require("debug")("evolvus-platform-server:routes:api");
const _ = require("lodash");
const menuItem = require("evolvus-menu-item");
const application = require("evolvus-application");
const roleTypeMenuItemMap=require("evolvus-role-type-menu-item-map");


const menuItemAttributes = ["menuItemCode", "title", "icon", "menuItemType", "applicationCode", "tenantId"];

module.exports = (router) => {
    router.route("/menuItem")
        .post((req, res, next) => {
            try {
                let body = _.pick(req.body, menuItemAttributes);
                body.createdBy = "SYSTEM";
                body.creationDate = new Date().toISOString();
                application.getOne("applicationCode", body.applicationCode).then((app) => {

                    if (_.isEmpty(app)) {
                        throw new Error(`No Application with ${body.applicationCode} found`);
                    } else {
                        menuItem.save(body).then((menuItemObj) => {
                            res.send(menuItemObj);
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
                console.log("kavya ");
                
                console.log(req.params.applicationCode);
                
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

    // router.route('/findMenuItemsByRoleName/:roleName')
    //     .get((req, res, next) => {
    //         try {
    //             let codeValue = req.params.roleName;
    //             roleTypeMenuItemMap.getMany("roleName", codeValue).then((app) => {
    //                 res.send(app);
    //             }).catch((e) => {
    //                 console.log(e);
    //                 res.status(400).send(e);
    //             });
    //         } catch (e) {
    //             console.log(e);
    //             res.status(400).send(e);
    //         }
    //     });

};

