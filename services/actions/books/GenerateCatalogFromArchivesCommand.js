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
        // reading content of zip
        data.content = await this.broker.call('ArchivesDomain.GetAllEntriesQuery', { archive, type: type.ext })
        // write the data
        await this.broker.call('BooksDomain.create', data)
        const result = await this.broker.call('BooksDomain.find')
        console.log(result)
      }
    } while (files.length > 0)
    return { success: true }
  } catch (e) {
    this.logger.error(e.message)
    return { success: false, error: e.message }
  }
}

module.exports = {
  handler
}
