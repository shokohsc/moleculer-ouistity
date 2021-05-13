const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    // const { archive } = ctx.params
    return { success: true }
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
