const sh = require('exec-sh').promise
const path = require('path')
const { snakeCase, filter } = require('lodash')

const { global: { gatewayUrl } } = require('../../../application.config')

const parse = function (data) {
  const entries = { files: [], type: false }
  // split lines
  const content = data.toString().split('\n')
  const lines = filter(content, function (o) { return o !== '' })
  // file or not file
  lines.map(line => {
    const tmp = line.split('  ') // hack
    const words = filter(tmp, function (o) { return o !== '' })
    // path
    if (words[0].search(/Path/) !== -1) {
      entries.path = words[0].split(' = ')[1].toLowerCase()
    }
    // type
    if (words[0].search(/Type/) !== -1) {
      entries.type = words[0].split(' = ')[1].toLowerCase()
    }
    // files content
    if (words.length === 4) {
      switch (true) {
        case (words[3].search(/files/) !== -1):
          entries.count = parseInt(words[3].split(' ')[0])
          break
        case !isNaN(parseInt(words[2])):
          entries.files.push({
            name: words[3],
            size: parseInt(words[1]),
            compressed: parseInt(words[2]),
            datetime: `${words[0].split(' ')[0]} ${words[0].split(' ')[1]}`
          })
      }
    }
    return true
  })
  return entries
}

const handler = async function (ctx) {
  try {
    this.logger.info(ctx.action.name, ctx.params)
    const { book } = ctx.params
    // analyse archive
    const { stdout } = await sh(`7z l "${book.archive}"`, true)
    const entries = parse(stdout)
    const entities = []
    do {
      const entry = entries.files.shift()
      const urn = `${book.urn}:pages:${snakeCase(path.basename(entry.name, path.extname(entry.name)))}`
      entities.push({
        urn,
        book: book.urn,
        url: `${gatewayUrl}/api/v1/pages/${urn}`,
        image: `${gatewayUrl}/images/${urn}`,
        path: entries.path,
        type: entries.type,
        ...entry
      })
    } while (entries.files.length > 0)
    // // batch insert
    await ctx.broker.call('PagesDomain.insert', { data: entities })
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
