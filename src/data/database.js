const Mongo = require('mongojs')
const constants = require('../constants')
const legacyDB = Mongo(`${process.env.DB_URI || 'localhost:27017/ourjson'}`, ['bins']).bins
const neoDB = Mongo(`${process.env.DB_URI || 'localhost:27017/neo'}`)


function promisifyQueries (db) {
  return {
    find (criteria = null, projection = null) {
      return new Promise((resolve, reject) => {
        if (!criteria) {
          reject('Malformed query')
        } else {
          db.find(criteria, projection, (err, docs) => {
            if (err) {
              reject(err)
            } else {
              if (docs.length > 1) {
                resolve(docs)
              } else if (docs.length === 1) {
                resolve(docs[0])
              } else {
                reject('Empty query')
              }
            }
          })
        }
      })
    },
    insert (docOrDocs = null) {
      return new Promise((resolve, reject) => {
        if (!docOrDocs) {
          reject('Malformed query')
        } else {
          db.insert(docOrDocs, (err, doc) => {
            if (err) {
              reject(err)
            } else {
              resolve(doc)
            }
          })
        }
      })
    },
    update (query = null, update = null, options = null) {
      return new Promise((resolve, reject) => {
        if (!query || !update) {
          reject('Malformed query')
        } else {
          db.update(query, update, options, (err, doc) => {
            if (err) {
              reject(err)
            } else {
              if (doc.ok === 1 && doc.nModified === 1) {
                resolve(doc)
              } else {
                reject(doc)
              }
            }
          })
        }
      })
    }
  }
}
const dbs = {
  legacyDB: promisifyQueries(legacyDB)
}

for (let app of Object.keys(constants.types)) {
  dbs[`${app}DB`] = promisifyQueries(neoDB.collection(app))
  neoDB.collection(app).createIndex({
    musedId: 1
  }, { unique: true, background: true })
}

module.exports = dbs
