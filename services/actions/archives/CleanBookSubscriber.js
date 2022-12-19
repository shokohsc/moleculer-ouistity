const sh = require('exec-sh').promise

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { id, archive, urn } = ctx.params

    const { stderr } = await sh(`ls -lah "${archive}"`, true)
    const exists = '' === stderr
    if (!exists) {
      this.logger.info(ctx.action.name, `Deleting ${urn}`)
      // delete pages
      await ctx.broker.call('PagesDomain.delete', { book: urn })

      // delete book
      await ctx.broker.call('BooksDomain.delete', { id: id })
    }
    return { success: true }
  } catch (e) {
    /* istanbul ignore next */
    this.logger.error(ctx.action.name, e.message)
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
