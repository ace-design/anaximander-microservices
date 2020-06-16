const walkers = require('../../util/walkers');
const aParser = require('../../util/acornParser');
const fFiles = require('../../util/findFiles');
const fs = require('fs');

(async function() {

    let file = process.argv[2];
    let filesContent = [];
    if (fFiles.isFile(file)) {
        filesContent.push({
            file : file,
            body : aParser.acornParser(file),
        });
    }
    else if (fs.lstatSync(file).isDirectory()) {
        let results = await fFiles.walk(file);
        results.forEach( subFile => {
            filesContent.push({
                file : subFile,
                body : aParser.acornParser(subFile),
            });
        });
    }
    let returnString = '';
    filesContent.forEach(fC => {
        let collections = getMongoCollection(fC.body);
        returnString += JSON.stringify(display(fC, collections));
    });
    console.log(returnString);
    return returnString;
}())

function getMongoCollection(body) {
    let collections = [];
    let [success, mongoConnect, ancestors] = walkers.recursiveWalkIn(body, "Identifier", "connect");
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
                let nodeAncestors = walkers.getAncestors(body, n);
                nodeAncestors = nodeAncestors[2];
                collections.push({
                    varName : nodeAncestors[2].left.name,
                    collectionName : nodeAncestors[2].right.arguments[0].value
                });
            }
        })
    }
    return collections;
}

function display(fContent, collections) {
    if (collections.length > 1) {
        let service = fContent.file.split('/').filter(s => {
            return s.toLocaleLowerCase().indexOf('service') > -1;
        });
        let mCollections = []; let i = 1;
        collections.forEach(c => {
            mCollections.push({
                id : "c" + i,
                type : "collection",
                props : [
                    {
                        name : c.varName,
                        value : c.collectionName
                    }
                ]
            });
            i++;
        });
        return {
            id : service ? service[0] ? service[0] : 'sc1' : 'sc1',
            vertices : mCollections
        };
    }
}