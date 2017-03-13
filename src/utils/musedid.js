const possibleCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const crypto = require('crypto')
const types = require('../constants').types
const naughtyList = [
  /fuck/i,
  /cunt/i,
  /bitch/i,
  /penis/i,
  /twat/i,
  /cock/i,
  /dick/i,
  /pussy/i
]

const generateId = function (type) {
  let id = ''
  id = id.concat(types[type])
  let rnd = crypto.randomBytes(6)

  for (let i = 0; i < 6; i++) {
    id += possibleCharacters[rnd[i] % 62]
  }
  let swear = false
  for (let regex of naughtyList) {
    swear = id.match(regex)
  }
  if (swear) {
    return generateId(type)
  } else {
    return id
  }
}

module.exports = {
  generateId
}
