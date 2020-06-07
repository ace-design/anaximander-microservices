const walkers = require('../../util/walkers');

class findRoutes {

    constructor(body, appString = null) {
        this.body = body;
        this.appString = appString;
        this.appUsage = [];
        this.routes = [];
    }

    run() {
        this.appUsage = walkers.recursiveWalkInArray(this.body, "Identifier", this.appString);
        this.appUsage.forEach(au => {
            if (au.type === "MemberExpression") {
                let auAncestors = walkers.getAncestors(this.body, au);
                auAncestors = auAncestors[2];
                let auAncestor = auAncestors[1];
                if (auAncestor.arguments && auAncestor.arguments.length > 0) {
                    auAncestor.arguments.forEach(a => {
                        if (a.type === "Literal" &&
                            a.value !== 'env' &&
                            au.property.name !== 'use' &&
                            au.property.name !== "listen") {
                            this.routes.push({
                                type : au.property.name,
                                route : a.value
                            });
                        }
                    })
                }
            }
        });
    }
}

module.exports = findRoutes;