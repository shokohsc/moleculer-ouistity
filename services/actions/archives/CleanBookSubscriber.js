const { promises: fs } = require('fs')

async function exists (path) {
  try {
    await fs.access(path)
    return true
  } catch (e){
    return false
  }
}

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { id, archive, urn } = ctx.params

    if (!await exists(archive)) {
      this.logger.info(ctx.action.name, `Deleting ${urn} with id: ${id}`)
      await ctx.broker.call('PagesDomain.delete', { query: { book: urn } })
      await ctx.broker.call('BooksDomain.delete', { query: { id } })
    }
    return { success: true }
  } catch (e) {
    /* istanbul ignore next */
    this.logger.info(ctx.action.name, e.message)
    /* istanbul ignore next */
    return Promise.reject(e)
  }
}

module.exports = {
  params: {
    id: { type: 'string'},
    archive: { type: 'string'},
    urn: { type: 'string'}
  },
  handler
}
