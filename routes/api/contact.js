const debug = require("debug")("evolvus-platform-server:routes:api:contact");
const _ = require("lodash");
const contact = require("@evolvus/evolvus-contact");
const shortid = require('shortid');
const LIMIT = process.env.LIMIT || 10;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const PAGE_SIZE = 10;
const ORDER_BY = process.env.ORDER_BY || {
  lastUpdatedDate: -1
};

const contactAttributes = ["contactName", "_id", "contactId", "city", "state", "country",
  "wfInstanceId", "processingStatus", "description", "emailId", "enabled", "contactCode", "phoneNumber", "mobileNumber", "faxNumber", "createdBy", "createdDate", "logo", "favicon", "zipCode"
];

var filterAttributes = contact.filterAttributes;
var sortAttributes = contact.sortableAttributes;
var workFlowAttributes = ["wfInstanceId", "processingStatus"];

module.exports = (router) => {

  router.route('/contact')
    .post((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      //const accessLevel = req.header(accessLevelHeader);
      // const entityId = req.header(entityIdHeader)
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      let body = _.pick(req.body, contactAttributes);

      try {
        body.tenantId = tenantId;
        body.createdBy = createdBy;
        body.createdDate = new Date().toISOString();
        body.lastUpdatedDate = body.createdDate;
        // body.entityId = entityId;
        // body.accessLevel = accessLevel;

        debug(`save API. tenantId :${tenantId}, createdBy :${createdBy},ipAddress :${ipAddress}, body :${JSON.stringify(body) }are parameters`);
        contact.save(tenantId, createdBy, ipAddress, body).then((ent) => {
          response.status = "200";
          response.description = `New contact has been added successfully and sent for the supervisor authorization`;
          response.data = ent;
          debug("response: " + JSON.stringify(response));
          res.status(response.status).json(response);
        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to add new contact. Due to ${e}`;
          response.data = {};
          var reference = shortid.generate();
          debug(`save promise failed due to :${e} and referenceId :${reference}`);
          debug("failed to save an contact" + JSON.stringify(response));
          res.status(response.status).json(response);
        });
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed due to :${e} , and reference id :${reference}`);
        response.status = "400";
        response.description = `Unable to add new contact. Due to ${e.message}`;
        response.data = {};
        debug("caught exception" + JSON.stringify(response));
        res.status(response.status).json(response);
      }
    });

  router.route('/contact/')
    .get((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      try {
        debug("query: " + JSON.stringify(req.query));
        var limit = _.get(req.query, "limit", LIMIT);
        var limitc = parseInt(limit);
        if (isNaN(limitc)) {
          throw new Error("limit must be a number")
        }
        var pageSize = _.get(req.query, "pageSize", PAGE_SIZE);
        var pageSizec = parseInt(pageSize);
        if (isNaN(pageSizec)) {
          throw new Error("pageSize must be a number")
        }
        var pageNo = _.get(req.query, "pageNo", 1);
        var pageNoc = parseInt(pageNo);
        if (isNaN(pageNoc)) {
          throw new Error("pageNo must be a number")
        }
        var skipCount = pageSizec * (pageNoc - 1);
        var filterValues = _.pick(req.query, filterAttributes);
        var filter = _.omitBy(filterValues, function(value, key) {
          return value.startsWith("undefined");
        });
        var sort = _.get(req.query, "sort", {});
        var orderby = sortable(sort);
        limitc = (+pageSizec < limitc) ? pageSizec : limitc;

        debug(`getAll API.tenantId :${tenantId}, createdBy :${JSON.stringify(createdBy)},ipAddress :${JSON.stringify(ipAddress)}, filter :${JSON.stringify(filter)}, orderby :${JSON.stringify(orderby)}, skipCount :${skipCount}, limit :${limitc} ,are parameters`);
        contact.find(tenantId, createdBy, ipAddress, filter, orderby, skipCount, limitc)
          .then((contacts) => {
            if (contacts.length > 0) {
              response.status = "200";
              response.description = "SUCCESS";
              response.data = contacts;
              res.status(response.status).json(response);
            } else {
              response.status = "200";
              response.data = [];
              response.description = "No contacts found";
              debug("response: " + JSON.stringify(response));
              res.status(response.status).json(response);
            }
          })
          .catch((e) => {
            var reference = shortid.generate();
            debug(`find promise failed due to :${e} and referenceId :${reference}`);
            response.status = "400",
              response.description = `Unable to find contact. Due to ${e}`
            response.data = e.toString()
            res.status(response.status).json(response);
          });
      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed due to :${e} and referenceId :${reference}`);
        response.status = "400",
          response.description = `Unable to find contact. Due to ${e}`;
        response.data = e.toString();
        res.status(response.status).json(response);
      }
    });



  router.route("/contact/:emailId")
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      // const accessLevel = req.header(accessLevelHeader);
      // const entityId = req.header(entityIdHeader);
      var updateContactMailID = req.params.emailId;
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      debug("query: " + JSON.stringify(req.query));
      let body = _.pick(req.body, contactAttributes);
      try {
        body.tenantId = tenantId;
        body.updatedBy = req.header(userHeader);;
        body.lastUpdatedDate = new Date().toISOString();
        debug(`Update API.tenantId :${tenantId},createdBy :${JSON.stringify(createdBy)},ipAddress :${ipAddress},updateContactMailID :${updateContactMailID}, body :${JSON.stringify(body)}, are parameters`);
        contact.update(tenantId, createdBy, ipAddress, updateContactMailID, body).then((updatedcontact) => {
          response.status = "200";
          response.description = `Contact has been modified successfully and sent for the supervisor authorization.`;
          response.data = body;
          debug("response: " + JSON.stringify(response));
          res.status(response.status).json(response);
        }).catch((e) => {
          response.status = "400";
          response.description = `Unable to modify contact . Due to ${e.message}`;
          response.data = e.toString();
          var reference = shortid.generate();
          debug(`Update promise failed due to :${e} and referenceId :${reference}`);
          res.status(response.status).json(response);
        });

      } catch (e) {
        var reference = shortid.generate();
        debug(`try catch failed due to :${e} , and reference id :${reference}`);
        response.status = "400";
        response.description = `Unable to modify contact . Due to ${e.message}`;
        response.data = e.toString();
        res.status(response.status).json(response);
      }
    });

  router.route("/private/api/contact/:id")
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      var id = req.params.id;
      // const accessLevel = req.header(accessLevelHeader);
      // const entityId = req.header(entityIdHeader)
      const response = {
        "status": "200",
        "description": "",
        "data": []
      };
      debug("query: " + JSON.stringify(req.query));
      try {
        let body = _.pick(req.body, contactAttributes);
        body.updatedBy = req.header(userHeader);
        body.lastUpdatedDate = new Date().toISOString();
        debug(` updateWorkFlow API.tenantId :${tenantId}, createdBy :${JSON.stringify(createdBy)}, ipAddress :${ipAddress}, id :${id}, body :${JSON.stringify(body)} `);
        contact.updateWorkflow(tenantId, createdBy, ipAddress, id, body).then((updatecontact) => {
          response.status = "200";
          response.description = `${id} contact has been modified successful and sent for the supervisor authorization.`;
          response.data = body;
          res.status(200)
            .json(response);
        }).catch((e) => {
          response.status = "400",
            response.description = `Unable to modify contact. Due to ${e}`;
          response.data = e.toString()
          res.status(response.status).json(response);
        });
      } catch (e) {
        response.status = "400",
          response.description = `Unable to modify contact. Due to ${e}`;
        response.data = e.toString()
        res.status(response.status).json(response);
      }
    });
};

function sortable(sort) {
  if (typeof sort === 'undefined' ||
    sort == null) {
    return ORDER_BY;
  }
  if (typeof sort === 'string') {
    var result = sort.split(",")
      .reduce((temp, sortParam) => {
        if (sortParam.charAt(0) == "-") {
          return _.assign(temp, _.fromPairs([
            [sortParam.replace(/-/, ""), -1]
          ]));
        } else {
          return _.assign(_.fromPairs([
            [sortParam.replace(/\+/, ""), 1]
          ]));
        }
      }, {});
    return result;
  } else {
    return ORDER_BY;
  }
}