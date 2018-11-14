var debug = require("debug")("evolvus-latform-server:routes:api:mongoSeed");
var mongoseed = require("@evolvus/evolvus-seed-mongodb");
var ip = process.env.SERVICE_IP || "localhost";
var port = process.env.SERVICE_PORT || "8086";

module.exports = (router) => {
    router.route('/mongoSeed')
        .post((req, res, next) => {
            const response = {
                "status": "200",
                "data": {},
                "description": ""
            }
            try {
                var context = {
                    tenantId: req.body.corporateId,
                    entityId: req.body.entityId || 'H001B001',
                    ip: `${ip}:${port}` || "10.10.69.193:8086",
                    date: new Date().toISOString()
                };
                mongoseed.seedMongo(context).then((result) => {
                    response.status = "200";
                    response.description = result;
                    debug(`Response: ${JSON.stringify(response)}`);
                    res.json(response);
                }).catch(e => {
                    response.data = {};
                    response.description = `Unable to add seed data due to ${e}`;
                    response.status = "400";
                    debug(`Response: ${JSON.stringify(response)}`);
                    res.status(400).json(response);
                });
            } catch (error) {
                response.data = {};
                response.description = `Unable to add seed data due to ${error}`;
                response.status = "400";
                debug(`Response: ${JSON.stringify(response)}`);
                res.status(400).json(response);
            }
        });
}

