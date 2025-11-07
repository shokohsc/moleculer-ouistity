const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { query, offset, limit } = ctx.params
    const index = await this.getIndex()

    return await index.search(query, { offset, limit })
  } catch (e) {
    /* istanbul ignore next */
    this.logger.error(ctx.action.name, e.message)
    /* istanbul ignore next */
    return { success: false, error: e.message }
  }
}

module.exports = {
  params: {
    query: { type: 'string' },
    offset: { type: 'number', optional: true },
    limit: { type: 'number', optional: true }
  },
  handler
}