


exports.generateDotChartFile = function(result) {
    let resultDotFile = "";
    const redis = "Redis", mongoDB = "MongoDB";
    result.forEach(r => {
        if (r.file && r.routes) {
            let serviceNodeName = r.service ? r.service : path.basename(r.file).substr(0, path.basename(r.file).length - 3) + "Service";
            let redisSet = false, mongoDBSet = false, mongoCollections = [];
            resultDotFile += `digraph ${serviceNodeName} {\n\n`;
            r.routes.forEach(route => {
                let routeName = route.route.match("/(.*)/");
                if (null !== routeName) routeName = routeName[1];
                else {
                    routeName = route.route.substr(1, route.route.length);
                }
                resultDotFile += `${routeName} [shape=circle]\n`;
                if (route.redis && !redisSet) {
                    redisSet = true;
                    resultDotFile += `${redis} [shape=doublecircle]\n`;
                    console.log(resultDotFile);
                }
                if (route.redis) {
                    resultDotFile += `${routeName} -> ${redis} [style=dashed]\n`;
                }
                if (route.mongoDB && !mongoDBSet) {
                    mongoDBSet = true;
                    resultDotFile += `${mongoDB} [shape=doublecircle]\n`;
                }
                if (route.mongoDB && route.mongoCollections && route.mongoCollections.length >= 1) {
                    route.mongoCollections.forEach(mc => {
                        mc = Object.keys(mc)[0];
                        if (!mongoCollections.includes(mc)) {
                            resultDotFile += `${mc} [shape=component]\n`;
                            resultDotFile += `${mc} -> ${mongoDB} [style=dashed]\n`;
                            mongoCollections.push(mc);
                        }
                        resultDotFile += `${routeName} -> ${mc} [style=dashed]\n`
                    })
                }
            });
        }
        resultDotFile += `\n}\n`
    });
    fs.writeFile('./dotfile.txt', resultDotFile, err => {
        if (err) console.error(err);
    })
}