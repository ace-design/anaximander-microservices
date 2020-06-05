

class findRedisClient {

    body;
    redisVar;
    redisClient;

    constructor(body, redis) {
        this.body = body;
        this.redisVar = redis;
    }

    run() {
        this.body.forEach(n => {
            if (n.type === "VariableDeclaration") {
                if (n.declarations[0].init
                    && n.declarations[0].init.callee
                    && n.declarations[0].init.callee.object
                    && n.declarations[0].init.callee.object.name === this.redisVar
                    && n.declarations[0].init.callee.property
                    && n.declarations[0].init.callee.property.name) {
                    this.redisClient = n.declarations[0].id.name;
                }
            }
        });
    }
}

module.exports = findRedisClient;