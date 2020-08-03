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
    let returnString = "[";
    filesContent.forEach(fC => {
        let vertices = []; let i = 0;
        let redisClient = getRedisClient(fC.body, getRedis(fC.body));
        let mongoCollections = getMongoCollection(fC.body);
        let routes = getRoutes(fC.body, findAppString(fC.body));
        routes.forEach(route => {
            route.id = "r" + i;
            i++;
            let resultString = getUsageByRoutes(fC.body, route, redisClient, mongoCollections.length > 0, mongoCollections);
            if (resultString) vertices.push(formatVertice(fC, route, resultString));
        });
        if(vertices.length > 0) {
            returnString += JSON.stringify(display(fC, vertices));
            returnString += ",";
        }
    });
    returnString = returnString.slice(0, -1);
    returnString += "]";
    console.log(returnString);
    return returnString;
}())

function getUsageByRoutes(body, route, redisClient, mongoDB, mongoCollections) {
    let result = [];
    if (!body) return null;
    let routeNode = walkers.recursiveWalkIn(body, "Literal", route.route)[1][0][0];
    routeNode = walkers.getAncestors(body, routeNode)[2][2];
    if (redisClient) {
        routeNode.arguments.forEach(a => {
            if (a.body && a.body.body) {
                a.body.body.forEach(b => {
                    if (b.expression
                        && b.expression.callee.object.name === redisClient) {
                        result.redis = true;
                    }
                });
            }
        });
    }
    if (mongoDB && mongoCollections) {
        result.mongoDB = true;
        if (typeof result.mongoCollections === "undefined") result.mongoCollections = [];
        mongoCollections.forEach(mc => {
            let uses = walkers.recursiveWalkInArray(routeNode.arguments[1], "Identifier", mc.varName);
            let actionOnCollection = [];
            uses.forEach(u => {
                let action = u.property.name;
                if (!actionOnCollection.includes(action)) {
                    actionOnCollection.push(action);
                }
            });
            if (uses.length > 0) {
                result.mongoCollections.push({
                    [mc.collectionName] : actionOnCollection
                });
            }
        });
    }
    return result;
}

function getRoutes(body, appString) {
    let routes = [];
    let appUsage = walkers.recursiveWalkInArray(body, "Identifier", appString);
    appUsage.forEach(au => {
        if (au.type === "MemberExpression") {
            let auAncestors = walkers.getAncestors(body, au);
            auAncestors = auAncestors[2];
            let auAncestor = auAncestors[1];
            if (auAncestor.arguments && auAncestor.arguments.length > 0) {
                auAncestor.arguments.forEach(a => {
                    if (a.type === "Literal" &&
                        a.value !== 'env' &&
                        au.property.name !== 'use' &&
                        au.property.name !== "listen") {
                        routes.push({
                            type : au.property.name,
                            route : a.value
                        });
                    }
                })
            }
        }
    });
    return routes;
}

function findAppString(body) {
    let expressString = walkers.recursiveWalkIn(body, "Literal", "express");
    if (!expressString[0]) return null;
    expressString = expressString[1][0][0].value;
    let appString = walkers.recursiveWalkInArray(body, "Identifier", expressString);
    appString = appString[appString.length -1];
    ancestors = walkers.getAncestors(body, appString);
    ancestors = ancestors[2];
    ancestors.forEach(an => {
        if (an.type === "VariableDeclarator" &&
            an.init &&
            an.init.callee &&
            an.init.callee.name === expressString) {
            appString = an.id.name;
        }
    });
    return appString;
}

function getMongoCollection(body) {
    let collections = [];
    let [success, mongoConnect, ancestors] = walkers.recursiveWalkIn(body, "Identifier", "connect");
    if (!success) return [];
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

function getRedisClient(body, redisVar) {
    let redisClient = walkers.recursiveWalkInArray(body, "Identifier", redisVar);
    let resultString;
    redisClient.forEach(rc => {
        if (resultString) return;
        let rcAncestors = walkers.getAncestors(body, rc);
        if (rcAncestors[0]) {
            rcAncestors = rcAncestors[2];
            rcAncestors.forEach(rcA => {
                if (rcA.type === "VariableDeclarator"
                    && rcA.id
                    && rcA.init
                    && rcA.init.callee
                    && rcA.init.callee.object
                    && rcA.init.callee.object.name === redisVar) {
                    resultString = rcA.id.name;
                }
            })
        }
    });
    return resultString;
}

function getRedis(body) {
    let redisString = walkers.recursiveWalkIn(body, "Literal", "redis");
    redisString = redisString[1];
    if (redisString[0] && redisString[0][0] && redisString[0][0].value) {
        return redisString[0][0].value;
    } else {
        return null;
    }
}

function formatVertice(fContent, route, result) {
    if (route) {
        let service = fContent.file.split('/').filter(s => {
            return s.toLocaleLowerCase().indexOf('service') > -1;
        });
        let graphJSON = {
            id : route.id,
            type : "route",
            props : [
                {
                    name: "path",
                    value: route.route,
                },
                {
                    name : "verb",
                    value: route.type.toUpperCase(),
                }
            ]
        };
        if (result.redis) {
            graphJSON.props.push({
                name : "redis",
                value : true
            })
        }
        if (typeof result.mongoCollections === "object" && result.mongoCollections.length > 0) {
            result.mongoCollections.forEach( mc => {
                graphJSON = objectHasMongoCollections(graphJSON);
                let index = getMongoCollectionsIndex(graphJSON);
                let keys = Object.keys(mc);
                //console.log(mc[keys[0]]);
                for (let key of keys) {
                    mc[key].forEach(mcu => {
                        graphJSON.props[index].value.push({
                            name : key,
                            value : mcu
                        })
                    })
                }
            })
        }
        return graphJSON;
    }
}

function objectHasMongoCollections(graphJSON) {
    let hasMC = false;
    graphJSON.props.forEach(prop => {
        if (prop.name.toLocaleLowerCase() === "mongocollections") {
            hasMC = true;
        }
    });
    if (!hasMC) {
        graphJSON.props.push({
            name : "MongoCollections",
            value : []
        });
    }
    return graphJSON;
}

function getMongoCollectionsIndex(graphJSON) {
    for (let i =0; i<graphJSON.props.length; i++) {
        if (graphJSON.props[i].name.toLocaleLowerCase() === "mongocollections") {
            return i;
        }
    }
    return null;
}

function display(fContent, vertices) {
    let service = fContent.file.split(path.sep).filter(s => {
        return s.toLocaleLowerCase().indexOf('service') > -1;
    });
    let serviceName = service[0];
    if (!service || service.length === 0) {
        let serv = fContent.file.split(path.sep);
        serviceName = serv[serv.length -2];
    }
    return {
        id : serviceName ? serviceName : "sc1",
        vertices : vertices
    }
}

