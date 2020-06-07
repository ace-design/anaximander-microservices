const walkers = require('../../util/walkers');

class findUsageByRoute {

    constructor(body, route, redis, redisClient, mongoDB, mongoCollections) {
        this.body = body;
        this.route = route;
        this.redis = redis;
        this.redisClient = redisClient;
        this.mongoDB = mongoDB;
        this.mongoCollections = mongoCollections;
        this.result = {};
    }

    run() {
        if (!this.body) return null;
        let routeNode = walkers.recursiveWalkIn(this.body, "Literal", this.route.route)[1][0][0];
        routeNode = walkers.getAncestors(this.body, routeNode)[2][2];
        if (this.redisClient) {
            routeNode.arguments.forEach(a => {
                if (a.body && a.body.body) {
                    a.body.body.forEach(b => {
                        if (b.expression
                            && b.expression.callee.object.name === this.redisClient) {
                            this.result.redis = true;
                        }
                    });
                }
            });
        }
        if (this.mongoDB && this.mongoCollections) {
            this.result.mongoDB = true;
            if (typeof this.result.mongoCollections === "undefined") this.result.mongoCollections = [];
            this.mongoCollections.forEach(mc => {
                let uses = walkers.recursiveWalkInArray(routeNode.arguments[1], "Identifier", mc);
                let actionOnCollection = [];
                uses.forEach(u => {
                    let action = u.property.name;
                    if (!actionOnCollection.includes(action)) {
                        actionOnCollection.push(action);
                    }
                });
                if (uses.length > 0) {
                    this.result.mongoCollections.push({
                        [mc] : actionOnCollection
                    });
                    console.log(this.result.mongoCollections);
                }
            });
        }
    }
}

module.exports = findUsageByRoute;