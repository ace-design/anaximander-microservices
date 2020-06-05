const walkers = require('../util/walkers');

class findMongoDBUsage {

    body;
    mongoDB;
    mongoDBBody;
    mongoDBNode;

    /**
     *
     * @param {acorn.Node|acorn.Node[]} body body of a file.
     */
    constructor(body) {
        this.body = body;
    }

    run() {
        this.mongoDBBody = walkers.recursiveWalkIn(this.body, "Literal", "mongodb");
        if (!this.mongoDBBody[0]) return null;
        this.mongoDBNode = this.mongoDBBody[2][this.mongoDBBody[2].length - 3];
        if (this.mongoDBBody[2][3] &&
            mongoDBBody[2][3].property &&
            mongoDBBody[2][3].property.name === "MongoClient") {
            this.mongoDB = this.mongoDBNode.id.name;
        }
    }
}

module.exports = findMongoDBUsage;