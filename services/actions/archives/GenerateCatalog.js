const glob = require('glob-promise')

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
 *        - name: pages
 *          description: Run reset pages for the books?
 *          in: formData
 *          type: boolean
 *      responses:
 *        200:
 *          description: success or error
 */
const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    // find all files
    const { source, pages } = ctx.params
    const files = glob.sync(source)
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
      await ctx.broker.$rabbitmq.publishExchange('amq.topic', 'moleculer.archives-domain-generate-book.key', { archive, pages })
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
    source: { type: 'string' },
    pages: { type: 'boolean'}
  },
  handler
}
