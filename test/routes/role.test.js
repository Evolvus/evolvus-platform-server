var PORT = process.env.PORT || 8086;
const mongoose = require("mongoose");

process.env.MONGO_DB_URL = "mongodb://10.10.69.204:27017/TestPlatform_Dev";
/*
 ** Test /api/audit API's
 */
const debug = require("debug")("evolvus-platform-server.test.routes.api");
const app = require("../../server")
  .app;
const roleTestData = require("./roleTestData");
//const randomstring = require("randomstring");

let chai = require("chai");
let chaiHttp = require("chai-http");
let should = chai.should();

chai.use(chaiHttp);

var serverUrl = "http://localhost:" + PORT;

describe("Testing routes", () => {
  before((done) => {
    app.on('application_started', done());
  });

  describe("Testing save role api", () => {

    it("should save role and return same attribute values", (done) => {
      chai.request(serverUrl)
        .post("/api/role")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .send(roleTestData.validObject1)
        .end((err, res) => {
          if (err) {
            debug(`error in the test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            done();
          }
        });
    });

    it("should not save role and return status 400", (done) => {
      chai.request(serverUrl)
        .post("/api/role")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .send({
          "roleName": "Tester"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in the test ${err}`);
            done(err);
          } else {
            res.should.have.status(400);
            done();
          }
        });
    });

    it("should not save role and return status 400 and return description as applicationCode is undefined ", (done) => {
      chai.request(serverUrl)
        .post("/api/role")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .send(roleTestData.invalidObject1)
        .end((err, res) => {
          if (err) {
            debug(`error in the test ${err}`);
            done(err);
          } else {
            res.should.have.status(400);
            res.body.should.be.a("object");
            res.body.should.have.property('description').eql('Unable to add new role ADMIN_EIGHT. Due to Error: No Application with undefined found');
            done();
          }
        });
    });

    it("should not save role and return status 400", (done) => {
      chai.request(serverUrl)
        .post("/api/entity")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .send({
          "applicationCode": "Dockethhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in the test ${err}`);
            done(err);
          } else {
            res.should.have.status(400);
            done();
          }
        });
    });

  });

  describe("Testing Get role api", () => {

    it("Should return all the roles", (done) => {
      chai.request(serverUrl)
        .get("/api/role/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.data.should.be.a('array');
            res.body.data.length.should.be.eql(4);
            done();
          }
        });
    });

    it("Should return all the roles basedon filterCondition", (done) => {
      chai.request(serverUrl)
        .get("/api/role/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "processingStatus": "PENDING_AUTHORIZATION"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.data.should.be.a('array');
            res.body.data.length.should.be.eql(1);
            done();
          }
        });
    });

    it("Should return all the roles based on filterCondition", (done) => {
      chai.request(serverUrl)
        .get("/api/role/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "processingStatus": "PENDING_AUTHORIZATION"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.data.should.be.a('array');
            res.body.data.length.should.be.eql(2);
            done();
          }
        });
    });

    it("Should return all the roles based pageSize and PageNo", (done) => {
      chai.request(serverUrl)
        .get("/api/role/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "processingStatus": "PENDING_AUTHORIZATION",
          "pageSize": "5",
          "pageNo": "1"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.data.should.be.a('array');
            res.body.data.length.should.be.eql(2);
            done();
          }
        });
    });

    it("Should throw the error if skip count is negative value", (done) => {
      chai.request(serverUrl)
        .get("/api/role/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "processingStatus": "PENDING_AUTHORIZATION",
          "pageSize": "-2",
          "pageNo": "2"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(400);
            res.body.should.be.a("object");
            res.body.should.have.property("data").eql("Error: skipCount must be positive value or 0");
            done();
          }
        });
    });

    it("Should return all the roles based on limit if page size is 0", (done) => {
      chai.request(serverUrl)
        .get("/api/role/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "processingStatus": "PENDING_AUTHORIZATION",
          "pageSize": "0",
          "pageNo": "1"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.data.should.be.a('array');
            res.body.data.length.should.be.eql(2);
            done();
          }
        });
    });

    it("Should return the roles based on sorting condition", (done) => {
      chai.request(serverUrl)
        .get("/api/role")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "sort": "-processingStatus,-lastUpdatedDate"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.data.should.be.a('array');
            res.body.data.length.should.be.eql(4);
            done();
          }
        });
    });

    it("Should throws an error like limit must be a number", (done) => {
      chai.request(serverUrl)
        .get("/api/role/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "processingStatus": "PENDING_AUTHORIZATION",
          "pageSize": "10",
          "pageNo": "1",
          "limit": "fdkglud"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(400);
            res.body.should.be.a("object");
            res.body.should.have.property("data").eql("Error: limit must be a number");
            done();
          }
        });
    });

    it("Should throws an error like pageSize must be a number", (done) => {
      chai.request(serverUrl)
        .get("/api/role/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "pageSize": "guyasgdjh",
          "peocessingstatus": "PENDING_AUTHORIZATION"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(400);
            res.body.should.be.a("object");
            res.body.should.have.property("data").eql("Error: pageSize must be a number");
            done();
          }
        });
    });

    it("Should throws an error like pageNo must be a number", (done) => {
      chai.request(serverUrl)
        .get("/api/role/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "pageNo": "guyasgdjh",
          "peocessingstatus": "PENDING_AUTHORIZATION"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(400);
            res.body.should.be.a("object");
            res.body.should.have.property("data").eql("Error: pageNo must be a number");
            done();
          }
        });
    });

    it("Should return the role based on wfInstanceId", (done) => {
      chai.request(serverUrl)
        .get("/api/role/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "wfInstanceId": "s71Hbc6Q8"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.data.should.be.a('array');
            res.body.data.length.should.be.eql(1);
            done();
          }
        });
    });

    it("Should return the role based on applicationCode", (done) => {
      chai.request(serverUrl)
        .get("/api/role/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "applicationCode": "SANDSTORM"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.data.should.be.a('array');
            res.body.data.length.should.be.eql(3);
            done();
          }
        });
    });

    it("Should return the error `No role found` if the applicationCode is not exists", (done) => {
      chai.request(serverUrl)
        .get("/api/role/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "IVL").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "applicationCode": "dhgfhyyh"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.should.have.property("description").eql("No role found");
            done();
          }
        });
    });

    it("Should return the role based on roleName", (done) => {
      chai.request(serverUrl)
        .get("/api/role/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "roleName": "ADMIN_ONE"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.data.should.be.a('array');
            res.body.data.length.should.be.eql(1);
            done();
          }
        });
    });

    it("Should return error if the roleName is not exists", (done) => {
      chai.request(serverUrl)
        .get("/api/role/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "IVL").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "roleName": "dgdgh"
        })
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.should.have.property("description").eql("No role found");
            done();
          }
        });
    });

  });

  describe("Testing Update role api", () => {

    it("Should update the role based on roleName", (done) => {
      chai.request(serverUrl)
        .put("/api/role/ADMIN_ONE")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .send(roleTestData.updateObject)
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.should.have.property('description')
              .to.eql("ADMIN_ONE Role has been modified successful and sent for the supervisor authorization.");
            done();
          }
        });
    });

    it("Should not update the role if the roleName is not exists", (done) => {
      chai.request(serverUrl)
        .put("/api/role/sdfgdgh")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .send(roleTestData.updateObject)
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(400);
            done();
          }
        });
    });

  });
});