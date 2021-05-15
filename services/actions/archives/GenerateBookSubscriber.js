const path = require('path')
const { snakeCase } = require('lodash')

const { global: { gatewayUrl } } = require('../../../application.config')

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { archive, pages = false } = ctx.params
    // upsert books
    const urn = `urn:ouistity:books:${snakeCase(path.basename(archive, path.extname(archive)))}`
    const [book] = await ctx.broker.call('BooksDomain.filter', {
      query: {
        urn
      }
    })
    const data = {
      urn,
      url: `${gatewayUrl}/api/v1/books/${urn}`,
      archive
    }
    if (book) {
      await ctx.broker.call('BooksDomain.update', { id: book.id, data: { ...data, updatedAt: Date.now() } })
    } else {
      await ctx.broker.call('BooksDomain.insert', { data: { ...data, createdAt: Date.now() } })
    }
    // upsert pages for this book
    if (pages === true) {
      // remove old entries with this book urn
      await ctx.broker.call('PagesDomain.delete', { query: { book: urn } })
      await ctx.broker.$rabbitmq.publishExchange('amq.topic', 'moleculer.archives-domain-generate-book-pages-catalog.key', { book: data })
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
  handler
}
