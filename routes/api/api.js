module.exports = (router) => {

  require("./application")(router);
  require("./role")(router);
  require("./menu")(router);
  require("./menuGroup")(router);
  require("./roleTypeMenuItemMap")(router);

};