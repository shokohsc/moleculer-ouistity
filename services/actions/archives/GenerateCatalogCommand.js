const path = require('path')
const glob = require('glob-promise')

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    // find all files
    const { source = '../../../assets/data', pages = false } = ctx.params
    const sourcePath = path.resolve(__dirname, source)
    const files = glob.sync(`${sourcePath}/archives/**/*.cb*`)
    const archives = {}
    files.map(file => {
      archives[path.basename(file)] = file
      return true
    })
    if (archives.length === 0) {
      throw new Error('ERR_NO_FILES_IN_ASSETS_DATA')
    }
    const keys = Object.keys(archives)
    do {
      const key = keys.shift()
      const archive = archives[key]
      await ctx.broker.$rabbitmq.publishExchange('amq.topic', 'moleculer.archives-domain-generate-book.key', { archive, pages })
    } while (keys.length > 0)
    return { success: true }
  } catch (e) {
    console.log(e)
    /* istanbul ignore next */
    this.logger.error(ctx.action.name, e.message)
    /* istanbul ignore next */
    return { success: false, error: e.message }
  }
}

module.exports = {
  handler
}
