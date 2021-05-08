const path = require('path')
const AdmZip = require('adm-zip')
const { snakeCase } = require('lodash')

const { global: { gatewayUrl } } = require('../../../application.config')

const ImagesExtensions = ['.jpg', '.png', '.jpeg']

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { id } = ctx.params
    // get the book
    const book = await this.broker.call('BooksDomain.get', { id })
    const { type, archive } = book
    // remove old entries with this book urn
    const items = await this.broker.call('PagesDomain.find', { query: { book: book.id } })
    this.logger.info(ctx.action.name, book.id, items.length)
    if (items.length > 0) {
      do {
        const item = items.shift()
        await this.broker.call('PagesDomain.remove', { id: item.id })
      } while (items.length > 0)
    }
    // analyse zip
    let num = 1
    if (type.ext === 'zip') {
      // reading archives
      const zip = new AdmZip(archive)
      const zipEntries = zip.getEntries()
      do {
        const zipEntry = zipEntries.shift()
        const { name } = zipEntry
        // added only if extname is allowed
        if (ImagesExtensions.includes(path.extname(name))) {
          const urn = `urn:ouistity::books:${id}:pages:${snakeCase(name)}`
          const data = {
            id: urn,
            book: book.id,
            url: `${gatewayUrl}/api/pages/${urn}`,
            archive,
            num
          }
          await this.broker.call('PagesDomain.create', data)
          num += 1
        }
      } while (zipEntries.length > 0)
    }
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
