const path = require('path')
const sh = require('exec-sh').promise
const { snakeCase, filter } = require('lodash')

const { global: { gatewayUrl } } = require('../../../application.config')

const ImagesExtensions = ['.jpg', '.png', '.jpeg']

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
    const { id } = ctx.params
    // get the book
    const [book] = await this.broker.call('BooksDomain.find', { query: { urn: id } })
    const { archive } = book
    // remove old entries with this book urn
    const items = await this.broker.call('PagesDomain.find', { query: { book: book.urn } })
    this.logger.info(ctx.action.name, book.urn, items.length)
    const entities = []
    if (items.length > 0) {
      this.logger.info(ctx.action.name, 'remove old entries with this book urn')
      do {
        const item = items.shift()
        await this.broker.call('PagesDomain.remove', { id: item._id }).catch(() => {
          // WARNING WHY??
        })
      } while (items.length > 0)
    }
    // analyse zip
    const { stdout } = await sh(`7z l "${archive}"`, true)
    const entries = parse(stdout)
    do {
      const { name } = entries.files.shift()
      // added only if extname is allowed
      if (ImagesExtensions.includes(path.extname(name))) {
        const urn = `urn:ouistity:books:${id}:pages:${snakeCase(name)}`
        entities.push({
          urn,
          book: book.urn,
          url: `${gatewayUrl}/api/v1/pages/${urn}`,
          image: `${gatewayUrl}/images/${urn}`,
          archive
        })
      }
    } while (entries.files.length > 0)
    // // batch insert
    await this.broker.call('PagesDomain.insert', { entities })
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
