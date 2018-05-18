var PORT = process.env.PORT || 8080;
const mongoose = require("mongoose");

process.env.MONGO_DB_URL = "mongodb://localhost:27017/TestPlatform";
/*
 ** Test /api/audit API's
 */
const debug = require("debug")("evolvus-platform-server.test.routes.api");
const app = require("../../server")
  .app;
const randomstring = require("randomstring");

let chai = require("chai");
let chaiHttp = require("chai-http");
let should = chai.should();

chai.use(chaiHttp);

var serverUrl = "http://192.168.1.115:" + PORT;


describe("Testing routes", () => {
  var applicationCode;
  before((done) => {
    app.on('application_started', done());
  });


  describe("Testing save application api", () => {
    let application = {
      applicationName: "FLUX-CDA",
      applicationId: 100,
      applicationCode: randomstring.generate(4),
      description: "flux-cda"
    };

    it("should save application and return same attribute values", (done) => {
      chai.request(serverUrl)
        .post("/saveApplication")
        .send(application)
        .end((err, res) => {
          if (err) {
            debug(`error in the test ${err}`);
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.have.property('applicationName')
              .eql(application.applicationName);
            done();
          }
        });
    });

    it("should not save application and return status 400", (done) => {
      chai.request(serverUrl)
        .post("/saveApplication")
        .send({
          applicationName: "Docket"
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
});