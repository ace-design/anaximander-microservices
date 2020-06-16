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
        let mongoDB = getMongoDbUsage(fC.body);
        returnString += JSON.stringify(display(fC, mongoDB));
    });
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
                            name : "mongoDB",
                            value : "true"
                        }
                    ]
                }
            ]
        };
    }
}