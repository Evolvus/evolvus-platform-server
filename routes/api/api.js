module.exports = (router) => {

    require("./application")(router);
    require("./role")(router);
    require("./menuItem")(router);
    require("./menuGroup")(router);

};

