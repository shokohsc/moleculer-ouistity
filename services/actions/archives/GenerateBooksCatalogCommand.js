const path = require('path')
const { snakeCase } = require('lodash')
const archiveType = require('archive-type')
const readChunk = require('read-chunk')
const glob = require('glob-promise')

const { global: { gatewayUrl } } = require('../../../application.config')
const types = ['zip', 'rar']

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { source = '../../../assets/data' } = ctx.params
    const sourcePath = path.resolve(__dirname, source)
    const files = glob.sync(`${sourcePath}/archives/**/*.*`)
    // const books = {}
    // STEP 1: generate books
    this.logger.info(ctx.action.name, 'STEP 1: generate books')
    do {
      const archive = files.shift()
      // prepare the data
      const buffer = readChunk.sync(archive, 0, 262)
      const type = archiveType(buffer)
      if (types.includes(type.ext)) {
        // upsert books
        const urn = `urn:ouistity:books:${snakeCase(path.basename(archive, path.extname(archive)))}`
        const count = await this.broker.call('BooksDomain.count', { query: { id: urn } })
        const action = (count === 0) ? 'create' : 'update'
        this.logger.info(ctx.action.name, `${urn} action: ${action}`)
        await this.broker.call(`BooksDomain.${action}`, {
          id: urn,
          url: `${gatewayUrl}/api/books/${urn}`,
          archive,
          type
        })
        // upsert pages for this book
        await this.broker.call('ArchivesDomain.GeneratePagesCatalogCommand', { id: urn })
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
