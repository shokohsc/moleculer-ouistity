const sh = require('exec-sh').promise
const { snakeCase, filter } = require('lodash')

const { global: { gatewayUrl } } = require('../../../application.config')

const parse = function (data) {
  const entries = { files: [] }
  // split lines
  const content = data.toString().split('\n')
  const lines = filter(content, function (o) { return o !== '' })
  // file or not file
  lines.map(line => {
    const tmp = line.split('  ') // hack
    const words = filter(tmp, function (o) { return o !== '' })
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
    // get the book
    const { archive } = await ctx.broker.call('BooksDomain.get', { id: book })
    // remove old entries with this book urn
    await ctx.broker.call('PagesDomain.delete', { query: { book } })
    // analyse archive
    const { stdout } = await sh(`7z l "${archive}"`, true)
    const entries = parse(stdout)
    const entities = []
    do {
      const { name } = entries.files.shift()
      const urn = `${book}:pages:${snakeCase(name)}`
      entities.push({
        id: urn,
        book,
        url: `${gatewayUrl}/api/v1/pages/${urn}`,
        image: `${gatewayUrl}/images/${urn}`,
        archive
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
