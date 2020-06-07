const walkers = require('../../util/walkers');

class findExpressUsage {

    /**
     *
     * @param {acorn.Node|acorn.Node[]} body body of a file.
     */
    constructor(body) {
        this.body = body;
        this.expressString = '';
        this.appString = null;
        this.ancestors = [];
    }

    /**
     * Find the variable used for Express and the var of it instance.
     */
    run() {
        this.expressString = walkers.recursiveWalkIn(this.body, "Literal", "express");
        this.expressString = this.expressString[1][0][0].value;
        this.appString = walkers.recursiveWalkInArray(this.body, "Identifier", this.expressString);
        this.appString = this.appString[this.appString.length -1];
        this.ancestors = walkers.getAncestors(this.body, this.appString);
        this.ancestors = this.ancestors[2];
        this.ancestors.forEach(an => {
            if (an.type === "VariableDeclarator" &&
                an.init &&
                an.init.callee &&
                an.init.callee.name === this.expressString) {
                this.appString = an.id.name;
            }
        });
    }
}


module.exports = findExpressUsage;