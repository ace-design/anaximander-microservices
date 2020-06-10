const walkers = require('../../util/walkers');
const aParser = require('../../util/acornParser');
const fFiles = require('../../util/findFiles');

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
        let redis = getRedisString(fC.body);
        returnString += JSON.stringify(display(fC, !!redis));
    });
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
                            value : "true"
                        }
                    ]
                }
            ]
        };
    }
}