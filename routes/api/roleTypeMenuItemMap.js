const roleTypeMenuItemMap=require("evolvus-role-type-menu-item-map");

module.exports=(router)=> {
    router.route('/roleTypeMenuItemMap/find/:roleName')
        .get((req, res, next) => {
            try {
               
            } catch (e) {
                res.status(400).send(e);
            }
        });
}

