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
        let appString = findAppString(fC.body);
        let routes = getRoutes(fC.body, appString);
        returnString += JSON.stringify(display(fC, routes));
    });
    console.log(returnString);
    return returnString;
}())

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

function display(fContent, routes) {
    if (routes.length > 1) {
        let service = fContent.file.split('/').filter(s => {
            return s.toLocaleLowerCase().indexOf('service') > -1;
        });
        let rRoutes = []; let edges = []; let i = 0;
        routes.forEach(r => {
            rRoutes.push({
                id : "r" + i,
                type : "route",
                props : [
                    {
                        name : "path",
                        value : r.route
                    },
                    {
                        name : "verb",
                        value : r.type.toLocaleUpperCase()
                    }
                ]
            });
            edges.push({
                from : service ? service[0] ? service[0] : 'sc1' : 'sc1',
                to : "r" + i,
                type : "exposes"
            });
            i++;
        });
        return {
            id : service ? service[0] ? service[0] : 'sc1' : 'sc1',
            vertices : rRoutes,
            edges : edges
        };
    }
}