const jsdoc2md = require('jsdoc-to-markdown');
const fse = require("fs-extra");

async function insertApiDocs(filename) {
  const api = await jsdoc2md.render({
    files: filename || './src/index.js',
    "heading-depth": 1,
    separators: true
  });
  fse.writeFile('docs/API.md', api)
}

module.exports = insertApiDocs;