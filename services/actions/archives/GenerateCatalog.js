const glob = require('glob-promise')

const { global: { archivesMountPath } } = require('../../../application.config')

/**
 * @swagger
 * /generate/catalog:
 *    post:
 *      description: Start the generation of the catalog
 *      tags: [Catalog]
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: source
 *          description: Pattern glob to scan books
 *          in: formData
 *          type: string
 *      responses:
 *        200:
 *          description: success or error
 */
const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    // find all files
    const { source } = ctx.params
    const regex = new RegExp(archivesMountPath, 'i')
    const directory = -1 === source.search(regex) ? `${archivesMountPath}/${source}` : source
    const files = glob.sync(directory)
    if (files.length === 0) { throw new Error('No files in source pattern!')}
    const archives = {}
    files.map(file => {
      this.logger.info(ctx.action.name, `archive: ${file} prepared and ready to rumble!`)
      archives[file] = file
      return true
    })
    if (archives.length === 0) {
      throw new Error('ERR_NO_FILES_IN_ASSETS_DATA')
    }
    const keys = Object.keys(archives)
    do {
      const key = keys.shift()
      const archive = archives[key]

      await ctx.broker.$pgPubSub.publish(this.settings.channel, { archive })
    } while (keys.length > 0)
    return { success: true }
  } catch (e) {
    /* istanbul ignore next */
    this.logger.error(ctx.action.name, e.message)
    /* istanbul ignore next */
    return { success: false, error: e.message }
  }
}

module.exports = {
  params: {
    source: { type: 'string' }
  },
  handler
}