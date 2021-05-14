const path = require('path')
const { Parser } = require('@comix/parser')

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { urn } = ctx.params
    const { filepath } = await ctx.broker.call('PagesDomain.getByUrn', { urn })
    console.log(path.normalize(filepath))
    const parser = new Parser()
    const comic = await parser.parse(path.normalize(filepath))
    return { debug: true }
  } catch (e) {
    /* istanbul ignore next */
    this.logger.error(ctx.action.name, e.message)
    /* istanbul ignore next */
    return Promise.reject(e)
  }
}

module.exports = {
  handler
}
