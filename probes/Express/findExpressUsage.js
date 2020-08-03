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
        let resultString = getExpress(fC.body);
        if (resultString) returnString += JSON.stringify(display(fC, resultString[0], resultString[1])) + ",";
    });
    returnString = returnString.slice(0, -1);
    returnString += "]";
    console.log(returnString);
    return returnString;
}())

function getExpress(body) {
    let expressString = walkers.recursiveWalkIn(body, "Literal", "express");
    if (!expressString[0]) return null;
    expressString = expressString[1][0][0].value;
    let appString = walkers.recursiveWalkInArray(body, "Identifier", expressString);
    appString = appString[appString.length -1];
    let ancestors = walkers.getAncestors(body, appString);
    ancestors = ancestors[2];
    ancestors.forEach(an => {
        if (an.type === "VariableDeclarator" &&
            an.init &&
            an.init.callee &&
            an.init.callee.name === expressString) {
            appString = an.id.name;
        }
    });
    return [expressString, appString];
}

function display(fContent, expressString, appString) {
    if (expressString && appString) {
        let service = fContent.file.split(path.sep).filter(s => {
            return s.toLocaleLowerCase().indexOf('service') > -1;
        });
        let serviceName = service[0];
        if (!service || service.length === 0) {
            let serv = fContent.file.split(path.sep);
            console.log(serv);
            serviceName = serv[serv.length -2];
        }
        return {
            id : serviceName ? serviceName : "sc1",
            vertices : [
                {
                    id : 's1',
                    type : 'service',
                    props : [
                        {
                            name : "express",
                            value : "true"
                        }
                    ]
                }
            ]
        };
    }
}