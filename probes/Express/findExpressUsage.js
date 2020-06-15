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
        await fFiles.walkFiles(file, function(err, result) {
            if (err) throw err;
            results = Array.from(new Set(result));
            results.forEach( subFile => {
                filesContent.push({
                    file : subFile,
                    body : aParser.acornParser(subFile),
                });
            });
        });
    }
    let returnString = '';
    filesContent.forEach(fC => {
        let resultString = getExpress(fC.body);
        returnString += JSON.stringify(display(fC, resultString[0], resultString[1]));
    });
    console.log(returnString);
    return returnString;
}())

function getExpress(body) {
    let expressString = walkers.recursiveWalkIn(body, "Literal", "express");
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
        let service = fContent.file.split('/').filter(s => {
            return s.toLocaleLowerCase().indexOf('service') > -1;
        })
        return {
            id : service ? service[0] ? service[0] : 'sc1' : 'sc1',
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