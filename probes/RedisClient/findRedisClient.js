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
        let redis = getRedis(fC.body);
        let resultString = getRedisClient(fC.body, redis);
        returnString += JSON.stringify(display(fC, resultString));
    });
    console.log(returnString);
    return returnString;
}())


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

function display(fContent, redisClient) {
    if (redisClient) {
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
                            name : "redis",
                            value : redisClient
                        }
                    ]
                }
            ]
        };
    }
}