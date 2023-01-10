const { global: { archivesMountPath } } = require('../../../application.config')

/**
 * @swagger
 * /clean/catalog:
 *    post:
 *      description: Start the cleaning of the catalog
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
    this.logger.info(ctx.action.name)

    const { source } = ctx.params
    const books = await ctx.broker.call('BooksDomain.getBooksArchiveUrn', { source })

    const keys = Object.keys(books)
    do {
      const key = keys.shift()
      const book = books[key]
      await ctx.broker.$rabbitmq.publishExchange('amq.topic', 'moleculer.archives-domain-clean-book.key', book)
    } while (keys.length > 0)

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
    source: { type: 'string', default: `${archivesMountPath}/weekly/` }
  },
  handler
}
