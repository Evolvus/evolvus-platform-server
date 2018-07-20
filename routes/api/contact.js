const debug = require("debug")("evolvus-platform-server:routes:api:contact");
const _ = require("lodash");
const contact = require("@evolvus/evolvus-contact");

const LIMIT = process.env.LIMIT || 10;
const tenantHeader = "X-TENANT-ID";
const userHeader = "X-USER";
const ipHeader = "X-IP-HEADER";
const entityIdHeader = "X-ENTITY-ID";
const accessLevelHeader = "X-ACCESSLEVEL"

const PAGE_SIZE = 10;

const contactAttributes = ["tenantId", "firstName", "middleName", "lastName", "emailId", "emailVerified", "phoneNumber", "mobileNumber", "mobileVerified", "faxNumber", "companyName", "address1", "address2", "city", "state", "country", "zipCode", "createdDate", "lastUpdatedDate"];
const filterAttributes = contact.filterAttributes;
const sortAttributes = contact.sortAttributes;



module.exports = (router) => {
  router.route('/contact/')
    .get((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const accessLevel = req.header(accessLevelHeader);
      const entityId = req.header(entityIdHeader)
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      debug("query: " + JSON.stringify(req.query));
      var limit = _.get(req.query, "limit", LIMIT);
      var pageSize = _.get(req.query, "pageSize", PAGE_SIZE);
      var pageNo = _.get(req.query, "pageSize", 1);
      var skipCount = pageSize * (pageNo - 1);
      var filter = _.pick(req.query, filterAttributes);
      var sort = _.get(req.query, "sort", {});
      var orderby = sortable(sort);

      try {

        Promise.all([contact.find(tenantId, filter, orderby, skipCount, +limit), contact.counts(tenantId, filter)])
          .then((contacts) => {
            if (contacts[0].length > 0) {
              response.status = "200";
              response.description = "SUCCESS";
              response.totalNoOfPages = Math.ceil(contacts[1] / pageSize);
              response.totalNoOfRecords = contacts[1];
              response.data = contacts[0];

              res.status(200)
                .send(JSON.stringify(response, null, 2));
            } else {
              response.status = "404";
              response.description = "No contacts found";
              debug("response: " + JSON.stringify(response));
              res.status(200)
                .send(JSON.stringify(response, null, 2));
            }
          })
          .catch((e) => {
            debug(`failed to fetch all contacts ${e}`);
            response.status = "400",
              response.description = `Unable to fetch all contacts`
            response.data = e.toString()
            res.status(response.status).send(JSON.stringify(response, null, 2));
          });
      } catch (e) {
        debug(`caught exception ${e}`);
        response.status = "400",
          response.description = `Unable to fetch all contacts`
        response.data = e.toString()
        res.status(response.status).send(JSON.stringify(response, null, 2));
      }
    });

  router.route("/contact/:tenantId")
    .put((req, res, next) => {
      const tenantId = req.header(tenantHeader);
      const createdBy = req.header(userHeader);
      const ipAddress = req.header(ipHeader);
      const accessLevel = req.header(accessLevelHeader);
      const entityId = req.header(entityIdHeader)
      const response = {
        "status": "200",
        "description": "",
        "data": {}
      };
      debug("query: " + JSON.stringify(req.query));
      try {
        let body = _.pick(req.body, contactAttributes);
        body.updatedBy = req.header(userHeader);;
        body.lastUpdatedDate = new Date().toISOString();
        contact.find(tenantId, {
            // "name": body.name,
            // "emailId": body.contactCode
          }, {}, 0, 1)
          .then((result) => {
            if (_.isEmpty(result[0])) {
              throw new Error(`contact ${body.name},  already exists `);
            }
            if ((!_.isEmpty(result[0])) && (result[0].tenantId != req.params.tenantId)) {
              throw new Error(`contact ${body.firstName} already exists`);
            }
            contact.update(tenantId, body.tenantId, body).then((updatedcontact) => {
              response.status = "200";
              response.description = `${body.firstName} contact has been modified successful and sent for the supervisor authorization.`;
              response.data = body;
              res.status(200)
                .send(JSON.stringify(response, null, 2));

            }).catch((e) => {
              response.status = "400",
                response.description = `Unable to modify contact ${body.firstName}. Due to ${e.message}`
              response.data = e.toString()
              res.status(response.status).send(JSON.stringify(response, null, 2));
            });
          }).catch((e) => {
            response.status = "400",
              response.description = `Unable to modify contact ${body.firstName}. Due to ${e.message}`
            response.data = e.toString()
            res.status(response.status).send(JSON.stringify(response, null, 2));
          });
      } catch (e) {
        response.status = "400",
          response.description = `Unable to modify contact ${body.firstName}. Due to ${e.message}`
        response.data = e.toString()
        res.status(response.status).send(JSON.stringify(response, null, 2));
      }
    });



};

function sortable(sort) {
  if (typeof sort === 'undefined' ||
    sort == null) {
    return {};
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
    return {};
  }
}
