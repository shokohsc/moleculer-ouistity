const path = require('path')
const AdmZip = require('adm-zip')
const { snakeCase } = require('lodash')

const { global: { gatewayUrl } } = require('../../../application.config')

const ImagesExtensions = ['.jpg', '.png', '.jpeg']

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { id } = ctx.params
    const book = await this.broker.call('BooksDomain.get', { id })
    const { type, archive } = book
    // zip
    let num = 1
    if (type.ext === 'zip') {
      // reading archives
      const zip = new AdmZip(archive)
      const zipEntries = zip.getEntries()
      zipEntries.forEach(function (zipEntry) {
        const { name, isDirectory } = zipEntry
        // added only if not a isDirectory === false && extname is allowed
        if (isDirectory === false) {
          const urn = `urn:ouistity::books:${id}:pages:${snakeCase(name)}`
          if (ImagesExtensions.includes(path.extname(name))) {
            const page = {
              urn,
              book: book.urn,
              url: `${gatewayUrl}/api/pages/${urn}`,
              archive,
              num
            }
            num += 1
            console.log(page)
          }
        }
      })
    }
    return { success: true }
  } catch (e) {
    this.logger.error(e.message)
    return { success: false, error: e.message }
  }
}

module.exports = {
  handler
}
