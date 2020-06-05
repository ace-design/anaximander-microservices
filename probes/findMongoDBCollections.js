const walkers = require('../util/walkers');

class findMongoDBCollections {

    body;
    collections = [];

    constructor(body) {
        this.body = body;
    }


    run() {
        let [success, mongoConnect, ancestors] = walkers.recursiveWalkIn(this.body, "Identifier", "connect");
        let ancestorsDbClient = ancestors[2];
        let dbClient, db;
        if (ancestorsDbClient.arguments[1].params[1].name) {
            dbClient = ancestorsDbClient.arguments[1].params[1].name;
            if (ancestorsDbClient.arguments[1].body.body[0].alternate) {
                let [success, dbClientNode, dbClientAncestors] = walkers.recursiveWalkIn(ancestorsDbClient.arguments[1].body, "Identifier", dbClient);
                if (success) {
                    db = dbClientAncestors[3].left.name;
                }
            }

        }
        if (db) {
            let nodes = walkers.recursiveWalkInArray(ancestorsDbClient, "Identifier", db);
            nodes.forEach(n => {
                if (n.object &&
                    n.object.name === db &&
                    n.property &&
                    n.property.name.toLocaleLowerCase() === "collection") {
                    let nodeAncestors = getAncestors(body, n);
                    nodeAncestors = nodeAncestors[2];
                    this.collections.push(nodeAncestors[2].left.name);
                }
            })
        }
    }
}

module.exports = findMongoDBCollections;