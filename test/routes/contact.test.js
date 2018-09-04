var PORT = process.env.PORT || 8086;
const mongoose = require("mongoose");

process.env.MONGO_DB_URL = "mongodb://10.10.69.204:27017/TestApi";
/*
 ** Test /api/audit API's
 */
const debug = require("debug")("evolvus-platform-server.test.routes.api");
const app = require("../../server")
  .app;
const contactTestData = require("./contactTestData");
const randomstring = require("randomstring");

let chai = require("chai");
let chaiHttp = require("chai-http");
let should = chai.should();

chai.use(chaiHttp);

var serverUrl = "http://localhost:" + PORT;

describe("Testing routes", () => {
  before((done) => {
    app.on('contact_started', done());
  });


  describe("Testing save contact api", () => {

    it("should save contact and return same attribute values", (done) => {
      chai.request(serverUrl)
        .post("/api/contact")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user").set("X-IP-HEADER", "192.168.1.86")
        .send(contactTestData.validObject1)
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

    // it("should not save contact and return status 400", (done) => {
    //   chai.request(serverUrl)
    //     .post("/api/contact")
    //     .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
    //     .send({
    //       "country": "INDIA"
    //     })
    //     .end((err, res) => {
    //       if (err) {
    //         debug(`error in the test ${err}`);
    //         done(err);
    //       } else {
    //         res.should.have.status(400);
    //         done();
    //       }
    //     });
    // });

    // it("should not save contact and return status 400 and return data as emailID is required ", (done) => {
    //   chai.request(serverUrl)
    //     .post("/api/contact")
    //     .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
    //     .send(contactTestData.validObject2)
    //     .end((err, res) => {
    //       if (err) {
    //         debug(`error in the test ${err}`);
    //         done(err);
    //       } else {
    //         res.should.have.status(400);
    //         res.body.should.be.a("object");
    //         res.body.should.have.property('data').eql('emailId is required');
    //         done();
    //       }
    //     });
    // });

    it("should not save contact and return status 400", (done) => {
      chai.request(serverUrl)
        .post("/api/contact")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .send({
          "phoneNumber": "56565656456545455656",
          "faxnumber": "7896441233255465458"
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


  describe("Testing Get contact api", () => {

    it("Should return all the contact", (done) => {
      chai.request(serverUrl)
        .get("/api/contact/")
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
    it("Should return all the contact basedon filterCondition", (done) => {
      chai.request(serverUrl)
        .get("/api/contact/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "emailId": "xyz@gmail.com"
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

    it("Should return all the contacts based pageSize and PageNo", (done) => {
      chai.request(serverUrl)
        .get("/api/contact/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "emailId": "xyz@gmail.com",
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
        .get("/api/contact/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "emailId": "xyz@gmail.com",
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

    it("Should return all the contact based on limit if page size is 0", (done) => {
      chai.request(serverUrl)
        .get("/api/contact/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "emailId": "xyz@gmail.com",
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

    it("Should return the contacts based on sorting condition", (done) => {
      chai.request(serverUrl)
        .get("/api/contact")
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
        .get("/api/contact/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "emailId": "xyz@gmail.com",
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
        .get("/api/contact/")
        .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
        .query({
          "pageSize": "guyasgdjh",
          "emailId": "xyz@gmail.com"
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

    describe("Testing Update contact api", () => {
      it("Should update the contact based on emailId", (done) => {
        chai.request(serverUrl)
          .put("/api/contact/xyz@gmail.com")
          .set('X-ENTITY-ID', 'H001B001').set("X-TENANT-ID", "T001").set("X-ACCESS-LEVEL", "1").set("X-USER", "user")
          .send(contactTestData.validObject1)
          .end((err, res) => {
            if (err) {
              debug(`error in test ${err}`);
              done(err);
            } else {
              res.should.have.status(200);
              res.body.should.be.a("object");
              res.body.data.should.have.property("emailId")
                .eql("xyz@gmail.com");
              done();
            }
          });
      });
    });

  });
});