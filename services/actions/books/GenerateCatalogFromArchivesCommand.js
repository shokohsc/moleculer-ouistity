const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    return { success: true }
  } catch (e) {
    this.logger.error(e.message)
    return { success: false, error: e.message }
  }
}

module.exports = {
  handler
}
