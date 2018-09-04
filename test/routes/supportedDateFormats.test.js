var PORT = process.env.PORT || 8086;
const mongoose = require("mongoose");

process.env.MONGO_DB_URL = "mongodb://10.10.69.204:27017/TestApi";
/*
 ** Test /api/audit API's
 */
const debug = require("debug")("evolvus-platform-server.test.routes.api");
const app = require("../../server")
  .app;
const supportedDateFormatsTestData = require("./supportedDateFormatsTestData");
const randomstring = require("randomstring");

let chai = require("chai");
let chaiHttp = require("chai-http");
let should = chai.should();

chai.use(chaiHttp);

var serverUrl = "http://localhost:" + PORT;

describe("Testing routes", () => {
  before((done) => {
    app.on('supportedDateFormats_started', done());
  });

  describe("Testing save supportedDateFormats api", () => {

    it("should save supportedDateFormats and return same attribute values", (done) => {
      chai.request(serverUrl)
        .post("/api/supportedDateFormats")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user").set("X-IP-HEADER", "192.168.1.86")
        .send(supportedDateFormatsTestData.validObject1)
        .end((err, res) => {
          if (err) {
            debug(`error in the test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a("object");
            done();
          }
        });
    });

    //   it("should not save supportedDateFormats and return status 400 and return data as formatCode is required ", (done) => {
    //     chai.request(serverUrl)
    //       .post("/api/supportedDateFormats")
    //       .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
    //       .send(supportedDateFormatsTestData.validObject2)
    //       .end((err, res) => {
    //         if (err) {
    //           debug(`error in the test ${err}`);
    //           done(err);
    //         } else {
    //           res.should.have.status(400);
    //           res.body.should.be.a("object");
    //           res.body.should.have.property('data').eql('formatCode is required');
    //           done();
    //         }
    //       });
    //   });

    it("should not save supportedDateFormats and return status 400", (done) => {
      chai.request(serverUrl)
        .post("/api/supportedDateFormats")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .send({
          "formatCode": ""
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

  describe("Testing Get supportedDateFormats api", () => {

    it("Should return all the supportedDateFormats", (done) => {
      chai.request(serverUrl)
        .get("/api/supportedDateFormats/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
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
    it("Should return all the supportedDateFormats basedon filterCondition", (done) => {
      chai.request(serverUrl)
        .get("/api/supportedDateFormats/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "formatCode": "DD/MM/YYYY"
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
    it("Should return all the supportedDateFormatss based on filterCondition", (done) => {
      chai.request(serverUrl)
        .get("/api/supportedDateFormats/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "formatCode": "DD/MM/YYYY"
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

    it("Should return all the supportedDateFormatss based pageSize and PageNo", (done) => {
      chai.request(serverUrl)
        .get("/api/supportedDateFormats/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "formatCode": "DD/MM/YYYY",
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
            res.body.data.length.should.be.eql(1);
            done();
          }
        });
    });

    it("Should throw the error if skip count is negative value", (done) => {
      chai.request(serverUrl)
        .get("/api/supportedDateFormats/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "formatCode": "DD/MM/YYYY",
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
            res.body.should.have.property("data").eql("MongoError: Skip value must be non-negative, but received: -2");
            done();
          }
        });
    });

    it("Should return all the supportedDateFormats based on limit if page size is 0", (done) => {
      chai.request(serverUrl)
        .get("/api/supportedDateFormats/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "formatCode": "DD/MM/YYYY",
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
            res.body.data.length.should.be.eql(1);
            done();
          }
        });
    });

    it("Should return the supportedDateFormatss based on sorting condition", (done) => {
      chai.request(serverUrl)
        .get("/api/supportedDateFormats")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "sort": "-lastUpdatedDate"
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

    it("Should throws an error like limit must be a number", (done) => {
      chai.request(serverUrl)
        .get("/api/supportedDateFormats/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "formatCode": "DD/MM/YYYY",
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
        .get("/api/supportedDateFormats/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "pageSize": "guyasgdjh",
          "formatCode": "DD/MM/YYYY"
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
  });

  describe("Testing Update supportedDateFormats api", () => {
    it("Should update the supportedDateFormats based on formatCode", (done) => {
      chai.request(serverUrl)
        .put("/api/supportedDateFormats/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .send(supportedDateFormatsTestData.validObject1)
        .end((err, res) => {
          if (err) {
            debug(`error in test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a("object");
            res.body.data.should.have.property("formatCode")
              .eql("DD/MM/YYYY");
            done();
          }
        });
    });
  });
});