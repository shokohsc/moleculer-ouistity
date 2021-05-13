const path = require('path')
const { snakeCase } = require('lodash')

const { global: { gatewayUrl } } = require('../../../application.config')

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { archive } = ctx.params
    // upsert books
    const urn = `urn:ouistity:books:${snakeCase(path.basename(archive, path.extname(archive)))}`
    await ctx.broker.call('BooksDomain.insert', {
      data: {
        id: urn,
        url: `${gatewayUrl}/api/books/${urn}`,
        archive
      }
    })
    // upsert pages for this book
    await ctx.broker.$rabbitmq.publishExchange('amq.topic', 'moleculer.archives-domain-generate-book-pages-catalog.key', { book: urn })
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
