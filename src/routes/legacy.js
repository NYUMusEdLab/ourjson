const Router = require('koa-router')
const utils = require('../utils')
const dbs = require('../data')
const legacyDB = dbs.legacyDB
const appNameMap = require('../constants').appNameMap

const router = new Router()

router.post('/', utils.filterKeysMiddleware, async ctx => {
  let appType = ''
  // check if app sends us appName
  if (Object.keys(appNameMap).indexOf(ctx.filteredBody.app) !== -1) {
    appType = appNameMap[ctx.filteredBody.app]
  } else {
    appType = utils.recogniseApp(ctx.filteredBody)
  }
  ctx.response.set('Warning', 'This endpoint is now deprecated. Please switch to /v2/ API (documentation at github.com/nyumusedlab/ourjson) ASAP.')
  let musedId = utils.generateId(appType)
  const saveObject = {
    musedId,
    eventLog: [{
      type: 'create',
      meta: {
        ip: ctx.metadata.ip,
        useragent: ctx.metadata.useragent
      },
      timestamp: new Date()
    }],
    user: {},
    metadata: {
      app: ctx.filteredBody.app
    },
    data: ctx.filteredBody
  }
  try {
    const doc = await dbs[`${appType}DB`].insert(saveObject)
    ctx.response.status = 201
    ctx.response.body = {
      'uri': `https://localhost:3000/v2/${appType}/${musedId}`,
      doc
    }
  } catch (err) {
    ctx.response.status = 400
    ctx.response.body = {
      err
    }
  }
})

router.get('/:binId', async (ctx, next) => {
  const binId = ctx.params.binId
  if (!binId) {
    ctx.response.status = 404
    ctx.body = {
      status: 404,
      message: 'Not Found',
      description: 'There was no bin ID sent'
    }
  } else {
    try {
      const data = utils.unfilterkeys((await legacyDB.find({ binId })).json)
      ctx.body = data
    } catch (err) {
      ctx.response.status = 500
      ctx.body = err
    }
  }
})

// router.put('/:binId', async (ctx, next) => {
// })

module.exports = {
  legacy: router
}
