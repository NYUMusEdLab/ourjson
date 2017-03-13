const key = require('mongo-key-escape')
const useragent = require('useragent')

function filterkeys (json) {
  const finalObj = (Array.isArray(json)) ? [] : {}
  if (Array.isArray(json)) {
    json.forEach(function filterKeysArrayForEach (item, index) {
      finalObj[index] = (typeof item === 'object' && json[index] !== null) ? filterkeys(item) : item
    })
  } else {
    Object.keys(json).forEach(function filterKeysObjectForEach (item) {
      finalObj[key.escape(item)] = (typeof json[item] === 'object' && json[item] !== null) ? filterkeys(json[item]) : json[item]
    })
  }
  return finalObj
}

function unfilterkeys (json) {
  const finalObj = (Array.isArray(json)) ? [] : {}
  if (Array.isArray(json)) {
    json.forEach(function unfilterKeysArrayForEach (item, index) {
      finalObj[index] = (typeof item === 'object' && json[index] !== null) ? unfilterkeys(item) : item
    })
  } else {
    Object.keys(json).forEach(function unfilterKeysObjectForEach (item) {
      finalObj[key.unescape(item)] = (typeof json[item] === 'object' && json[item] !== null) ? unfilterkeys(json[item]) : json[item]
    })
  }
  return finalObj
}

const filterKeysMiddleware = function (ctx, next) {
  ctx.filteredBody = filterkeys(ctx.request.body)
  return next()
}

const recogniseApp = function (json) {
  return 'unknown'
}

const getRequestMetadata = function (ctx, next) {
  ctx.metadata = {
    ip: ctx.request.headers['x-forwarded-for'] || ctx.request.ip,
    useragent: useragent.parse(ctx.request.headers['user-agent']).toJSON()
  }
  return next()
}

module.exports = {
  filterKeysMiddleware,
  filterkeys,
  unfilterkeys,
  recogniseApp,
  getRequestMetadata
}
