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
    const books = {}
    // STEP 1: generate books
    this.logger.info(ctx.action.name, 'STEP 1: generate books')
    do {
      const archive = files.shift()
      // prepare the data
      const buffer = readChunk.sync(archive, 0, 262)
      const type = archiveType(buffer)
      const urn = `urn:ouistity:books:${snakeCase(path.basename(archive, path.extname(archive)))}`
      let data = {}
      if (types.includes(type.ext)) {
        data = {
          urn,
          url: `${gatewayUrl}/api/books/${urn}`,
          archive,
          type
        }
        // remove old entries with this book urn
        const items = await this.broker.call('BooksDomain.find', { query: { urn } })
        if (items.length > 0) {
          do {
            const item = items.shift()
            await this.broker.call('BooksDomain.remove', { id: item._id })
          } while (items.length > 0)
        }
        // insert new book
        const result = await this.broker.call('BooksDomain.create', data)
        books[result.urn] = result._id
      }
    } while (files.length > 0)
    // STEP 2: generate pages for books
    this.logger.info(ctx.action.name, 'STEP 2: generate pages for books')
    const keys = Object.keys(books)
    const ids = []
    keys.map(key => {
      ids.push(books[key])
      return true
    })
    do {
      const id = ids.shift()
      await this.broker.call('ArchivesDomain.GeneratePagesCatalogCommand', { id })
    } while (ids.length > 0)
    return { success: true }
  } catch (e) {
    this.logger.error(e.message)
    return { success: false, error: e.message }
  }
}

module.exports = {
  handler
}
