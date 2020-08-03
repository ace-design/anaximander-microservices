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
        let mongoDB = getMongoDbUsage(fC.body);
        if (mongoDB) returnString += JSON.stringify(display(fC, mongoDB));
    });
    returnString = returnString.slice(0, -1);
    returnString += "]";
    console.log(returnString);
    return returnString;
}())

function getMongoDbUsage(body) {
    let mongoDB;
    let mongoDBBody = walkers.recursiveWalkIn(body, "Literal", "mongodb");
    if (!mongoDBBody[0]) return null;
    let mongoDBNode = mongoDBBody[2][mongoDBBody[2].length - 3];
    if (mongoDBBody[2][3] &&
        mongoDBBody[2][3].property &&
        mongoDBBody[2][3].property.name === "MongoClient") {
        mongoDB = mongoDBNode.id.name;
    }
    return mongoDB;
}

function display(fContent, mongoDB) {
    if (mongoDB) {
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
            vertices : [
                {
                    id : 's1',
                    type : 'service',
                    props : [
                        {
                            name : "mongoDB",
                            value : "true"
                        }
                    ]
                }
            ]
        };
    }
}