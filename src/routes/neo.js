const Router = require('koa-router')
const utils = require('../utils')

const router = new Router()

router.post('/:app', async (ctx, next) => {
  console.log(ctx.request.body)
})


module.exports = {
  neo: router
}
