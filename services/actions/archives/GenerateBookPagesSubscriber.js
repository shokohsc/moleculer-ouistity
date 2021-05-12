const path = require('path')
const AdmZip = require('adm-zip')
const { RarFilesPackage } = require('rar-stream')
const { snakeCase } = require('lodash')

const { global: { gatewayUrl } } = require('../../../application.config')

const ImagesExtensions = ['.jpg', '.png', '.jpeg']

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { id } = ctx.params
    // get the book
    const [book] = await this.broker.call('BooksDomain.find', { query: { urn: id } })
    const { type, archive } = book
    // remove old entries with this book urn
    const items = await this.broker.call('PagesDomain.find', { query: { book: book.urn } })
    this.logger.info(ctx.action.name, book.urn, items.length)
    const entities = []
    if (items.length > 0) {
      this.logger.info(ctx.action.name, 'remove old entries with this book urn')
      do {
        const item = items.shift()
        await this.broker.call('PagesDomain.remove', { id: item._id })
      } while (items.length > 0)
    }
    // analyse zip
    let num = 1
    if (type === 'rar') {
      console.log(archive)
      const rar = new RarFilesPackage([archive])
      console.log(rar)
      const rarFiles = await rar.parse()
      console.log(rarFiles)
    }
    if (type === 'zip') {
      // reading archives
      const zip = new AdmZip(archive)
      const zipEntries = zip.getEntries()
      do {
        const zipEntry = zipEntries.shift()
        const { name } = zipEntry
        // added only if extname is allowed
        if (ImagesExtensions.includes(path.extname(name))) {
          const urn = `urn:ouistity:books:${id}:pages:${snakeCase(name)}`
          entities.push({
            urn,
            book: book.urn,
            url: `${gatewayUrl}/api/v1/pages/${urn}`,
            image: `${gatewayUrl}/images/${urn}`,
            archive,
            num
          })
          num += 1
        }
      } while (zipEntries.length > 0)
    }
    // batch insert
    await this.broker.call('PagesDomain.insert', { entities })
    return { success: true }
  } catch (e) {
    console.log(e.message)
    /* istanbul ignore next */
    this.logger.error(ctx.action.name, e.message)
    /* istanbul ignore next */
    return { success: false, error: e.message }
  }
}

module.exports = {
  handler
}
