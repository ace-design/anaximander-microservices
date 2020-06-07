const walkers = require('../../util/walkers');

class findRedisUsage {

    body;
    redisString;

    /**
     *
     * @param {acorn.Node|acorn.Node[]} body body of a file.
     */
    constructor(body) {
        this.body = body;
    }

    run() {
        this.redisString = walkers.recursiveWalkIn(this.body, "Literal", "redis");
        this.redisString = this.redisString[1];
        if (this.redisString[0] && this.redisString[0][0] && redisString[0][0].value) {
            this.redisString = this.redisString[0][0].value;
        } else {
            this.redisString = null;
        }
    }
}

module.exports = findRedisUsage;