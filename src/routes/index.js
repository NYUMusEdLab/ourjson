const legacy = require('./legacy')
const neo = require('./neo')

module.exports = Object.assign({}, legacy, neo)
