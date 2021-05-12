const path = require('path')
const glob = require('glob-promise')

const extensions = ['.zip', '.rar', '.cbz', '.cbr']

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { source = '../../../assets/data' } = ctx.params
    const sourcePath = path.resolve(__dirname, source)
    const files = glob.sync(`${sourcePath}/archives/**/*.*`)
    if (files.length === 0) {
      throw new Error('ERR_NO_FILES_IN_ASSETS_DATA')
    }
    do {
      const archive = files.shift()
      if (extensions.includes(path.extname(archive))) {
        await ctx.broker.$rabbitmq.publishExchange('amq.topic', 'moleculer.archives-domain-generate-book.key', { archive })
      }
    } while (files.length > 0)
    return { success: true }
  } catch (e) {
    /* istanbul ignore next */
    this.logger.error(ctx.action.name, e.message)
    /* istanbul ignore next */
    return { success: false, error: e.message }
  }
}

module.exports = {
  handler
}
