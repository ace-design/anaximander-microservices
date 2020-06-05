/**
 *
 * @param {acorn.Node[]|acorn.Node} body
 * @param {string} typeResearch
 * @param {string} name
 * @param {acorn.Node|null} parent
 * @returns {(boolean|*)[]}
 */
exports.recursiveWalkIn = function(body, typeResearch, name, parent = null) {
    let value = [];
    let ancestors = [];
    let success = false;
    if (Array.isArray(body)) {
        for (let i=0; i<body.length;i++) {
            [success, value, ancestors] = recursiveWalkIn(body[i], typeResearch, name, body);
            if (success) {
                ancestors.push(body[i]);
                return [success, value, ancestors];
            }
        }
    } else {
        for (let prop in body) {
            if (body.hasOwnProperty(prop)) {
                if (prop === "name" && typeResearch === body.type && body[prop] === name) {
                    value.push(parent);
                    success = true;
                    ancestors.push(body);
                    return [success, value, ancestors];
                } else if (prop === "value" && typeResearch === body.type && body[prop] === name) {
                    value.push(parent);
                    success = true;
                    ancestors.push(body);
                    return [success, value, ancestors];
                }
                if (typeof body[prop] === "object") {
                    [success, value, ancestors] = recursiveWalkIn(body[prop], typeResearch, name, body);
                    if (success) {
                        ancestors.push(body);
                        return [success, value, ancestors];
                    }
                }
            }
        }
    }
    return [success, value, ancestors];
}

/**
 *
 * @param {acorn.Node[]} body
 * @param {string} typeResearch
 * @param {string} name
 * @param {acorn.Node|null} parent
 * @returns {acorn.Node[]}
 */
exports.recursiveWalkInArray = function(body, typeResearch, name, parent = null) {
    let values = [];
    if (Array.isArray(body)) {
        for (let i=0; i<body.length;i++) {
            let returnedValues = recursiveWalkInArray(body[i], typeResearch, name, body);
            if (returnedValues.length > 0) {
                returnedValues.forEach(rv => {
                    values.push(rv);
                });
            }
        }
    } else {
        for (let prop in body) {
            if (body.hasOwnProperty(prop)) {
                if (prop === "name" && typeResearch === body.type && body[prop] === name) {
                    values.push(parent);
                }
                if (typeof body[prop] === "object") {
                    let returnedValues = recursiveWalkInArray(body[prop], typeResearch, name, body);
                    if (returnedValues.length > 0) {
                        returnedValues.forEach(rv => {
                            values.push(rv);
                        });
                    }
                }
            }
        }
    }
    return values;
}

/**
 *
 * @param {acorn.Node[]} body
 * @param {acorn.Node} node
 * @param {acorn.Node|null} parent
 * @returns {(boolean|*|[])[]}
 */
exports.getAncestors = function(body, node, parent = null) {
    let value;
    let ancestors = [];
    let success = false;
    if (Array.isArray(body)) {
        for (let i=0; i<body.length;i++) {
            [success, value, ancestors] = getAncestors(body[i], node, body);
            if (success) {
                ancestors.push(body[i]);
                return [success, value, ancestors];
            }
        }
    } else if (body === node) {
        success = true;
        value = body;
        ancestors.push(body);
        return [success, value, ancestors];
    } else {
        for (let prop in body) {
            if (body.hasOwnProperty(prop)) {
                if (typeof body[prop] === "object") {
                    [success, value, ancestors] = getAncestors(body[prop], node, body);
                    if (success) {
                        ancestors.push(body);
                        return [success, value, ancestors];
                    }
                }
            }
        }
    }
    return [success, value, ancestors];
}