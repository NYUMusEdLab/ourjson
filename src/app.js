const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const Router = require('koa-router')
const utils = require('./utils')
const routes = require('./routes')

const app = new Koa()

app.use(bodyParser())
const mainrouter = new Router()

mainrouter.use(utils.getRequestMetadata)
mainrouter.use('/bins', routes.legacy.routes(), routes.legacy.allowedMethods())
mainrouter.use('/store/v2', routes.neo.routes(), routes.neo.allowedMethods())


app
  .use(mainrouter.routes())
  .use(mainrouter.allowedMethods())

app.listen(3000)
