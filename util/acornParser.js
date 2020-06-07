const acorn = require('acorn');
const path = require('path');
const fs = require('fs');

/**
 * Check if the path is a file, and parse it into a acorn.Node
 * @param {string} filePath
 * @returns {null|acorn.Node[]}
 */
exports.acornParser = function(filePath) {
    if (!fs.lstatSync(filePath).isFile() || path.extname(filePath) !== '.js') return null;
    const fContent = fs.readFileSync(filePath).toString();
    return acorn.parse(fContent).body;
}