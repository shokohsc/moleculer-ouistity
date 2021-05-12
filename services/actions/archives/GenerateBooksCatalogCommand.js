const path = require('path')
const { snakeCase } = require('lodash')
const archiveType = require('archive-type')
const readChunk = require('read-chunk')
const glob = require('glob-promise')

const { global: { gatewayUrl } } = require('../../../application.config')
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
    // STEP 1: generate books
    this.logger.info(ctx.action.name, 'STEP 1: generate books')
    do {
      const archive = files.shift()
      if (extensions.includes(path.extname(archive))) {
        // prepare the data
        const buffer = readChunk.sync(archive, 0, 262)
        const type = archiveType(buffer)
        if (type.ext === 'zip') {
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
          await this.broker.call('ArchivesDomain.GeneratePagesCatalogCommand', { id: urn })
        }
        if (type.ext === 'rar') {
          this.logger.info(ctx.action.name, '... rar enabled')
        }
      }
    } while (files.length > 0)
    return { success: true }
  } catch (e) {
    this.logger.error(ctx.action.name, e.message)
    return { success: false, error: e.message }
  }
}

module.exports = {
  handler
}
