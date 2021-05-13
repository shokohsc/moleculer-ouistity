const path = require('path')
const { snakeCase } = require('lodash')
const archiveType = require('archive-type')
const readChunk = require('read-chunk')

const { global: { gatewayUrl } } = require('../../../application.config')

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { archive } = ctx.params
    // prepare the data
    const buffer = readChunk.sync(archive, 0, 262)
    const type = archiveType(buffer)
    this.logger.info(ctx.action.name, '... zip enabled')
    // upsert books
    const urn = `urn:ouistity:books:${snakeCase(path.basename(archive, path.extname(archive)))}`
    const [book] = await this.broker.call('BooksDomain.find', { query: { urn } })
    if (book) {
      await this.broker.call('BooksDomain.remove', { id: book._id })
    }
    await this.broker.call('BooksDomain.create', {
      urn,
      url: `${gatewayUrl}/api/books/${urn}`,
      archive,
      type: type.ext
    })
    // upsert pages for this book
    await ctx.broker.$rabbitmq.publishExchange('amq.topic', 'moleculer.archives-domain-generate-book-pages-catalog.key', { id: urn })
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
