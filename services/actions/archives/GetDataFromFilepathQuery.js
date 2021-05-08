const AdmZip = require('adm-zip')
const { snakeCase } = require('lodash')

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { archive, type, book } = ctx.params
    // zip
    if (type === 'zip') {
      // reading archives
      const zip = new AdmZip(archive)
      const zipEntries = zip.getEntries()

      const data = []
      zipEntries.forEach(function (zipEntry) {
        const { name, isDirectory } = zipEntry
        // just in case this file is in archive
        if (name === 'ComicInfo.xml') {
          // ...
        }
        // added only if not a isDirectory === false
        if (isDirectory === false) {
          const urn = `urn:ouistity::books:${book}:pages:${snakeCase(name)}`
          data.push({ urn, name })
        }
      })
      return { total: data.length, data }
    }
    // rar
    // others
    return { total: 0, data: [] }
  } catch (e) {
    this.logger.error(e.message)
    return { total: 0, data: [] }
  }
}

module.exports = {
  handler
}
