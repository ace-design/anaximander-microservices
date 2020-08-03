const walkers = require('../../util/walkers');
const aParser = require('../../util/acornParser');
const fFiles = require('../../util/findFiles');
const path = require('path');
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
            if (subFile.endsWith(".js")) {
                filesContent.push({
                    file: subFile,
                    body: aParser.acornParser(subFile),
                });
            }
        });
    }
    let returnString = '[';
    filesContent.forEach(fC => {
        let collections = getMongoCollection(fC.body);
        let displayString = JSON.stringify(display(fC, collections));
        if (displayString && displayString !== "null") returnString += displayString + ",";
    });
    returnString = returnString.slice(0, -1);
    returnString += "]";
    console.log(returnString);
    return returnString;
}())

function getMongoCollection(body) {
    let collections = [];
    let [success, mongoConnect, ancestors] = walkers.recursiveWalkIn(body, "Identifier", "connect");
    if (!success) return null;
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
    if (!collections) return null;
    if (collections.length > 1) {
        let service = fContent.file.split(path.sep).filter(s => {
            return s.toLocaleLowerCase().indexOf('service') > -1;
        });
        let serviceName = service[0];
        if (!service || service.length === 0) {
            let serv = fContent.file.split(path.sep);
            serviceName = serv[serv.length -2];
        }
        let mCollections = []; let i = 1;
        collections.forEach(c => {
            mCollections.push({
                id : "c" + i,
                type : "database",
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
            id : serviceName ? serviceName : "sc1",
            vertices : mCollections
        };
    }
}