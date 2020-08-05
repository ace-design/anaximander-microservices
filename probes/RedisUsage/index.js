const walkers = require('../../util/walkers');
const aParser = require('../../util/acornParser');
const fFiles = require('../../util/findFiles');
const path = require('path');
const fs = require('fs');

(async function () {

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
        let redis = getRedisString(fC.body);
        if (redis) returnString += JSON.stringify(display(fC, !!redis)) + ",";
    });
    returnString = returnString.slice(0, -1);
    returnString += "]";
    console.log(returnString);
    return returnString;
}());

/**
 *
 * @param {acorn.Node|acorn.Node[]} body
 * @returns {null|String} the RedisString used in the file
 */
function getRedisString(body) {
    let redisString = walkers.recursiveWalkIn(body, "Literal", "redis");
    redisString = redisString[1];
    if (redisString[0] && redisString[0][0] && redisString[0][0].value) {
        return redisString[0][0].value;
    } else {
        return null;
    }
}

function display(fContent, redisString) {
    if (redisString) {
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
                    id : 's0',
                    type : 'service',
                    props : [
                        {
                            name : "redis",
                            value : "true"
                        }
                    ]
                }
            ]
        };
    }
}